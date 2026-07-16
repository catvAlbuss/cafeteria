<?php

namespace App\Http\Controllers;

use App\Models\MovimientoInventario;
use App\Models\Plato;
use App\Models\Insumo; 
use Illuminate\Http\Request;
use Inertia\Inertia; 

class CardexController extends Controller
{
    public function index(Request $request)
    {
        $teamId = auth()->user()->current_team_id;

        // Obtener todos los platos
        $platos = Plato::where('team_id', $teamId)->get();

       
        $insumos = Insumo::where('team_id', $teamId)->get();

        // Obtener movimientos con relaciones (platos E insumos)
        $movimientos = MovimientoInventario::where('team_id', $teamId)
            ->with(['user', 'item'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return Inertia::render('inventario/cardex', [
            'platos' => $platos,
            'insumos' => $insumos, 
            'movimientos' => $movimientos,
        ]);
    }

    //  Obtener movimientos por producto específico (plato o insumo)
    public function getMovimientosPorProducto($tipo, $id)
    {
        $teamId = auth()->user()->current_team_id;

        $movimientos = MovimientoInventario::where('team_id', $teamId)
            ->where('item_type', $tipo) // 'plato' o 'insumo'
            ->where('item_id', $id)
            ->with(['user'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Calcular saldo acumulado
        $saldo = 0;
        foreach ($movimientos as $mov) {
            $mov->saldo_anterior = $saldo;
            $saldo += $mov->tipo === 'entrada' ? $mov->cantidad : -$mov->cantidad;
            $mov->saldo_actual = $saldo;
        }

        return response()->json($movimientos);
    }

    // 📈 Resumen de movimientos
    public function resumen()
    {
        $teamId = auth()->user()->current_team_id;

        $totalEntradas = MovimientoInventario::where('team_id', $teamId)
            ->where('tipo', 'entrada')
            ->sum('cantidad');

        $totalSalidas = MovimientoInventario::where('team_id', $teamId)
            ->where('tipo', 'salida')
            ->sum('cantidad');

        $resumenPorMotivo = MovimientoInventario::where('team_id', $teamId)
            ->select('motivo', \DB::raw('count(*) as total'))
            ->groupBy('motivo')
            ->get();

        return response()->json([
            'total_entradas' => $totalEntradas,
            'total_salidas' => $totalSalidas,
            'resumen_por_motivo' => $resumenPorMotivo,
        ]);
    }
}