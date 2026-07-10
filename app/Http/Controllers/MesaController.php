<?php

namespace App\Http\Controllers;

use App\Models\Mesa;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Pedido;

class MesaController extends Controller
{
    //  Listar todas las mesas
    public function index()
{
    $mesas = Mesa::orderBy('numero')->get();
    $pedidos = Pedido::whereIn('estado', ['listo', 'entregado'])->get();
    
    return Inertia::render('restaurante/mesas', [
        'mesas' => $mesas,
        'pedidos' => $pedidos
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
        'mesero' => 'nullable|string',
    ]);

    if ($validated['estado'] === 'libre') {
        $validated['mesero'] = null;
        $validated['cliente'] = null;
        $validated['personas'] = null;
        $validated['pedido_listo'] = false; 
    }

    $mesa->update($validated);
    return redirect()->back()->with('success', 'Estado de mesa actualizado');
}

    //  Ver detalle de una mesa
    public function show(Mesa $mesa)
    {
        return Inertia::render('restaurante/mesa-detalle', [
            'mesa' => $mesa
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
        return redirect()->back()->with('success', 'Pedido listo para entregar');
    }

    //  Entregar pedido (quitar el indicador)
    public function entregar(Request $request, Mesa $mesa)
    {
        $mesa->pedido_listo = false;
        $mesa->estado = 'ocupada';
        $mesa->save();
        return redirect()->back()->with('success', 'Pedido entregado');
    }

    //  Tomar pedido: asigna mesero autenticado y ocupa la mesa
    public function tomarPedido(Request $request, Mesa $mesa)
    {
        $mesa->update([
            'estado' => 'ocupada',
            'mesero' => auth()->user()->name,
        ]);

        return redirect()->back()->with('success', 'Mesa asignada a ' . auth()->user()->name);
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
        if (!($validated['forzar'] ?? false) && ($destino->sillas + 1) > $destino->capacidad) {
            return redirect()->back()->with('aviso_capacidad', [
                'mesero_origen_id' => $origen->id,
                'mesa_destino_id' => $destino->id,
                'mensaje' => "Esta mesa es para {$destino->capacidad} personas. ¿Agregar de todas formas?",
            ]);
        }

        $origen->decrement('sillas');
        $destino->increment('sillas');

        return redirect()->back()->with('success', 'Silla movida correctamente');
    }

    public function getByNumero($numero)
{
    $mesa = Mesa::where('numero', $numero)->first();
    
    if (!$mesa) {
        return response()->json(['error' => 'Mesa no encontrada'], 404);
    }
    
    return response()->json($mesa);
}
}