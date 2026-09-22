<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\Team;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class ClienteService
{
    /**
     * Mapping between SUNAT document type codes and client document types.
     *
     * @var array<string, string>
     */
    private const SUNAT_A_CLIENTE = [
        '01' => 'ruc',
        '03' => 'dni',
    ];

    /**
     * Map a SUNAT document type code ('01'|'03') to the client document type ('ruc'|'dni').
     */
    public function tipoDocumentoCliente(string $tipoDocumento): ?string
    {
        return self::SUNAT_A_CLIENTE[$tipoDocumento] ?? null;
    }

    /**
     * Determine whether the given document should be tracked as a client.
     *
     * Anonymous sales ("00000000") are ignored. The real name is optional;
     * if missing, a generic name is generated when the client is created.
     */
    public function documentoValido(string $tipoDocumento, string $documento): bool
    {
        $tipo = $this->tipoDocumentoCliente($tipoDocumento);

        if ($tipo === null) {
            return false;
        }

        $documento = trim($documento);

        if ($documento === '') {
            return false;
        }

        if (strlen($documento) !== ($tipo === 'ruc' ? 11 : 8)) {
            return false;
        }

        return preg_match('/^(?!0+$)\d+$/', $documento) === 1;
    }

    /**
     * Register or update a client from an emitted comprobante.
     *
     * The client is only created once the number of purchases reaches the
     * team-configured threshold (default 6). The real name is kept when
     * provided; otherwise an existing name is preserved.
     */
    public function sincronizarDesdeVenta(
        int $teamId,
        string $tipoDocumento,
        string $documento,
        ?string $nombre = null
    ): ?Cliente {
        if (! $this->documentoValido($tipoDocumento, $documento)) {
            return null;
        }

        $tipoCliente = $this->tipoDocumentoCliente($tipoDocumento);
        $documento = trim($documento);
        $nombre = trim((string) $nombre);

        $pedidosTotal = $this->pedidosQuery($teamId, $tipoDocumento, $documento)->count();

        $cliente = Cliente::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->where('tipo_documento', $tipoCliente)
            ->where('documento', $documento)
            ->first();

        if (! $cliente) {
            $minimo = $this->minComprasDelTeam($teamId);

            if ($pedidosTotal < $minimo) {
                return null;
            }

            $cliente = new Cliente([
                'team_id' => $teamId,
                'tipo_documento' => $tipoCliente,
                'documento' => $documento,
                'nombre' => $nombre !== '' ? $nombre : "Cliente {$documento}",
                'estado' => Cliente::ESTADO_INACTIVO,
            ]);
        } elseif ($nombre !== '') {
            $cliente->nombre = $nombre;
        }

        return $this->recalcular($cliente, $teamId, $tipoDocumento, $documento, true);
    }

    /**
     * Recalculate the statistics and state of every client of a team.
     */
    public function sincronizarTeam(int $teamId): void
    {
        $sunatPorCliente = array_flip(self::SUNAT_A_CLIENTE);

        Cliente::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->whereNotNull('documento')
            ->get()
            ->each(function (Cliente $cliente) use ($teamId, $sunatPorCliente): void {
                $tipoSunat = $sunatPorCliente[$cliente->tipo_documento] ?? null;

                if ($tipoSunat === null || ! $cliente->documento) {
                    return;
                }

                $this->recalcular($cliente, $teamId, $tipoSunat, $cliente->documento, true);
            });
    }

    /**
     * Recalculate and persist the activity statistics for a client.
     */
    public function recalcular(
        Cliente $cliente,
        int $teamId,
        string $tipoDocumento,
        string $documento,
        bool $guardar = true
    ): Cliente {
        $base = $this->pedidosQuery($teamId, $tipoDocumento, $documento);
        $recientes = (clone $base)->where('created_at', '>=', now()->subDays(30));

        $pedidos30d = (clone $recientes)->count();
        $cliente->pedidos_total = (clone $base)->count();
        $cliente->pedidos_30d = $pedidos30d;
        $cliente->total_gastado_30d = (float) (clone $recientes)->sum('total');
        $cliente->total_gastado = (float) (clone $base)->sum('total');

        $ultimaVisita = (clone $base)->max('created_at');
        $cliente->ultima_visita = $ultimaVisita ? Carbon::parse($ultimaVisita) : null;
        $cliente->estado = Cliente::calcularEstado($pedidos30d);

        if ($guardar) {
            $cliente->save();
        }

        return $cliente;
    }

    /**
     * Global statistics for the clients dashboard header.
     *
     * @return array{total: int, activos: int, vip: int, inactivos: int, totalGastado: float}
     */
    public function estadisticas(int $teamId): array
    {
        $clientes = Cliente::withoutGlobalScopes()->where('team_id', $teamId)->get();

        return [
            'total' => $clientes->count(),
            'activos' => $clientes->where('estado', Cliente::ESTADO_ACTIVO)->count(),
            'vip' => $clientes->where('estado', Cliente::ESTADO_VIP)->count(),
            'inactivos' => $clientes->where('estado', Cliente::ESTADO_INACTIVO)->count(),
            'totalGastado' => (float) $clientes->sum('total_gastado_30d'),
        ];
    }

    private function pedidosQuery(int $teamId, string $tipoDocumento, string $documento): Builder
    {
        return Pedido::withoutGlobalScopes()
            ->where('team_id', $teamId)
            ->where('tipo_documento', $tipoDocumento)
            ->where('documento_cliente', $documento)
            ->whereNotIn('estado', ['cancelado']);
    }

    private function minComprasDelTeam(int $teamId): int
    {
        $team = Team::find($teamId);

        return max(1, (int) ($team?->clientes_min_compras ?? 6));
    }
}
