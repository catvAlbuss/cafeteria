<?php

namespace App\Http\Controllers;

use App\Exports\InsumosExport;
use App\Models\Insumo;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class InsumoController extends Controller
{
    /**
     * Inventario operativo para Cocina y Bar.
     */
    public function operativo(Request $request): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $area = null;

        if ($user->hasRole('Bar')) {
            $area = 'bar';
        } elseif ($user->hasRole('Cocinero')) {
            $area = 'cocina';
        }

        if ($area === null) {
            abort(403);
        }

        $insumos = Insumo::query()
            ->where('team_id', $user->current_team_id)
            ->where('area', $area)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(function (Insumo $insumo) {
                return [
                    'id' => $insumo->id,
                    'nombre' => $insumo->nombre,
                    'categoria' => $insumo->categoria,
                    'unidad' => $insumo->unidad,
                    'stock' => (float) $insumo->stock,
                    'stock_minimo' => (float) $insumo->stock_minimo,
                    'fecha_vencimiento' => $insumo->fecha_vencimiento
                        ? $insumo->fecha_vencimiento->toDateString()
                        : null,
                ];
            });

        return Inertia::render('inventario/operativo', [
            'insumos' => $insumos,
        ]);
    }

    /**
     * Mostrar todos los insumos.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;
        $userRole = $user->roles->first()?->name;

        $insumos = Insumo::query()
            ->where('team_id', $teamId)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('inventario/insumos', [
            'insumos' => $insumos,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Registrar nuevo insumo.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'area' => 'required|in:cocina,bar',
            'unidad' => 'required|string|max:50',
            'stock' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'fecha_vencimiento' => 'nullable|date',
            'precio' => 'nullable|numeric|min:0',
            'proveedor' => 'nullable|string|max:255',
        ]);

        $stockInicial = (float) ($validated['stock'] ?? 0);

        $insumo = Insumo::create([
            'team_id' => $teamId,
            'nombre' => $validated['nombre'],
            'categoria' => $validated['categoria'] ?? null,
            'area' => $validated['area'],
            'unidad' => $validated['unidad'],
            'stock' => $stockInicial,
            'stock_minimo' => (float) ($validated['stock_minimo'] ?? 5),
            'fecha_vencimiento' => $validated['fecha_vencimiento'] ?? null,
            'precio' => (float) ($validated['precio'] ?? 0),
            'proveedor' => $validated['proveedor'] ?? null,
            'activo' => true,
        ]);

        if ($stockInicial > 0) {
            MovimientoInventario::create([
                'team_id' => $teamId,
                'item_type' => 'insumo',
                'item_id' => $insumo->id,
                'tipo' => 'entrada',
                'cantidad' => $stockInicial,
                'stock_resultante' => $stockInicial,
                'motivo' => 'compra',
                'user_id' => $user->id,
                'observaciones' => 'Stock inicial',
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Insumo creado correctamente');
    }

    /**
     * Actualizar insumo.
     */
    public function update(Request $request, Insumo $insumo)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'area' => 'required|in:cocina,bar',
            'unidad' => 'required|string|max:50',
            'precio' => 'nullable|numeric|min:0',
            'stock_minimo' => 'nullable|numeric|min:0',
            'fecha_vencimiento' => 'nullable|date',
            'proveedor' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
        ]);

        $insumo->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Insumo actualizado correctamente');
    }

    /**
     * Eliminar insumo.
     */
    public function destroy(Insumo $insumo)
    {
        $tieneMovimientos = MovimientoInventario::query()
            ->where('item_type', 'insumo')
            ->where('item_id', $insumo->id)
            ->exists();

        if ($tieneMovimientos) {
            return redirect()
                ->back()
                ->withErrors([
                    'insumo' => 'No se puede eliminar porque tiene movimientos en Cardex',
                ]);
        }

        $insumo->delete();

        return redirect()
            ->back()
            ->with('success', 'Insumo eliminado correctamente');
    }

    /**
     * Registrar compra.
     */
    public function comprar(Request $request, Insumo $insumo)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $validated = $request->validate([
            'cantidad' => 'required|numeric|min:0.01',
            'observaciones' => 'nullable|string',
        ]);

        $cantidad = (float) $validated['cantidad'];
        $stockActual = (float) $insumo->stock;
        $nuevoStock = $stockActual + $cantidad;

        $insumo->stock = $nuevoStock;
        $insumo->save();

        MovimientoInventario::create([
            'team_id' => $teamId,
            'item_type' => 'insumo',
            'item_id' => $insumo->id,
            'tipo' => 'entrada',
            'cantidad' => $cantidad,
            'stock_resultante' => $nuevoStock,
            'motivo' => 'compra',
            'referencia_type' => 'compra',
            'user_id' => $user->id,
            'observaciones' => $validated['observaciones'] ?? 'Compra de insumo',
        ]);

        return redirect()
            ->back()
            ->with('success', 'Compra registrada correctamente');
    }

    /**
     * Registrar merma.
     */
    public function mermar(Request $request, Insumo $insumo)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $validated = $request->validate([
            'cantidad' => 'required|numeric|min:0.01',
            'motivo' => 'required|string',
            'observaciones' => 'nullable|string',
        ]);

        $cantidad = (float) $validated['cantidad'];
        $stockActual = (float) $insumo->stock;

        if ($stockActual < $cantidad) {
            return redirect()
                ->back()
                ->with('error', 'Stock insuficiente para esta merma');
        }

        $nuevoStock = $stockActual - $cantidad;

        $insumo->stock = $nuevoStock;
        $insumo->save();

        MovimientoInventario::create([
            'team_id' => $teamId,
            'item_type' => 'insumo',
            'item_id' => $insumo->id,
            'tipo' => 'salida',
            'cantidad' => $cantidad,
            'stock_resultante' => $nuevoStock,
            'motivo' => 'merma',
            'submotivo' => $validated['motivo'],
            'referencia_type' => 'merma',
            'user_id' => $user->id,
            'observaciones' => $validated['observaciones'] ?? null,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Merma registrada correctamente');
    }

    /**
     * Exportar insumos a Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $insumos = Insumo::query()
            ->where('team_id', $teamId)
            ->orderBy('nombre')
            ->get();

        return Excel::download(
            new InsumosExport($insumos),
            'insumos_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }
}