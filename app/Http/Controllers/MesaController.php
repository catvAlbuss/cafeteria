<?php

namespace App\Http\Controllers;

use App\Events\MesaActualizada;
use App\Events\PedidoActualizado;
use App\Models\Mesa;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MesaController extends Controller
{
    //  Listar todas las mesas
public function index()
{
    $mesas = Mesa::with('meseroUser')->orderBy('numero')->get()->values();

   
    $pedidos = Pedido::whereNotIn('estado', ['pagado', 'cancelado'])->get()->values();

    return Inertia::render('restaurante/mesas', [
        'mesas' => $mesas->values()->all(),
        'pedidos' => $pedidos->values()->all(),
    ]);
}

    //  Crear una nueva mesa
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero' => 'required|string|unique:mesas',
            'capacidad' => 'required|integer|min:1',
            'sillas' => 'required|integer|min:0',
        ]);

        $mesa = Mesa::create($validated);

        return redirect()->back()->with('success', 'Mesa creada correctamente');
    }

public function update(Request $request, Mesa $mesa)
{
    $validated = $request->validate([
        'estado' => 'required|in:libre,pendiente,ocupada,reserva,listo_cobrar',
        'cliente' => 'nullable|string',
        'personas' => 'nullable|integer|min:1',
        'user_id' => 'nullable|integer|exists:users,id',
    ]);

    if (! empty($validated['user_id']) && ! auth()->user()->currentTeam->members()->where('users.id', $validated['user_id'])->exists()) {
        return redirect()->back()->with('error', 'El empleado no pertenece a esta sede.');
    }

    
    if ($validated['estado'] === 'listo_cobrar') {
        $pedidosPendientes = $mesa->pedidos()
            ->whereNotIn('estado', ['pagado', 'cancelado', 'entregado'])
            ->count();

        if ($pedidosPendientes > 0) {
            return redirect()->back()->withErrors([
                'estado' => 'No se puede cambiar manualmente a "Cobrar". El sistema lo activa automáticamente cuando todos los pedidos están entregados.'
            ]);
        }
    }

  
    if ($validated['estado'] === 'reserva') {
        $pedidosPendientes = $mesa->pedidos()
            ->whereNotIn('estado', ['pagado', 'cancelado', 'entregado'])
            ->count();

        if ($pedidosPendientes > 0) {
            return redirect()->back()->withErrors([
                'estado' => 'No se puede poner en "Reserva". La mesa tiene pedidos activos pendientes.'
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

        $validated['user_id'] = null;
        $validated['cliente'] = null;
        $validated['personas'] = null;
        $validated['pedido_listo'] = false;
    }

    $mesa->update($validated);
    broadcast(new MesaActualizada($mesa));

    return redirect()->back()->with('success', 'Estado de mesa actualizado');
}

    //  Ver detalle de una mesa
    public function show(Mesa $mesa)
    {
        return Inertia::render('restaurante/mesa-detalle', [
            'mesa' => $mesa,
        ]);
    }

    //  Eliminar una mesa
    public function destroy(Mesa $mesa)
    {
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

    //  Cobrar la cuenta completa de una mesa (agrupa TODOS los pedidos no pagados/cancelados)
    public function cobrarCuenta(Request $request, Mesa $mesa)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,yape',
            'monto_recibido' => 'nullable|numeric|min:0',
        ]);

        $pedidos = Pedido::where('mesa_id', $mesa->id)
            ->whereNotIn('estado', ['pagado', 'cancelado'])
            ->get();

        if ($pedidos->isEmpty()) {
            return redirect()->back()->with('error', 'Esta mesa no tiene pedidos por cobrar');
        }

        foreach ($pedidos as $pedido) {
            $pedido->estado = 'pagado';
            $pedido->save();
            broadcast(new PedidoActualizado($pedido));
        }

        $mesa->estado = 'libre';
        $mesa->user_id = null;
        $mesa->cliente = null;
        $mesa->personas = null;
        $mesa->pedido_listo = false;
        $mesa->save();
        broadcast(new MesaActualizada($mesa));

        return redirect()->back()->with('success', 'Cuenta cobrada correctamente');
    }

    //  Tomar pedido: asigna mesero autenticado y ocupa la mesa
    public function tomarPedido(Request $request, Mesa $mesa)
    {
        $mesa->update([
            'estado' => 'ocupada',
            'user_id' => auth()->id(),
        ]);
        broadcast(new MesaActualizada($mesa));

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

        // Si excede la capacidad y no viene confirmado, avisamos sin mover nada
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

        if (! $mesa) {
            return response()->json(['error' => 'Mesa no encontrada'], 404);
        }

        return response()->json($mesa);
    }
}
