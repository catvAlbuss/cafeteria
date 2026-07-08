<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Mesa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PedidoController extends Controller
{
    //  Listar todos los pedidos
    public function index()
    {
        $pedidos = Pedido::with('mesa')->orderBy('created_at', 'desc')->get();
        return Inertia::render('pedidos/index', [
            'pedidos' => $pedidos
        ]);
    }

    //  Listar pedidos para producción (pendientes y preparando)
    public function produccion()
    {
        $pedidos = Pedido::with('mesa')
            ->whereIn('estado', ['pendiente', 'preparando'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        return Inertia::render('inventario/produccion', [
            'pedidos' => $pedidos
        ]);
    }

    //  Listar pedidos para caja (listos)
    public function caja()
    {
        $pedidos = Pedido::with('mesa')
            ->where('estado', 'listo')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return Inertia::render('dinero/caja', [
            'pedidos' => $pedidos
        ]);
    }

    //  Crear un nuevo pedido (desde Ventas)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesa_id' => 'nullable|exists:mesas,id',
            'cliente' => 'nullable|string|max:255',
            'productos' => 'required|array',
            'total' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        $pedido = Pedido::create([
            'numero' => Pedido::generarNumero(),
            'mesa_id' => $validated['mesa_id'] ?? null,
            'cliente' => $validated['cliente'] ?? 'Anónimo',
            'productos' => $validated['productos'],
            'total' => $validated['total'],
            'estado' => 'pendiente',
            'observaciones' => $validated['observaciones'] ?? null,
            'hora_pedido' => now(),
        ]);

        // Actualizar estado de la mesa
        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado !== 'ocupada') {
                $mesa->estado = 'ocupada';
                $mesa->save();
            }
        }

        return redirect()->back()->with('success', 'Pedido creado correctamente');
    }

    //  Ver detalle de un pedido
    public function show(Pedido $pedido)
    {
        return Inertia::render('pedidos/show', [
            'pedido' => $pedido->load('mesa')
        ]);
    }

    //  Cambiar estado de un pedido
    public function update(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'estado' => 'required|in:pendiente,preparando,listo,entregado,pagado,cancelado',
        ]);

        $pedido->estado = $validated['estado'];

        if ($validated['estado'] === 'entregado') {
            $pedido->hora_entrega = now();
        }

        $pedido->save();

        return redirect()->back()->with('success', 'Estado del pedido actualizado');
    }

    //  Listar pedidos pendientes (para Producción)
    public function pendientes()
    {
        $pedidos = Pedido::with('mesa')
            ->whereIn('estado', ['pendiente', 'preparando'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($pedidos);
    }

    //  Listar pedidos listos para cobrar (para Caja)
    public function listosParaCobrar()
    {
        $pedidos = Pedido::with('mesa')
            ->where('estado', 'listo')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json($pedidos);
    }

    //  Cobrar un pedido (cambiar a pagado)
    public function cobrar(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,yape',
            'monto_recibido' => 'nullable|numeric|min:0',
        ]);

        $pedido->estado = 'pagado';
        $pedido->save();

        // Si el pedido tiene mesa, liberarla
        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado === 'ocupada') {
                $mesa->estado = 'libre';
                $mesa->save();
            }
        }

        return redirect()->back()->with('success', 'Pedido cobrado correctamente');
    }

    //  Eliminar pedido
    public function destroy(Pedido $pedido)
    {
        $pedido->delete();
        return redirect()->back()->with('success', 'Pedido eliminado correctamente');
    }
}