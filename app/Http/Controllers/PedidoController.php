<?php

namespace App\Http\Controllers;

use App\Events\MesaActualizada;
use App\Events\PedidoActualizado;
use App\Events\PedidoCreado;
use App\Events\PedidoListo;
use App\Models\Delivery;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\Plato;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PedidoController extends Controller
{
    public function index(Request $request)
    {
        $mesaNumero = $request->query('mesa');

        if ($mesaNumero) {
            // Llegó con mesa explícita en la URL: guardarla como la mesa activa
            session(['mesa_activa' => $mesaNumero]);
        } else {
            // No vino en la URL (ej. volviste por el sidebar): recuperar la última mesa activa
            $mesaNumero = session('mesa_activa');
        }

        $mesaInfo = $mesaNumero ? Mesa::with('meseroUser')->where('numero', $mesaNumero)->first() : null;

        // Si la mesa ya está libre (fue cobrada), olvidar el contexto: aquí sí debe desaparecer
        if ($mesaInfo && $mesaInfo->estado === 'libre') {
            session()->forget('mesa_activa');
            $mesaInfo = null;
        }

        $platos = Plato::all();

        $pedidosActivos = $mesaInfo
            ? Pedido::where('mesa_id', $mesaInfo->id)
                ->whereNotIn('estado', ['pagado', 'cancelado'])
                ->limit(50)
                ->get()
                ->sortByDesc('created_at')
                ->values()
            : collect();

        $pedidos = Pedido::with('mesa')
            ->limit(50)
            ->get()
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('dinero/ventas', [
            'platos' => $platos,
            'mesas' => Mesa::all(),
            'mesaInfo' => $mesaInfo,
            'pedidos' => $pedidos,
            'pedidosActivos' => $pedidosActivos,
        ]);
    }

    public function produccion()
    {
        $teamId = auth()->user()->current_team_id;

        $pedidos = Pedido::with('mesa')
            ->where('team_id', $teamId)
            ->whereIn('estado', ['pendiente', 'preparando'])
            ->limit(100)
            ->get()
            ->sortBy('created_at')
            ->values()
            ->map(function ($pedido) {
                $pedido->tipo_origen = 'mesa';

                return $pedido;
            });

        // Pedidos de delivery
        $deliveries = Delivery::whereIn('estado_delivery', ['preparando', 'listo_para_entregar'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($delivery) {
                $p = new \stdClass;
                $p->id = $delivery->id;
                $p->numero = $delivery->codigo;
                $p->mesa_id = null;
                $p->mesa = null;
                $p->cliente = $delivery->cliente;
                $p->productos = is_array($delivery->productos)
                    ? $delivery->productos
                    : (json_decode($delivery->productos, true) ?? []);
                $p->total = $delivery->total;
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
            'pedidos' => $todos,
        ]);
    }

    public function cobrarMesa(Request $request, Mesa $mesa)
    {
        $validated = $request->validate([
            'metodo_pago' => 'required|in:efectivo,tarjeta,yape',
            'pedido_ids' => 'required|array|min:1',
            'pedido_ids.*' => 'exists:pedidos,id',
        ]);

        $pedidos = Pedido::whereIn('id', $validated['pedido_ids'])
            ->where('mesa_id', $mesa->id)
            ->whereNotIn('estado', ['pagado', 'cancelado'])
            ->get();

        foreach ($pedidos as $pedido) {
            $pedido->estado = 'pagado';
            $pedido->metodo_pago = $validated['metodo_pago'];
            $pedido->save();
            broadcast(new PedidoActualizado($pedido));
        }

        $mesa->estado = 'libre';
        $mesa->user_id = null;
        $mesa->cliente = null;
        $mesa->personas = null;
        $mesa->save();
        broadcast(new MesaActualizada($mesa));

        return redirect()->back()->with('success', 'Mesa cobrada y liberada correctamente');
    }

    public function caja()
    {
        $pedidos = Pedido::with('mesa')
            ->where('estado', 'listo')
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('dinero/caja', [
            'pedidos' => $pedidos,
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
            'area' => 'nullable|string|in:cocina,bar,horno,postres',
            'observaciones' => 'nullable|string',
            'user_id' => 'nullable|integer|exists:users,id',

        ]);

        if (! empty($validated['user_id']) && ! auth()->user()->currentTeam->members()->where('users.id', $validated['user_id'])->exists()) {
            return redirect()->back()->with('error', 'El empleado no pertenece a esta sede.');
        }

        $estado = $validated['estado'] ?? 'pendiente';
        $userId = $validated['user_id'] ?? auth()->id();

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
            'area' => $validated['area'] ?? 'cocina',
            'observaciones' => $validated['observaciones'] ?? null,
            'hora_pedido' => now(),
            'user_id' => $userId,
            'team_id' => auth()->user()->current_team_id,
        ]);

        if ($estado === 'pendiente' && $pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado !== 'ocupada') {
                $mesa->estado = 'ocupada';
                if (! $mesa->user_id) {
                    $mesa->user_id = $userId;
                }
                $mesa->save();
                broadcast(new MesaActualizada($mesa));
            }
        }

        broadcast(new PedidoCreado($pedido));

        return redirect()->back()->with('success', 'Pedido creado correctamente');
    }

    public function show(Pedido $pedido)
    {
        return Inertia::render('pedidos/show', [
            'pedido' => $pedido->load('mesa'),
        ]);
    }

    public function update(Request $request, Pedido $pedido)
    {
        // Si viene de la edición de productos (desde Ventas)
        if ($request->has('productos')) {
            $request->validate([
                'productos' => 'required|array|min:1',
                'productos.*.id' => 'required|integer',
                'productos.*.nombre' => 'required|string',
                'productos.*.cantidad' => 'required|integer|min:1',
                'productos.*.precio' => 'required|numeric|min:0',
                'productos.*.subtotal' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:0',
            ]);

            // Solo bloquear si el pedido ya cerró su ciclo (cobrado o cancelado)
            if (in_array($pedido->estado, ['pagado', 'cancelado'])) {
                return redirect()->back()->with('error', 'Este pedido ya no se puede editar');
            }

            $estabaListo = in_array($pedido->estado, ['listo', 'entregado']);

            $pedido->productos = $request->productos;
            $pedido->total = $request->total;

            // Si ya estaba listo/entregado y se le agrega algo nuevo, vuelve a producción
            if ($estabaListo) {
                $pedido->estado = 'pendiente';
            }

            $pedido->save();

            broadcast(new PedidoActualizado($pedido));

            if ($estabaListo) {
                broadcast(new PedidoCreado($pedido)); // dispara notificación en Producción como pedido nuevo
            }

            return redirect()->back()->with('success', 'Pedido actualizado correctamente');
        }

        // Si viene de cambio de estado (desde Producción)
        if ($request->has('estado')) {
            $validated = $request->validate([
                'estado' => 'required|in:pendiente,preparando,listo,entregado,pagado,cancelado',
            ]);

            $pedido->estado = $validated['estado'];

            if ($validated['estado'] === 'entregado') {
                $pedido->hora_entrega = now();
            }

            $pedido->save();

            broadcast(new PedidoActualizado($pedido));

            if ($validated['estado'] === 'listo') {
                broadcast(new PedidoListo($pedido));
            }

            return redirect()->back()->with('success', 'Estado del pedido actualizado');
        }

        return redirect()->back()->with('error', 'No se realizaron cambios');
    }

    //  NUEVO: Cancelar un pedido activo (desde el modal de edición en Ventas)
    public function cancelar(Pedido $pedido)
    {
        if (! in_array($pedido->estado, ['pendiente', 'preparando'])) {
            return redirect()->back()->with('error', 'Este pedido ya no se puede cancelar');
        }

        $pedido->estado = 'cancelado';
        $pedido->save();

        return redirect()->back()->with('success', 'Pedido cancelado');
    }

    //  Marcar pedido como listo (para cocina)
    public function marcarListo($id)
    {
        $pedido = Pedido::findOrFail($id);
        $pedido->estado = 'listo';

        if ($pedido->tipo === 'delivery') {
            $pedido->estado_delivery = 'listo_para_entregar';
        }

        $pedido->save();

        broadcast(new PedidoActualizado($pedido));
        broadcast(new PedidoListo($pedido));

        return redirect()->back()->with('success', 'Pedido marcado como listo');
    }

    //  Enviar delivery a cocina
    public function enviarACocina($id)
    {
        $pedido = Pedido::findOrFail($id);

        if ($pedido->tipo === 'delivery' && $pedido->estado === 'pendiente') {
            $pedido->estado = 'preparando';
            $pedido->estado_delivery = 'preparando';
            $pedido->save();

            broadcast(new PedidoActualizado($pedido));

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

        broadcast(new PedidoActualizado($pedido));

        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa && $mesa->estado === 'ocupada') {
                $mesa->estado = 'libre';
                $mesa->user_id = null;
                $mesa->cliente = null;
                $mesa->personas = null;
                $mesa->save();
                broadcast(new MesaActualizada($mesa));
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
