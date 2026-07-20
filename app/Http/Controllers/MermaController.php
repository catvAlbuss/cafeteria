<?php

namespace App\Http\Controllers;

use App\Models\Insumo;
use App\Models\MovimientoInventario;
use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MermaController extends Controller
{
    public function index()
    {
        $teamId = auth()->user()->current_team_id;

        $platos = Plato::where('team_id', $teamId)->get();
        $insumos = Insumo::where('team_id', $teamId)->where('activo', true)->get();

        $mermas = MovimientoInventario::where('team_id', $teamId)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return Inertia::render('inventario/mermas', [
            'platos' => $platos,
            'insumos' => $insumos,
            'mermas' => $mermas,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = auth()->user()->current_team_id;

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.tipo' => 'required|in:producto,insumo',
            'items.*.nombre' => 'required|string',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.motivo' => 'required|string',
            'observaciones' => 'nullable|string',
        ]);

        $mermasRegistradas = [];

        DB::beginTransaction();

        try {
            foreach ($validated['items'] as $item) {
                $esProducto = $item['tipo'] === 'producto';
                $modelo = $esProducto
                    ? Plato::where('team_id', $teamId)->find($item['id'])
                    : Insumo::where('team_id', $teamId)->find($item['id']);

                if (! $modelo) {
                    DB::rollBack();
                    return redirect()->back()->with('error', "No se encontró {$item['nombre']}");
                }

                if ($modelo->stock < $item['cantidad']) {
                    DB::rollBack();
                    return redirect()->back()->with('error', "Stock insuficiente para {$modelo->nombre}. Disponible: {$modelo->stock}");
                }

                // Los platos son unidades enteras; los insumos permiten decimales (kg, litros)
                if ($esProducto && floor($item['cantidad']) != $item['cantidad']) {
                    DB::rollBack();
                    return redirect()->back()->with('error', "La cantidad de {$modelo->nombre} debe ser un número entero");
                }

                $movimiento = MovimientoInventario::create([
                    'team_id' => $teamId,
                    'item_type' => $esProducto ? 'plato' : 'insumo',
                    'item_id' => $modelo->id,
                    'tipo' => 'salida',
                    'cantidad' => $item['cantidad'],
                    'stock_resultante' => $modelo->stock - $item['cantidad'],
                    'motivo' => 'merma',
                    'submotivo' => $item['motivo'],
                    'referencia_type' => 'merma',
                    'proveedor' => null,
                    'observaciones' => $validated['observaciones'] ?? null,
                    'user_id' => auth()->id(),
                ]);

                $modelo->stock -= $item['cantidad'];
                $modelo->save();

                $mermasRegistradas[] = $movimiento;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al registrar mermas: '.$e->getMessage());
        }

        return redirect()->back()->with('success', count($mermasRegistradas).' merma(s) registrada(s) correctamente');
    }

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

    public function destroy($id)
    {
        $teamId = auth()->user()->current_team_id;

        $merma = MovimientoInventario::where('team_id', $teamId)
            ->where('id', $id)
            ->where('motivo', 'merma')
            ->firstOrFail();

        $merma->delete();

        return redirect()->back()->with('success', 'Merma eliminada correctamente');
    }
}