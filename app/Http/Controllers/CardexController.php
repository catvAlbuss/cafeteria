<?php

namespace App\Http\Controllers;

use App\Exports\CardexExport;
use App\Models\Insumo;
use App\Models\MovimientoInventario;
use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class CardexController extends Controller
{
    /**
     * Mostrar Cardex
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        // =====================================================
        // PLATOS
        // =====================================================

        $platos = Plato::query()
            ->where('team_id', $teamId)
            ->orderBy('nombre')
            ->get()
            ->map(function ($plato) {
                return [
                    'id' => $plato->id,
                    'nombre' => $plato->nombre,
                    'categoria' => $plato->categoria ?? '',
                    'stock' => (float) ($plato->stock ?? 0),
                    'item_type' => 'plato',
                ];
            });

        // =====================================================
        // INSUMOS
        // =====================================================

        $insumos = Insumo::query()
            ->where('team_id', $teamId)
            ->orderBy('nombre')
            ->get()
            ->map(function ($insumo) {
                return [
                    'id' => $insumo->id,
                    'nombre' => $insumo->nombre,
                    'categoria' => $insumo->categoria ?? '',
                    'stock' => (float) ($insumo->stock ?? 0),
                    'unidad' => $insumo->unidad ?? '',
                    'item_type' => 'insumo',
                ];
            });

        // =====================================================
        // MOVIMIENTOS
        // =====================================================

        $movimientos = MovimientoInventario::query()
            ->where('team_id', $teamId)
            ->with([
                'user:id,name',
                'item',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($movimiento) {

                $item = $movimiento->item;

                return [
                    'id' => $movimiento->id,

                    'item_type' => $movimiento->item_type,

                    'item_id' => $movimiento->item_id,

                    'tipo' => $movimiento->tipo,

                    'cantidad' => (float) ($movimiento->cantidad ?? 0),

                    'stock_resultante' => (float) (
                        $movimiento->stock_resultante ?? 0
                    ),

                    'motivo' => $movimiento->motivo ?? '',

                    'submotivo' => $movimiento->submotivo ?? '',

                    'observaciones' => $movimiento->observaciones ?? '',

                    'user' => $movimiento->user
                        ? [
                            'name' => $movimiento->user->name,
                        ]
                        : [
                            'name' => 'Sistema',
                        ],

                    'item' => $item
                        ? [
                            'nombre' => $item->nombre ?? '-',
                            'categoria' => $item->categoria ?? '-',
                        ]
                        : [
                            'nombre' => '-',
                            'categoria' => '-',
                        ],

                    'created_at' => $movimiento->created_at
                        ? $movimiento->created_at->toISOString()
                        : '',
                ];
            });

        return Inertia::render('inventario/cardex', [
            'platos' => $platos,
            'insumos' => $insumos,
            'movimientos' => $movimientos,
        ]);
    }

    /**
     * =========================================================
     * REGISTRAR MOVIMIENTO
     * =========================================================
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $validated = $request->validate([
            'item_type' => [
                'required',
                'in:plato,insumo',
            ],

            'item_id' => [
                'required',
                'integer',
                'min:1',
            ],

            'tipo' => [
                'required',
                'in:entrada,salida',
            ],

            'cantidad' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'motivo' => [
                'required',
                'string',
                'max:255',
            ],

            'observaciones' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        return DB::transaction(function () use (
            $validated,
            $user,
            $teamId
        ) {

            $itemType = $validated['item_type'];
            $itemId = (int) $validated['item_id'];
            $tipo = $validated['tipo'];
            $cantidad = (float) $validated['cantidad'];

            // =================================================
            // BUSCAR PRODUCTO / INSUMO
            // =================================================

            if ($itemType === 'plato') {

                $item = Plato::query()
                    ->where('team_id', $teamId)
                    ->lockForUpdate()
                    ->find($itemId);

            } else {

                $item = Insumo::query()
                    ->where('team_id', $teamId)
                    ->lockForUpdate()
                    ->find($itemId);
            }

            if (!$item) {
                return redirect()
                    ->back()
                    ->with('error', 'El producto o insumo no existe.');
            }

            // =================================================
            // STOCK ACTUAL
            // =================================================

            $stockActual = (float) ($item->stock ?? 0);

            // =================================================
            // CALCULAR NUEVO STOCK
            // =================================================

            if ($tipo === 'entrada') {

                $nuevoStock = $stockActual + $cantidad;

            } else {

                if ($stockActual < $cantidad) {

                    return redirect()
                        ->back()
                        ->with(
                            'error',
                            'Stock insuficiente. Stock actual: ' .
                            $stockActual
                        );
                }

                $nuevoStock = $stockActual - $cantidad;
            }

            // =================================================
            // ACTUALIZAR STOCK
            // =================================================

            $item->stock = $nuevoStock;
            $item->save();

            // =================================================
            // GUARDAR MOVIMIENTO
            // =================================================

            MovimientoInventario::create([
                'team_id' => $teamId,

                'item_type' => $itemType,

                'item_id' => $item->id,

                'tipo' => $tipo,

                'cantidad' => $cantidad,

                'stock_resultante' => $nuevoStock,

                'motivo' => $validated['motivo'],

                'user_id' => $user->id,

                'observaciones' =>
                    $validated['observaciones'] ?? null,
            ]);

            return redirect()
                ->back()
                ->with(
                    'success',
                    'Movimiento registrado correctamente.'
                );
        });
    }

    /**
     * =========================================================
     * EXPORTAR CARDEX
     * =========================================================
     */
    public function export(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $teamId = $user->current_team_id;

        $movimientos = MovimientoInventario::query()
            ->where('team_id', $teamId)
            ->with([
                'user:id,name',
                'item',
            ])
            ->orderByDesc('created_at')
            ->get();

        return Excel::download(
            new CardexExport($movimientos),
            'cardex_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }
}