<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacturadorService
{
    protected string $baseUrl;
    protected ?string $token = null;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('FACTURADOR_URL', 'http://127.0.0.1:8000'), '/');
    }

    /**
     * Hace login en el motor de facturación y guarda el token.
     */
    public function login(): bool
    {
        try {
            $response = Http::acceptJson()->post("{$this->baseUrl}/api/login", [
                'email' => env('FACTURADOR_EMAIL'),
                'password' => env('FACTURADOR_PASSWORD'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->token = $data['token'] ?? null;
                return !is_null($this->token);
            }

            Log::error('Facturador Login Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Facturador Login Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envía una factura/boleta al motor de facturación.
     */
    public function enviarFactura(array $payload): array
    {
        if (!$this->token) {
            if (!$this->login()) {
                return [
                    'success' => false,
                    'error' => 'No se pudo autenticar con el motor de facturación.',
                ];
            }
        }

        try {
            $response = Http::withToken($this->token)
                ->acceptJson()
                ->post("{$this->baseUrl}/api/invoices/generate", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            // Si el token expiró (401), reintentar con login nuevo
            if ($response->status() === 401) {
                $this->token = null;
                if ($this->login()) {
                    $response = Http::withToken($this->token)
                        ->acceptJson()
                        ->post("{$this->baseUrl}/api/invoices/generate", $payload);

                    if ($response->successful()) {
                        return $response->json();
                    }
                }
            }

            return [
                'success' => false,
                'error' => 'Error del motor: ' . $response->body(),
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Excepción: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Transforma un Pedido de la cafetería al formato que espera el motor.
     */
    public function transformarPedido($pedido, array $cliente): array
    {
        $items = collect($pedido->productos)->map(function ($producto, $index) {
            return [
                'code' => (string) ($producto['id'] ?? 'PLATO-' . ($index + 1)),
                'description' => $producto['nombre'] ?? 'Plato',
                'quantity' => (int) ($producto['cantidad'] ?? 1),
                'unit_price' => (float) ($producto['precio'] ?? 0),
                'idproducto' => (int) ($producto['id'] ?? 1),
            ];
        })->values()->toArray();

        $documento = $cliente['documento'] ?? '';
        $esFactura = strlen($documento) === 11;

        return [
            'serie' => $esFactura ? 'F001' : 'B001',
            'correlativo' => 1,
            'tipo_documento' => $esFactura ? '01' : '03',
            'incluidoigv' => true,
            'client' => [
                'ruc' => $esFactura ? $documento : null,
                'dni' => !$esFactura && strlen($documento) === 8 ? $documento : null,
                'razon_social' => $esFactura ? ($cliente['nombre'] ?? 'Cliente') : null,
                'nombres' => !$esFactura ? ($cliente['nombre'] ?? 'Cliente') : null,
                'direccion' => $cliente['direccion'] ?? '-',
                'ubigeo' => '150101',
                'departamento' => 'LIMA',
                'provincia' => 'LIMA',
                'distrito' => 'LIMA',
            ],
            'items' => $items,
            'vendedor' => [
                'nombre' => $pedido->empleado?->name ?? 'Cafetería',
            ],
        ];
    }
}