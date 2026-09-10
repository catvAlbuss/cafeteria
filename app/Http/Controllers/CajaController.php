<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CajaController extends Controller
{
    public function index()
    {
        $teamId = auth()->user()->current_team_id;

        $platos = Plato::all();

        $mesas = Mesa::where('team_id', $teamId)
            ->with('meseroUser')
            ->orderBy('numero')
            ->get()
            ->values();

        $pedidos = Pedido::where('team_id', $teamId)
            ->whereNotIn('estado', ['pagado', 'cancelado'])
            ->get()
            ->values();

        return Inertia::render('dinero/caja', [
            'platos' => $platos,
            'mesas' => $mesas->values()->all(),
            'pedidos' => $pedidos->values()->all(),
        ]);
    }

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

        $caja = Caja::query()->where('estado', 'Abierta')->first();

        if (! $caja) {
            return redirect()->back()->with('error', 'No hay caja abierta. Debes abrir caja primero.');
        }
        DB::beginTransaction();
        try {
            // Crear el pedido
            $pedido = Pedido::create([
                'numero' => Pedido::generarNumero(),
                'cliente' => $validated['cliente'],
                'mesa' => $validated['mesa'],
                'tipo' => $validated['tipo'],
                'metodo_pago' => $validated['metodoPago'],
                'productos' => json_encode($validated['productos']),
                'subtotal' => $validated['subtotal'],
                'igv' => $validated['igv'],
                'total' => $validated['total'],
                'caja_id' => $caja->id,
                'user_id' => $request->user()->id,
                'team_id' => $request->user()->current_team_id,
                'estado' => 'pagado',
                'created_at' => now(),
            ]);

            // Actualizar caja
            $caja->total_ventas_caja = $caja->total_ventas_caja + $validated['total'];
            $caja->total_pedidos = $caja->total_pedidos + 1;
            $caja->save();
            // Actualizar stock
            foreach ($validated['productos'] as $producto) {
                Plato::where('id', $producto['id'])->decrement('stock', $producto['cantidad']);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Pedido registrado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('❌ Error al registrar pedido:', [
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile(),
            ]);

            return redirect()->back()->with('error', 'Error al registrar pedido: '.$e->getMessage());
        }
    }

    public function estado()
    {
        $caja = Caja::query()->where('estado', 'Abierta')->first();

        return response()->json([
            'abierta' => $caja !== null,
            'caja' => $caja,
        ]);
    }
}
