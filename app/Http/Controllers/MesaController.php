<?php

namespace App\Http\Controllers;

use App\Models\Mesa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MesaController extends Controller
{
    //  Listar todas las mesas
    public function index()
    {
        $mesas = Mesa::orderBy('numero')->get();
        return Inertia::render('restaurante/mesas', [
            'mesas' => $mesas
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

    // Cambiar estado de una mesa
    public function update(Request $request, Mesa $mesa)
    {
        $validated = $request->validate([
            'estado' => 'required|in:libre,pendiente,ocupada,reserva,listo_cobrar',
            'cliente' => 'nullable|string',
            'personas' => 'nullable|integer|min:1',
        ]);

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
}