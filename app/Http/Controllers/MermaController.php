<?php

namespace App\Http\Controllers;

use App\Models\MovimientoInventario;
use App\Models\Plato;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MermaController extends Controller
{
    public function index()
    {
        $teamId = auth()->user()->current_team_id;

        $platos = Plato::where('team_id', $teamId)->get();

        $mermas = MovimientoInventario::where('team_id', $teamId)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return Inertia::render('inventario/mermas', [
            'platos' => $platos,
            'mermas' => $mermas,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = auth()->user()->current_team_id;

        $validated = $request->validate([
            'productos' => 'required|array|min:1',
            'productos.*.id' => 'required|exists:platos,id',
            'productos.*.nombre' => 'required|string',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.motivo' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $mermasRegistradas = [];

        foreach ($validated['productos'] as $item) {
            $plato = Plato::find($item['id']);

            if (! $plato) {
                return redirect()->back()->with('error', 'Producto no encontrado');
            }

            if ($plato->stock < $item['cantidad']) {
                return redirect()->back()->with('error', "Stock insuficiente para {$plato->nombre}. Disponible: {$plato->stock}");
            }

            // Registrar en Cardex
            $movimiento = MovimientoInventario::create([
                'team_id' => $teamId,
                'item_type' => 'plato',
                'item_id' => $plato->id,
                'tipo' => 'salida',
                'cantidad' => $item['cantidad'],
                'stock_resultante' => $plato->stock - $item['cantidad'],
                'motivo' => 'merma',
                'referencia_type' => 'merma',
                'proveedor' => null,
                'observaciones' => $item['motivo'] ?? $validated['observaciones'] ?? 'Merma registrada',
                'user_id' => auth()->id(),
            ]);

            // Actualizar stock del plato
            $plato->stock -= $item['cantidad'];
            $plato->save();

            $mermasRegistradas[] = $movimiento;
        }

        return redirect()->back()->with('success', count($mermasRegistradas).' merma(s) registrada(s) correctamente');
    }

    // Obtener detalle de una merma específica
    public function show($id)
    {
        $teamId = auth()->user()->current_team_id;

        $merma = MovimientoInventario::where('team_id', $teamId)
            ->where('id', $id)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->firstOrFail();

        return response()->json($merma);
    }
}
