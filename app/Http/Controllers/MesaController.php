<?php

namespace App\Http\Controllers;

use App\Events\MesaActualizada;
use App\Events\PedidoActualizado;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MesaController extends Controller
{
    //  Listar todas las mesas
    public function index()
    {
        $teamId = auth()->user()->current_team_id;

        // Expiración lazy: reservas vencidas y mesas huérfanas en "reserva".
        Reserva::expirarVencidas();
        $mesasLiberadas = Reserva::sincronizarMesasEnReserva();

        foreach ($mesasLiberadas as $mesa) {
            MesaActualizada::dispatch($mesa);
        }

        $mesas = Mesa::where('team_id', $teamId)
            ->with('meseroUser')
            ->orderBy('numero')
            ->get()
            ->values();

        $pedidos = Pedido::where('team_id', $teamId)
            ->whereNotIn('estado', ['pagado', 'cancelado'])
            ->get()
            ->values();

        // IDs de mesas con cualquier historial de pedidos (para bloquear su eliminación)
        $mesaHistorialIds = Mesa::where('team_id', $teamId)
            ->whereHas('pedidos')
            ->pluck('id');

        // IDs de mesas con historial de reservas (bloquean la eliminación)
        $reservaHistorialIds = Mesa::where('team_id', $teamId)
            ->whereHas('reservas')
            ->pluck('id');

        return Inertia::render('restaurante/mesas', [
            'mesas' => $mesas->values()->all(),
            'pedidos' => $pedidos->values()->all(),
            'mesaHistorialIds' => $mesaHistorialIds,
            'reservaHistorialIds' => $reservaHistorialIds,
            'reservas' => Reserva::delDia($teamId)->all(),
            'margenInicioMinutos' => (int) config('reservas.margen_inicio_minutos', 10),
        ]);
    }

    //  Crear una nueva mesa
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero' => 'required|string|unique:mesas',
            'capacidad' => 'required|integer|min:1|max:8',
            'sillas' => 'required|integer|min:0|max:10',
        ]);

        $mesa = Mesa::create($validated);

        return redirect()->back()->with('success', 'Mesa creada correctamente');
    }

    public function update(Request $request, Mesa $mesa)
    {
        $validated = $request->validate([
            'estado' => 'sometimes|in:libre,pendiente,ocupada,reserva,listo_cobrar',
            'cliente' => 'nullable|string',
            'personas' => 'nullable|integer|min:1',
            'user_id' => 'nullable|integer|exists:users,id',
            'sillas' => 'sometimes|integer|min:1|max:10',
            'activa' => 'sometimes|boolean',
        ]);

        $puedeGestionar = auth()->user()->can('gestionar mesas');

        if (! empty($validated['user_id']) && ! auth()->user()->currentTeam->members()->where('users.id', $validated['user_id'])->exists()) {
            return redirect()->back()->with('error', 'El empleado no pertenece a esta sede.');
        }

        // Configuración: editar sillas (solo gestión)
        if (array_key_exists('sillas', $validated)) {
            if (! $puedeGestionar) {
                return redirect()->back()->withErrors([
                    'sillas' => 'No tienes permisos para configurar mesas.',
                ]);
            }

            $mesa->update(['sillas' => $validated['sillas']]);
            broadcast(new MesaActualizada($mesa->fresh()));

            return redirect()->back()->with('success', 'Sillas de la mesa actualizadas');
        }

        // Configuración: activar / desactivar (solo gestión)
        if (array_key_exists('activa', $validated)) {
            if (! $puedeGestionar) {
                return redirect()->back()->withErrors([
                    'activa' => 'No tienes permisos para configurar mesas.',
                ]);
            }

            $activar = (bool) $validated['activa'];

            if (! $activar) {
                $tienePedidosActivos = $mesa->pedidos()
                    ->whereNotIn('estado', ['pagado', 'cancelado'])
                    ->exists();

                if ($mesa->estado !== 'libre' || $tienePedidosActivos) {
                    return redirect()->back()->withErrors([
                        'activa' => 'Solo puedes desactivar una mesa libre y sin pedidos activos.',
                    ]);
                }
            }

            $mesa->update(['activa' => $activar]);
            broadcast(new MesaActualizada($mesa->fresh()));

            return redirect()->back()->with(
                'success',
                $activar ? 'Mesa activada correctamente' : 'Mesa desactivada correctamente'
            );
        }

        if (! array_key_exists('estado', $validated)) {
            return redirect()->back()->with('error', 'No se recibió ninguna acción válida.');
        }

        if (! $mesa->activa) {
            return redirect()->back()->with('error', 'La mesa está desactivada. Actívala para seguir operando con ella.');
        }

        if ($validated['estado'] === 'listo_cobrar') {
            $pedidosPendientes = $mesa->pedidos()
                ->whereNotIn('estado', ['pagado', 'cancelado', 'entregado'])
                ->count();

            if ($pedidosPendientes > 0) {
                return redirect()->back()->withErrors([
                    'estado' => 'No se puede cambiar manualmente a "Cobrar". El sistema lo activa automáticamente cuando todos los pedidos están entregados.',
                ]);
            }
        }

        if ($validated['estado'] === 'reserva') {
            $pedidosPendientes = $mesa->pedidos()
                ->whereNotIn('estado', ['pagado', 'cancelado', 'entregado'])
                ->count();

            if ($pedidosPendientes > 0) {
                return redirect()->back()->withErrors([
                    'estado' => 'No se puede poner en "Reserva". La mesa tiene pedidos activos pendientes.',
                ]);
            }
        }

        if ($validated['estado'] === 'ocupada' && empty($validated['user_id']) && ! $mesa->user_id) {
            $validated['user_id'] = auth()->id();
        }

        if ($validated['estado'] === 'libre') {

            $hasUnpaidOrders = $mesa->pedidos()
                ->whereNotIn('estado', ['pagado', 'cancelado'])
                ->exists();

            if ($hasUnpaidOrders) {
                return redirect()->back()->withErrors([
                    'estado' => 'La mesa solo puede liberarse al registrar el pago con un PIN autorizado.',
                ]);
            }

            $mesa->pedidos()
                ->where('estado', 'entregado')
                ->update(['estado' => 'pagado']);

            $validated['user_id'] = null;
            $validated['cliente'] = null;
            $validated['personas'] = null;
            $validated['pedido_listo'] = false;
        }

        $mesa->update($validated);
        broadcast(new MesaActualizada($mesa));

        // Al ocupar una mesa en reserva, la reserva activa pasa a atendida.
        if ($validated['estado'] === 'ocupada') {
            ReservaService::atenderActiva($mesa);
        }

        return redirect()->back()->with('success', 'Estado de mesa actualizado');
    }

    //  Ver detalle de una mesa
    public function show(Mesa $mesa)
    {
        return Inertia::render('restaurante/mesa-detalle', [
            'mesa' => $mesa,
        ]);
    }

    //  Eliminar una mesa (solo si está libre y sin historial de pedidos)
    public function destroy(Mesa $mesa)
    {
        if ($mesa->estado !== 'libre') {
            return redirect()->back()->withErrors([
                'mesa' => 'Solo puedes eliminar una mesa que esté libre.',
            ]);
        }

        if ($mesa->pedidos()->count() > 0) {
            return redirect()->back()->withErrors([
                'mesa' => 'No se puede eliminar porque tiene historial de pedidos. Puedes desactivarla si ya no la vas a usar.',
            ]);
        }

        if ($mesa->reservas()->count() > 0) {
            return redirect()->back()->withErrors([
                'mesa' => 'No se puede eliminar porque tiene historial de reservas. Puedes desactivarla si ya no la vas a usar.',
            ]);
        }

        $mesa->delete();

        return redirect()->back()->with('success', 'Mesa eliminada correctamente');
    }

    //  Marcar que el pedido de una mesa está listo
    public function marcarPedidoListo(Request $request, Mesa $mesa)
    {
        $mesa->pedido_listo = true;
        $mesa->save();
        broadcast(new MesaActualizada($mesa));

        return redirect()->back()->with('success', 'Pedido listo para entregar');
    }

    //  Entregar pedido: libera la bandera de la mesa Y marca los pedidos como entregados
    public function entregar(Request $request, Mesa $mesa)
    {
        $pedidosEntregados = Pedido::where('mesa_id', $mesa->id)
            ->where('estado', 'listo')
            ->get();

        if ($pedidosEntregados->isEmpty()) {
            return redirect()->back()->withErrors([
                'pedido' => 'No hay pedidos listos pendientes de entrega en esta mesa.',
            ]);
        }

        foreach ($pedidosEntregados as $pedidoEntregado) {
            $pedidoEntregado->update(['estado' => 'entregado', 'hora_entrega' => now()]);
            broadcast(new PedidoActualizado($pedidoEntregado));
        }

        $mesa->pedido_listo = false;
        $mesa->estado = 'ocupada';
        $mesa->save();
        broadcast(new MesaActualizada($mesa));

        return redirect()->back()->with('success', 'Pedido entregado');
    }

    //  Tomar pedido: asigna mesero autenticado y ocupa la mesa
    public function tomarPedido(Request $request, Mesa $mesa)
    {
        $mesa->update([
            'estado' => 'ocupada',
            'user_id' => auth()->id(),
        ]);
        broadcast(new MesaActualizada($mesa));

        // Si la mesa estaba en reserva, su reserva activa pasa a atendida.
        ReservaService::atenderActiva($mesa);

        return redirect()->back()->with('success', 'Mesa asignada a '.auth()->user()->name);
    }

    //  Transferir una silla de una mesa a otra (drag & drop)
    public function transferirSilla(Request $request, Mesa $origen, Mesa $destino)
    {
        $validated = $request->validate([
            'forzar' => 'nullable|boolean',
        ]);

        if ($origen->id === $destino->id) {
            return redirect()->back()->with('error', 'No puedes mover una silla a la misma mesa');
        }

        if ($origen->estado !== 'libre' || $destino->estado !== 'libre') {
            return redirect()->back()->with('error', 'Solo puedes mover sillas entre mesas libres');
        }

        if ($origen->sillas <= 1) {
            return redirect()->back()->with('error', 'La mesa debe tener al menos 1 silla');
        }

        if ($destino->sillas >= 10) {
            return redirect()->back()->with('error', 'La mesa destino ya tiene 10 sillas, el máximo permitido');
        }

        if (! ($validated['forzar'] ?? false) && ($destino->sillas + 1) > $destino->capacidad) {
            return redirect()->back()->with('aviso_capacidad', [
                'mesero_origen_id' => $origen->id,
                'mesa_destino_id' => $destino->id,
                'mensaje' => "Esta mesa es para {$destino->capacidad} personas. ¿Agregar de todas formas?",
            ]);
        }

        $origen->decrement('sillas');
        $destino->increment('sillas');
        broadcast(new MesaActualizada($origen->fresh()));
        broadcast(new MesaActualizada($destino->fresh()));

        return redirect()->back()->with('success', 'Silla movida correctamente');
    }

    public function getByNumero($numero)
    {
        $mesa = Mesa::where('numero', $numero)->first();

        if (! $mesa || ! $mesa->activa) {
            return response()->json(['error' => 'Mesa no encontrada'], 404);
        }

        return response()->json($mesa);
    }
}
