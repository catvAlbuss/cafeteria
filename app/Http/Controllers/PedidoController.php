<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Mesa;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plato; 
use App\Models\Delivery;

class PedidoController extends Controller
{
    public function index(Request $request)
    {
        $mesaNumero = $request->query('mesa');
        $mesaInfo = $mesaNumero ? Mesa::where('numero', $mesaNumero)->first() : null;
        $platos = Plato::all();
        $pedidos = Pedido::with('mesa')
            ->orderBy('created_at', 'desc')
            ->limit(50) 
            ->get();

        return Inertia::render('dinero/ventas', [
            'platos' => $platos,       
            'mesas' => Mesa::all(),     
            'mesaInfo' => $mesaInfo,    
            'pedidos' => $pedidos,        
        ]);
    }

public function produccion()
{
    // Pedidos de mesas
    $pedidos = Pedido::with('mesa')
        ->whereIn('estado', ['pendiente', 'preparando'])
        ->orderBy('created_at', 'asc')
        ->get()
        ->map(function ($pedido) {
            $pedido->tipo_origen = 'mesa';
            return $pedido;
        });

    // Pedidos de delivery
    $deliveries = Delivery::whereIn('estado_delivery', ['preparando', 'listo_para_entregar'])
    ->orderBy('created_at', 'asc')
    ->get()
    ->map(function ($delivery) {
        $p = new \stdClass();
        $p->id = $delivery->id;
        $p->numero = $delivery->codigo;
        $p->mesa_id = null;
        $p->mesa = null;
        $p->cliente = $delivery->cliente;
        $p->productos = is_array($delivery->productos)
            ? $delivery->productos
            : (json_decode($delivery->productos, true) ?? []);
        $p->total = $delivery->total;
        // El tablero de Producción solo entiende pendiente/preparando/listo,
        // así que "listo_para_entregar" se muestra como "listo" ahí.
        $p->estado = $delivery->estado_delivery === 'listo_para_entregar' ? 'listo' : $delivery->estado_delivery;
        $p->tipo = 'delivery';
        $p->tipo_origen = 'delivery';
        $p->created_at = $delivery->created_at;
        $p->hora_pedido = $delivery->created_at;
        $p->observaciones = null;
        $p->hora_entrega = null;
        return $p;
    });

    // Unir y ordenar
    $todos = collect($pedidos)->concat($deliveries)
        ->sortBy('created_at')
        ->values();

    return Inertia::render('inventario/produccion', [
        'pedidos' => $todos
    ]);
}

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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'mesa_id' => 'nullable|exists:mesas,id',
            'mesa' => 'nullable|string',
            'cliente' => 'nullable|string|max:255',
            'productos' => 'required|array',
            'total' => 'required|numeric|min:0',
            'metodo_pago' => 'nullable|string',
            'tipo' => 'nullable|string',
            'estado' => 'nullable|string|in:pendiente,preparando,listo,entregado,pagado,cancelado',
            'observaciones' => 'nullable|string',
        ]);

        $estado = $validated['estado'] ?? 'pendiente';

        $pedido = Pedido::create([
            'numero' => Pedido::generarNumero(),
            'mesa_id' => $validated['mesa_id'] ?? null,
            'mesa' => $validated['mesa'] ?? null,
            'cliente' => $validated['cliente'] ?? 'Anónimo',
            'productos' => $validated['productos'],
            'total' => $validated['total'],
            'metodo_pago' => $validated['metodo_pago'] ?? null,
            'tipo' => $validated['tipo'] ?? 'mesa',
            'estado' => $estado, 
            'observaciones' => $validated['observaciones'] ?? null,
            'hora_pedido' => now(),
        ]);

        if ($estado === 'pendiente' && $pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado !== 'ocupada') {
                $mesa->estado = 'ocupada';
                if (!$mesa->mesero) {
                    $mesa->mesero = auth()->user()->name ?? null;
                }
                $mesa->save();
            }
        }

        return redirect()->back()->with('success', 'Pedido creado correctamente');
    }

    public function show(Pedido $pedido)
    {
        return Inertia::render('pedidos/show', [
            'pedido' => $pedido->load('mesa')
        ]);
    }

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

    // ✅ NUEVO: Marcar pedido como listo (para cocina)
    public function marcarListo($id)
    {
        $pedido = Pedido::findOrFail($id);
        $pedido->estado = 'listo';
        
        if ($pedido->tipo === 'delivery') {
            $pedido->estado_delivery = 'listo_para_entregar';
        }
        
        $pedido->save();

        return redirect()->back()->with('success', 'Pedido marcado como listo');
    }

    // ✅ NUEVO: Enviar delivery a cocina
    public function enviarACocina($id)
    {
        $pedido = Pedido::findOrFail($id);
        
        if ($pedido->tipo === 'delivery' && $pedido->estado === 'pendiente') {
            $pedido->estado = 'preparando';
            $pedido->estado_delivery = 'preparando';
            $pedido->save();
            
            return redirect()->back()->with('success', 'Pedido enviado a cocina');
        }
        
        return redirect()->back()->with('error', 'No se puede enviar este pedido a cocina');
    }

    public function pendientes()
    {
        $pedidos = Pedido::with('mesa')
            ->whereIn('estado', ['pendiente', 'preparando'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($pedidos);
    }

    public function listosParaCobrar()
    {
        $pedidos = Pedido::with('mesa')
            ->where('estado', 'listo')
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json($pedidos);
    }

    public function cobrar(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,yape',
            'monto_recibido' => 'nullable|numeric|min:0',
        ]);

        $pedido->estado = 'pagado';
        $pedido->save();

        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado === 'ocupada') {
                $mesa->estado = 'libre';
                $mesa->mesero = null;
                $mesa->cliente = null;
                $mesa->personas = null;
                $mesa->save();
            }
        }

        return redirect()->back()->with('success', 'Pedido cobrado correctamente');
    }

    public function destroy(Pedido $pedido)
    {
        $pedido->delete();
        return redirect()->back()->with('success', 'Pedido eliminado correctamente');
    }
}