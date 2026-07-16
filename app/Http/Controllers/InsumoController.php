<?php

namespace App\Http\Controllers;

use App\Models\Insumo;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InsumoController extends Controller
{
    public function index()
    {
        $teamId = auth()->user()->current_team_id;

        $insumos = Insumo::where('team_id', $teamId)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('inventario/insumos', [
            'insumos' => $insumos,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = auth()->user()->current_team_id;

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'unidad' => 'required|string|max:50',
            'stock' => 'nullable|numeric|min:0',
            'precio' => 'nullable|numeric|min:0',
            'proveedor' => 'nullable|string|max:255',
        ]);

        $insumo = Insumo::create([
            'team_id' => $teamId,
            'nombre' => $validated['nombre'],
            'categoria' => $validated['categoria'] ?? null,
            'unidad' => $validated['unidad'],
            'stock' => $validated['stock'] ?? 0,
            'precio' => $validated['precio'] ?? 0,
            'proveedor' => $validated['proveedor'] ?? null,
            'activo' => true,
        ]);

        // Registrar entrada en Cardex si se creó con stock inicial
        if (($validated['stock'] ?? 0) > 0) {
            MovimientoInventario::create([
                'team_id' => $teamId,
                'item_type' => 'insumo',
                'item_id' => $insumo->id,
                'tipo' => 'entrada',
                'cantidad' => $validated['stock'],
                'stock_resultante' => $validated['stock'],
                'motivo' => 'compra',
                'user_id' => auth()->id(),
                'observaciones' => 'Stock inicial',
            ]);
        }

        return redirect()->back()->with('success', 'Insumo creado correctamente');
    }

    public function update(Request $request, Insumo $insumo)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'unidad' => 'required|string|max:50',
            'precio' => 'nullable|numeric|min:0',
            'proveedor' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
        ]);

        $insumo->update($validated);

        return redirect()->back()->with('success', 'Insumo actualizado correctamente');
    }

    public function destroy(Insumo $insumo)
    {
        // Verificar si tiene movimientos en Cardex
        $movimientos = MovimientoInventario::where('item_type', 'insumo')
            ->where('item_id', $insumo->id)
            ->count();

        if ($movimientos > 0) {
            return redirect()->back()->with('error', 'No se puede eliminar porque tiene movimientos en Cardex');
        }

        $insumo->delete();

        return redirect()->back()->with('success', 'Insumo eliminado correctamente');
    }

    // Registrar compra (entrada de stock)
    public function comprar(Request $request, Insumo $insumo)
    {
        $teamId = auth()->user()->current_team_id;

        $validated = $request->validate([
            'cantidad' => 'required|numeric|min:0.01',
            'observaciones' => 'nullable|string',
        ]);

        $nuevoStock = $insumo->stock + $validated['cantidad'];

        $insumo->stock = $nuevoStock;
        $insumo->save();

        MovimientoInventario::create([
            'team_id' => $teamId,
            'item_type' => 'insumo',
            'item_id' => $insumo->id,
            'tipo' => 'entrada',
            'cantidad' => $validated['cantidad'],
            'stock_resultante' => $nuevoStock,
            'motivo' => 'compra',
            'referencia_type' => 'compra',
            'user_id' => auth()->id(),
            'observaciones' => $validated['observaciones'] ?? 'Compra de insumo',
        ]);

        return redirect()->back()->with('success', 'Compra registrada correctamente');
    }

    // Registrar merma de insumo (salida de stock)
    public function mermar(Request $request, Insumo $insumo)
    {
        $teamId = auth()->user()->current_team_id;

        $validated = $request->validate([
            'cantidad' => 'required|numeric|min:0.01',
            'observaciones' => 'nullable|string',
        ]);

        if ($insumo->stock < $validated['cantidad']) {
            return redirect()->back()->with('error', 'Stock insuficiente para esta merma');
        }

        $nuevoStock = $insumo->stock - $validated['cantidad'];

        $insumo->stock = $nuevoStock;
        $insumo->save();

        MovimientoInventario::create([
            'team_id' => $teamId,
            'item_type' => 'insumo',
            'item_id' => $insumo->id,
            'tipo' => 'salida',
            'cantidad' => $validated['cantidad'],
            'stock_resultante' => $nuevoStock,
            'motivo' => 'merma',
            'referencia_type' => 'merma',
            'user_id' => auth()->id(),
            'observaciones' => $validated['observaciones'] ?? 'Merma de insumo',
        ]);

        return redirect()->back()->with('success', 'Merma registrada correctamente');
    }
}
