<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Services\ClienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    public function __construct(private ClienteService $clienteService) {}

    public function index(Request $request): Response
    {
        $teamId = $request->user()->current_team_id;

        $this->clienteService->sincronizarTeam($teamId);

        $clientes = Cliente::query()
            ->where('team_id', $teamId)
            ->orderByDesc('total_gastado_30d')
            ->orderBy('nombre')
            ->get()
            ->map(fn (Cliente $cliente) => [
                'id' => $cliente->id,
                'nombre' => $cliente->nombre,
                'documento' => $cliente->documento,
                'tipoDocumento' => $cliente->tipo_documento,
                'telefono' => $cliente->telefono,
                'email' => $cliente->email,
                'direccion' => $cliente->direccion,
                'pedidos' => $cliente->pedidos_30d,
                'pedidosTotal' => $cliente->pedidos_total,
                'totalGastado' => (float) $cliente->total_gastado_30d,
                'totalGastadoTotal' => (float) $cliente->total_gastado,
                'estado' => $cliente->estado,
                'fechaRegistro' => $cliente->created_at?->format('d/m/Y'),
                'ultimaVisita' => $cliente->ultima_visita?->format('d/m/Y'),
            ]);

        return Inertia::render('clientes/clientes', [
            'clientes' => $clientes,
            'estadisticas' => $this->clienteService->estadisticas($teamId),
            'configuracion' => [
                'minCompras' => (int) ($request->user()->currentTeam?->clientes_min_compras ?? 6),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $teamId = $request->user()->current_team_id;

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo_documento' => 'nullable|in:dni,ruc',
            'documento' => [
                'nullable',
                'string',
                'max:15',
                Rule::unique('clientes', 'documento')
                    ->where('team_id', $teamId)
                    ->where('tipo_documento', $request->input('tipo_documento')),
            ],
            'telefono' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'direccion' => 'nullable|string|max:255',
            'estado' => 'nullable|in:inactivo,activo,vip',
        ], [
            'documento.unique' => 'Ya existe un cliente con ese documento en esta sede.',
        ]);

        Cliente::create([
            'team_id' => $teamId,
            'nombre' => $validated['nombre'],
            'tipo_documento' => $validated['tipo_documento'] ?? null,
            'documento' => $validated['documento'] ?? null,
            'telefono' => $validated['telefono'] ?? null,
            'email' => $validated['email'] ?? null,
            'direccion' => $validated['direccion'] ?? null,
            'estado' => $validated['estado'] ?? Cliente::ESTADO_INACTIVO,
        ]);

        return redirect()->back()->with('success', 'Cliente creado correctamente');
    }

    public function update(Request $request, Cliente $cliente): RedirectResponse
    {
        $teamId = $request->user()->current_team_id;

        abort_unless($cliente->team_id === $teamId, 404);

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo_documento' => 'nullable|in:dni,ruc',
            'documento' => [
                'nullable',
                'string',
                'max:15',
                Rule::unique('clientes', 'documento')
                    ->where('team_id', $teamId)
                    ->where('tipo_documento', $request->input('tipo_documento'))
                    ->ignore($cliente->id),
            ],
            'telefono' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'direccion' => 'nullable|string|max:255',
            'estado' => 'nullable|in:inactivo,activo,vip',
        ], [
            'documento.unique' => 'Ya existe un cliente con ese documento en esta sede.',
        ]);

        $cliente->update([
            'nombre' => $validated['nombre'],
            'tipo_documento' => $validated['tipo_documento'] ?? null,
            'documento' => $validated['documento'] ?? null,
            'telefono' => $validated['telefono'] ?? null,
            'email' => $validated['email'] ?? null,
            'direccion' => $validated['direccion'] ?? null,
            'estado' => $validated['estado'] ?? $cliente->estado,
        ]);

        return redirect()->back()->with('success', 'Cliente actualizado correctamente');
    }

    public function destroy(Request $request, Cliente $cliente): RedirectResponse
    {
        abort_unless($cliente->team_id === $request->user()->current_team_id, 404);

        $cliente->delete();

        return redirect()->back()->with('success', 'Cliente eliminado correctamente');
    }

    public function buscarPorDocumento(Request $request): JsonResponse
    {
        $teamId = $request->user()->current_team_id;

        $validated = $request->validate([
            'tipo_documento' => 'required|in:dni,ruc',
            'documento' => 'required|string|max:11',
        ]);

        $cliente = Cliente::query()
            ->where('team_id', $teamId)
            ->where('tipo_documento', $validated['tipo_documento'])
            ->where('documento', $validated['documento'])
            ->first();

        return response()->json(['nombre' => $cliente?->nombre ?? null]);
    }

    public function updateConfiguracion(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'minCompras' => 'required|integer|min:1|max:100',
        ]);

        $team = $request->user()->currentTeam;
        abort_unless($team, 404);

        $team->update(['clientes_min_compras' => $validated['minCompras']]);

        return redirect()->back()->with('success', 'Configuración actualizada correctamente');
    }
}
