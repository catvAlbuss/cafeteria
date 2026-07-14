<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Caja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    /**
     * Registrar un pedido desde el POS (Caja)
     */
    public function registrar(Request $request)
    {
        $validated = $request->validate([
            'cliente' => 'nullable|string|max:100',
            'mesa' => 'nullable|string|max:50',
            'tipo' => 'required|in:salon,llevar,delivery',
            'metodoPago' => 'required|in:efectivo,tarjeta,yape',
            'productos' => 'required|array|min:1',
            'productos.*.id' => 'required|integer',
            'productos.*.nombre' => 'required|string',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.precio' => 'required|numeric|min:0',
            'productos.*.subtotal' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'igv' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        // Buscar caja abierta
        $caja = Caja::where('estado', 'Abierta')->first();

        if (!$caja) {
            return redirect()->back()->with('error', 'No hay caja abierta. Debes abrir caja primero.');
        }

        DB::beginTransaction();

        try {
            // Crear el pedido
            $pedido = Pedido::create([
                'cliente' => $validated['cliente'],
                'mesa' => $validated['mesa'],
                'tipo' => $validated['tipo'],
                'metodo_pago' => $validated['metodoPago'],
                'productos' => json_encode($validated['productos']),
                'subtotal' => $validated['subtotal'],
                'igv' => $validated['igv'],
                'total' => $validated['total'],
                'caja_id' => $caja->id,
                'estado' => 'pagado',
                'created_at' => now(),
            ]);

            // Actualizar la caja (sumar al total)
            $caja->update([
                'total_ventas_caja' => DB::raw('total_ventas_caja + ' . $validated['total']),
                'total_pedidos' => DB::raw('total_pedidos + 1'),
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Pedido registrado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al registrar pedido: ' . $e->getMessage());
        }
    }

    /**
     * Obtener el estado actual de la caja
     */
    public function estado()
    {
        $caja = Caja::where('estado', 'Abierta')->first();

        return response()->json([
            'abierta' => $caja !== null,
            'caja' => $caja,
        ]);
    }
}