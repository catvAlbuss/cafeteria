<?php

namespace App\Http\Controllers;

use App\Events\PedidoActualizado;
use App\Models\Caja;
use App\Models\Mesa;
use App\Models\MovimientoInventario;
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
            'metodoPago' => 'nullable|in:efectivo,tarjeta,yape',
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
                'metodo_pago' => $validated['metodoPago'] ?? null,
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
            // Actualizar stock + cardex
            foreach ($validated['productos'] as $producto) {
                $plato = Plato::lockForUpdate()
                    ->where('id', $producto['id'])
                    ->first();

                if (! $plato) {
                    continue;
                }

                $plato->stock -= $producto['cantidad'];
                $plato->save();

                MovimientoInventario::create([
                    'team_id' => $request->user()->current_team_id,
                    'item_type' => 'plato',
                    'item_id' => $plato->id,
                    'tipo' => 'salida',
                    'cantidad' => $producto['cantidad'],
                    'stock_resultante' => $plato->stock,
                    'motivo' => 'venta',
                    'referencia_type' => 'pedido',
                    'referencia_id' => $pedido->id,
                    'user_id' => $request->user()->id,
                    'observaciones' => 'Venta #'.$pedido->numero,
                ]);
            }

            $pedido->stock_descontado = true;
            $pedido->save();

            DB::commit();

            return redirect()->back()->with([
                'success' => 'Pedido registrado correctamente.',
                'pedido_id' => $pedido->id,
            ]);

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

    public function cancelar(Request $request, Pedido $pedido)
    {
        if ($pedido->team_id !== (int) $request->user()->current_team_id) {
            abort(403, 'Este pedido no pertenece a tu sede.');
        }

        if (! $pedido->stock_descontado || $pedido->estado === 'cancelado') {
            return response()->json(['success' => false, 'error' => 'Las existencias de esta venta ya fueron restauradas']);
        }

        DB::beginTransaction();

        try {
            $productos = is_string($pedido->productos)
                ? json_decode($pedido->productos, true)
                : ($pedido->productos ?? []);

            foreach ((array) $productos as $producto) {
                $plato = Plato::lockForUpdate()
                    ->where('id', $producto['id'] ?? null)
                    ->first();

                if (! $plato) {
                    continue;
                }

                $plato->stock += $producto['cantidad'];
                $plato->save();

                MovimientoInventario::create([
                    'team_id' => $request->user()->current_team_id,
                    'item_type' => 'plato',
                    'item_id' => $plato->id,
                    'tipo' => 'entrada',
                    'cantidad' => $producto['cantidad'],
                    'stock_resultante' => $plato->stock,
                    'motivo' => 'ajuste',
                    'referencia_type' => 'pedido',
                    'referencia_id' => $pedido->id,
                    'user_id' => $request->user()->id,
                    'observaciones' => 'Anulación de venta #'.$pedido->numero,
                ]);
            }

            $pedido->estado = 'cancelado';
            $pedido->stock_descontado = false;
            $pedido->save();

            $caja = Caja::query()
                ->where('id', $pedido->caja_id)
                ->where('estado', 'Abierta')
                ->first();

            if ($caja) {
                $caja->total_ventas_caja = max(0, (float) $caja->total_ventas_caja - (float) $pedido->total);
                $caja->total_pedidos = max(0, (int) $caja->total_pedidos - 1);
                $caja->save();
            }

            DB::commit();

            broadcast(new PedidoActualizado($pedido));

            return response()->json(['success' => true, 'message' => 'Venta cancelada; el stock fue restaurado']);
        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('? Error al anular venta:', [
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile(),
            ]);

            return response()->json(['success' => false, 'error' => 'Error al anular la venta: '.$e->getMessage()], 500);
        }
    }
}
