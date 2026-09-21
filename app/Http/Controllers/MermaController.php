<?php

namespace App\Http\Controllers;

use App\Models\Insumo;
use App\Models\MovimientoInventario;
use App\Models\Plato;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class MermaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user, 403);

        $teamId = $user->current_team_id;

        $platos = Plato::where('team_id', $teamId)->get();

        $insumos = Insumo::where('team_id', $teamId)
            ->where('activo', true)
            ->get();

        $mermas = MovimientoInventario::where('team_id', $teamId)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $totalPerdidas = $mermas->sum(function ($m) {
            $precio = (float) ($m->item?->precio ?? 0);
            $cantidad = (float) $m->cantidad;

            if ($m->item_type === 'insumo') {
                return $cantidad * $precio * 0.100;
            }

            return $cantidad * $precio;
        });

        $totalRegistros = $mermas->count();

        $ultimaMerma = $mermas->first()?->item?->nombre ?? null;

        $promedio = $totalRegistros > 0
            ? $totalPerdidas / $totalRegistros
            : 0;

        return Inertia::render('inventario/mermas', [
            'platos' => $platos,
            'insumos' => $insumos,
            'mermas' => $mermas,
            'stats' => [
                'total_perdidas' => $totalPerdidas,
                'total_registros' => $totalRegistros,
                'ultima_merma' => $ultimaMerma,
                'promedio' => $promedio,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user, 403);

        $teamId = $user->current_team_id;

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

                    return redirect()
                        ->back()
                        ->with('error', "No se encontró {$item['nombre']}");
                }

                if ($modelo->stock < $item['cantidad']) {
                    DB::rollBack();

                    return redirect()
                        ->back()
                        ->with(
                            'error',
                            "Stock insuficiente para {$modelo->nombre}. Disponible: {$modelo->stock}"
                        );
                }

                // Los platos son unidades enteras.
                if (
                    $esProducto &&
                    floor($item['cantidad']) != $item['cantidad']
                ) {
                    DB::rollBack();

                    return redirect()
                        ->back()
                        ->with(
                            'error',
                            "La cantidad de {$modelo->nombre} debe ser un número entero"
                        );
                }

                $nuevoStock = $modelo->stock - $item['cantidad'];

                $movimiento = MovimientoInventario::create([
                    'team_id' => $teamId,
                    'item_type' => $esProducto ? 'plato' : 'insumo',
                    'item_id' => $modelo->id,
                    'tipo' => 'salida',
                    'cantidad' => $item['cantidad'],
                    'stock_resultante' => $nuevoStock,
                    'motivo' => 'merma',
                    'submotivo' => $item['motivo'],
                    'referencia_type' => 'merma',
                    'proveedor' => null,
                    'observaciones' => $validated['observaciones'] ?? null,
                    'user_id' => $user->id,
                ]);

                $modelo->stock = $nuevoStock;
                $modelo->save();

                $mermasRegistradas[] = $movimiento;
            }

            DB::commit();

        } catch (\Exception $e) {

            DB::rollBack();

            return redirect()
                ->back()
                ->with(
                    'error',
                    'Error al registrar mermas: ' . $e->getMessage()
                );
        }

        return redirect()
            ->back()
            ->with(
                'success',
                count($mermasRegistradas) . ' merma(s) registrada(s) correctamente'
            );
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        abort_unless($user, 403);

        $teamId = $user->current_team_id;

        $merma = MovimientoInventario::where('team_id', $teamId)
            ->where('id', $id)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->firstOrFail();

        return response()->json($merma);
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user, 403);

        $teamId = $user->current_team_id;

        $merma = MovimientoInventario::where('team_id', $teamId)
            ->where('id', $id)
            ->where('motivo', 'merma')
            ->with('item')
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | RESTAURAR STOCK
        |--------------------------------------------------------------------------
        */

        $item = $merma->item;

        if ($item) {
            $item->stock += $merma->cantidad;
            $item->save();
        }

        $merma->delete();

        return redirect()
            ->back()
            ->with(
                'success',
                'Merma eliminada y stock restaurado correctamente'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | EXPORTAR MERMAS A PDF
    |--------------------------------------------------------------------------
    */

    public function exportarPdf(Request $request)
    {
        $user = $request->user();

        abort_unless($user, 403);

        $teamId = $user->current_team_id;

        /*
        |--------------------------------------------------------------------------
        | OBTENER TODAS LAS MERMAS
        |--------------------------------------------------------------------------
        */

        $mermas = MovimientoInventario::where('team_id', $teamId)
            ->where('motivo', 'merma')
            ->with(['user', 'item'])
            ->orderBy('created_at', 'desc')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | CALCULAR PÉRDIDAS
        |--------------------------------------------------------------------------
        */

        $totalPerdidas = $mermas->sum(function ($merma) {

            $precio = (float) ($merma->item?->precio ?? 0);
            $cantidad = (float) $merma->cantidad;

            if ($merma->item_type === 'insumo') {
                return $cantidad * $precio * 0.100;
            }

            return $cantidad * $precio;
        });

        $totalRegistros = $mermas->count();

        /*
        |--------------------------------------------------------------------------
        | GENERAR PDF
        |--------------------------------------------------------------------------
        */

        $pdf = Pdf::loadView('mermas.pdf', [
            'mermas' => $mermas,
            'totalPerdidas' => $totalPerdidas,
            'totalRegistros' => $totalRegistros,
            'fechaGeneracion' => now(),
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->stream(
            'reporte_mermas_' . now()->format('Y-m-d_H-i-s') . '.pdf'
        );
    }
}