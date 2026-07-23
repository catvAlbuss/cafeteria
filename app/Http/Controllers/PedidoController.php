<?php

namespace App\Http\Controllers;

use App\Events\MesaActualizada;
use App\Events\PedidoActualizado;
use App\Events\PedidoCreado;
use App\Events\PedidoListo;
use App\Models\Caja;
use App\Models\Delivery;
use App\Models\Insumo;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\Plato;
use App\Models\User;
use App\Services\ProductionAreaClassifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;

class PedidoController extends Controller
{
    public function __construct(private readonly ProductionAreaClassifier $productionAreaClassifier) {}

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

public function produccion(Request $request)
{
    $user = $request->user();
    $teamId = $user->current_team_id;
    
    $areasDisponibles = collect([
        'cocina' => $user->can('ver cocina'),
        'bar' => $user->can('ver bar'),
    ])->filter()->keys();

    abort_if($areasDisponibles->isEmpty(), 403);

    $areaSolicitada = $request->string('area')->toString();
    $areaActiva = $areasDisponibles->contains($areaSolicitada)
        ? $areaSolicitada
        : $areasDisponibles->first();
    
    $areasDePedidos = $areaActiva === 'bar' ? ['bar'] : ['cocina', 'horno', 'postres'];

    // ✅ Obtener pedidos (sin filtrar por delivery_id)
    $pedidos = Pedido::with('mesa')
        ->where('team_id', $teamId)
        ->whereIn('area', $areasDePedidos)
        ->whereIn('estado', ['pendiente', 'preparando'])
        ->limit(100)
        ->get()
        ->sortBy('created_at')
        ->values()
        ->map(function ($pedido) {
            $pedido->tipo_origen = $pedido->tipo === 'delivery' ? 'delivery' : 'mesa';
            return $pedido;
        });

    return Inertia::render('inventario/produccion', [
        'pedidos' => $pedidos,
        'areaActiva' => $areaActiva,
        'areasDisponibles' => $areasDisponibles->values(),
    ]);
}

    private function resumenProduccion(int $teamId, array $areas): array
    {
        $pedidosTerminadosHoy = Pedido::query()
            ->where('team_id', $teamId)
            ->whereIn('area', $areas)
            ->whereIn('estado', ['listo', 'entregado', 'pagado'])
            ->whereDate('created_at', today())
            ->get(['area', 'productos']);

        $cantidadPorArea = collect(['cocina', 'bar', 'horno', 'postres'])
            ->mapWithKeys(fn (string $area) => [$area => 0]);

        foreach ($pedidosTerminadosHoy as $pedido) {
            $cantidad = collect($pedido->productos ?? [])->sum(fn (array $producto) => (int) ($producto['cantidad'] ?? 1));
            $cantidadPorArea[$pedido->area] = ($cantidadPorArea[$pedido->area] ?? 0) + $cantidad;
        }

        $productosMasPedidos = [];
        $pedidosRecientes = Pedido::query()
            ->where('team_id', $teamId)
            ->whereIn('area', $areas)
            ->whereIn('estado', ['listo', 'entregado', 'pagado'])
            ->where('created_at', '>=', now()->subDays(30))
            ->get(['productos']);

        foreach ($pedidosRecientes as $pedido) {
            foreach ($pedido->productos ?? [] as $producto) {
                $nombre = (string) ($producto['nombre'] ?? 'Producto');
                $productosMasPedidos[$nombre] = ($productosMasPedidos[$nombre] ?? 0) + (int) ($producto['cantidad'] ?? 1);
            }
        }

        arsort($productosMasPedidos);

        $insumos = Insumo::query()
            ->where('team_id', $teamId)
            ->where('activo', true)
            ->get(['id', 'nombre', 'categoria', 'unidad', 'stock', 'stock_minimo', 'fecha_vencimiento']);

        $stockEscaso = $insumos
            ->filter(fn (Insumo $insumo) => (float) $insumo->stock <= (float) $insumo->stock_minimo)
            ->sortBy(fn (Insumo $insumo) => (float) $insumo->stock - (float) $insumo->stock_minimo)
            ->take(6)
            ->map(fn (Insumo $insumo) => [
                'id' => $insumo->id,
                'nombre' => $insumo->nombre,
                'stock' => (float) $insumo->stock,
                'stock_minimo' => (float) $insumo->stock_minimo,
                'unidad' => $insumo->unidad,
            ])->values();

        $porVencer = $insumos
            ->filter(fn (Insumo $insumo) => $insumo->fecha_vencimiento
                && $insumo->fecha_vencimiento->between(today(), today()->addDays(3)))
            ->sortBy('fecha_vencimiento')
            ->take(6)
            ->map(fn (Insumo $insumo) => [
                'id' => $insumo->id,
                'nombre' => $insumo->nombre,
                'fecha_vencimiento' => $insumo->fecha_vencimiento?->toDateString(),
                'dias' => today()->diffInDays($insumo->fecha_vencimiento, false),
            ])->values();

        return [
            'platosHoy' => $cantidadPorArea->sum(),
            'porArea' => $cantidadPorArea,
            'productosMasPedidos' => collect($productosMasPedidos)
                ->take(5)
                ->map(fn (int $cantidad, string $nombre) => compact('nombre', 'cantidad'))
                ->values(),
            'stockEscaso' => $stockEscaso,
            'porVencer' => $porVencer,
            'totalInsumos' => $insumos->count(),
        ];
    }

public function cobrarMesa(Request $request, Mesa $mesa)
{
    $validated = $request->validate([
        'metodo_pago' => 'required|in:efectivo,tarjeta,yape',
        'pedido_ids' => 'required|array|min:1',
        'pedido_ids.*' => 'exists:pedidos,id',
        'authorization_pin' => 'required|string|size:4',
    ]);

    $authorizer = $request->user()->currentTeam?->members()
        ->active()
        ->where('pin', $validated['authorization_pin'])
        ->first();

    if (! $authorizer instanceof User || ! $authorizer->hasPermissionTo('procesar pagos')) {
        return redirect()->back()->withErrors([
            'authorization_pin' => 'PIN inválido. Solo Caja, Administración o Gerencia pueden confirmar el pago.',
        ]);
    }

    $pedidos = DB::transaction(function () use ($mesa, $validated) {
        $caja = Caja::query()->where('estado', 'Abierta')->lockForUpdate()->firstOrFail();
        
        $pedidosActuales = Pedido::query()
            ->where('mesa_id', $mesa->id)
            ->whereNotIn('estado', ['pagado', 'cancelado'])
            ->lockForUpdate()
            ->get();

        if ($pedidosActuales->isEmpty()) {
            abort(422, 'Esta mesa no tiene pedidos por cobrar.');
        }

        $idsEnviados = collect($validated['pedido_ids']);
        $pedidosACobrar = $pedidosActuales->filter(function ($pedido) use ($idsEnviados) {
            return $idsEnviados->contains($pedido->id);
        });

        if ($pedidosACobrar->isEmpty()) {
            abort(422, 'No se encontraron pedidos válidos para cobrar.');
        }

        foreach ($pedidosACobrar as $pedido) {
            $pedido->update([
                'estado' => 'pagado',
                'metodo_pago' => $validated['metodo_pago'],
                'caja_id' => $caja->id,
            ]);
        }

        $quedanPedidos = $pedidosActuales->filter(function ($pedido) use ($idsEnviados) {
            return !$idsEnviados->contains($pedido->id);
        });

        if ($quedanPedidos->isEmpty()) {
         
            $mesa->estado = 'libre';
            $mesa->user_id = null;
            $mesa->cliente = null;
            $mesa->personas = null;
            $mesa->pedido_listo = false;
            $mesa->save();
        } else {
           
            $mesa->pedido_listo = false;
            $mesa->save();
        }

        return $pedidosACobrar;
    });

    $pedidos->each(fn (Pedido $pedido) => broadcast(new PedidoActualizado($pedido)));
    broadcast(new MesaActualizada($mesa->refresh()));

    return redirect()->back()->with('success', 'Pedido(s) cobrado(s) correctamente');
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
            'productos' => 'required|array|min:1',
            'productos.*.id' => 'nullable|integer',
            'productos.*.nombre' => 'required|string|max:255',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.precio' => 'required|numeric|min:0',
            'productos.*.subtotal' => 'required|numeric|min:0',
            'productos.*.categoria' => 'nullable|string|max:100',
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


[$orders, $updatedTable] = DB::transaction(function () use ($validated, $estado, $userId) {
    $orders = collect($validated['productos'])->map(function (array $producto) use ($validated, $estado, $userId) {
    
        $area = $this->productionAreaClassifier->detect($producto, 'cocina');
     
        if (!empty($producto['categoria'])) {
            $categoria = strtolower($producto['categoria']);
            if (in_array($categoria, ['bar', 'cocina', 'horno', 'postres'])) {
                $area = $categoria;
            }
        }
        
        if (!empty($producto['area'])) {
            $area = $producto['area'];
        }

        return Pedido::create([
            'numero' => Pedido::generarNumero(),
            'mesa_id' => $validated['mesa_id'] ?? null,
            'mesa' => $validated['mesa'] ?? null,
            'cliente' => $validated['cliente'] ?? 'Anónimo',
            'productos' => [$producto],
            'total' => (float) $producto['subtotal'],
            'metodo_pago' => $validated['metodo_pago'] ?? null,
            'tipo' => $validated['tipo'] ?? 'mesa',
            'estado' => $estado,
            'area' => $area,
            'observaciones' => $validated['observaciones'] ?? null,
            'hora_pedido' => now(),
            'user_id' => $userId,
            'team_id' => auth()->user()->current_team_id,
        ]);
    })->values();

    // Actualizar estado de la mesa
    $updatedTable = null;
    if ($estado === 'pendiente' && ! empty($validated['mesa_id'])) {
        $mesa = Mesa::query()->find($validated['mesa_id']);
        if ($mesa && $mesa->estado !== 'ocupada') {
            $mesa->estado = 'ocupada';
            $mesa->user_id ??= $userId;
            $mesa->save();
        }
        $updatedTable = $mesa;
    }

    return [$orders, $updatedTable];
}, 3);

        if ($updatedTable) {
            broadcast(new MesaActualizada($updatedTable));
        }

        $orders->each(fn (Pedido $order) => broadcast(new PedidoCreado($order)));

        return redirect()->back()->with('success', 'Pedido creado correctamente');
    }

    public function show(Pedido $pedido): RedirectResponse
    {
        $mesaNumero = $pedido->mesa()->value('numero');

        return to_route('ventas', $mesaNumero ? ['mesa' => $mesaNumero] : []);
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

            
            if ($pedido->estado !== 'pendiente') {
                return redirect()->back()->with('error', 'Este pedido ya está en preparación y no se puede editar');
            }

            $estabaListo = in_array($pedido->estado, ['listo', 'entregado']);

            $pedido->productos = $request->productos;
            $pedido->total = $request->total;

            if ($estabaListo) {
                $pedido->estado = 'pendiente';
            }

            $pedido->save();

            broadcast(new PedidoActualizado($pedido));

            if ($estabaListo) {
                broadcast(new PedidoCreado($pedido)); 
            }

            return redirect()->back()->with('success', 'Pedido actualizado correctamente');
        }

       
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
       
        $productos = is_array($pedido->productos) ? $pedido->productos : json_decode($pedido->productos, true) ?? [];
        $itemsNoListos = collect($productos)->filter(fn($item) => ($item['estado'] ?? 'pendiente') !== 'listo');
        $todosItemsListos = $itemsNoListos->count() === 0;
        
        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);

            if ($mesa) {
               
                $mesa->pedido_listo = $todosItemsListos;
                $mesa->save();
                broadcast(new MesaActualizada($mesa));
            }
        }

        broadcast(new PedidoListo($pedido));
    }

    return redirect()->back()->with('success', 'Estado del pedido actualizado');
}

        return response()->json([
    'success' => false,
    'message' => 'No se puede entregar. Faltan items por marcar como listos.'
], 422);
    }

    //  NUEVO: Cancelar un pedido activo (desde el modal de edición en Ventas)
public function cancelar(Pedido $pedido)
{
    if ($pedido->estado !== 'pendiente') {
        return redirect()->back()->with('error', 'Este pedido ya está en preparación y no se puede cancelar');
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

   
    if ($pedido->tipo === 'delivery' && $pedido->delivery_id) {
        $delivery = Delivery::find($pedido->delivery_id);
        if ($delivery) {
           
            $todosLosPedidos = Pedido::where('delivery_id', $delivery->id)
                ->where('estado', '!=', 'pagado')
                ->get();
            
            $todosListos = $todosLosPedidos->every(fn($p) => $p->estado === 'listo');
            
            if ($todosListos) {
                $delivery->estado_delivery = 'listo_para_entregar';
                $delivery->save();
            }
        }
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

        $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();

        $pedido->estado = 'pagado';
        $pedido->metodo_pago = $validated['metodo_pago'];
        $pedido->caja_id = $caja->id;
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

        /**
     * Entregar un ticket específico (pedido individual)
     */
public function entregarTicket($id)
{
    $pedido = Pedido::findOrFail($id);
    
    // ✅ Verificar que el pedido esté en estado 'listo' (no verificar productos individuales)
    if ($pedido->estado !== 'listo') {
        return redirect()->back()->with('error', 'Este pedido no está listo para entregar. Estado actual: ' . $pedido->estado);
    }
    
    DB::beginTransaction();
    
    try {
        // Marcar pedido como entregado
        $pedido->estado = 'entregado';
        $pedido->hora_entrega = now();
        $pedido->save();
        
        // Verificar si la mesa ya no tiene tickets pendientes
        $ticketsPendientes = Pedido::where('mesa_id', $pedido->mesa_id)
            ->whereNotIn('estado', ['entregado', 'pagado', 'cancelado'])
            ->count();
        
        if ($pedido->mesa_id) {
            $mesa = Mesa::find($pedido->mesa_id);
            
            if ($mesa) {
                if ($ticketsPendientes === 0) {
                    // Todos los tickets entregados → cambiar a "Cobrar" automáticamente
                    $mesa->estado = 'listo_cobrar';
                    $mesa->pedido_listo = false;
                    $mesa->save();
                    broadcast(new MesaActualizada($mesa));
                } else {
                    // Aún hay tickets pendientes
                    $mesa->pedido_listo = false;
                    $mesa->save();
                    broadcast(new MesaActualizada($mesa));
                }
            }
        }
        
        DB::commit();
        
        broadcast(new PedidoActualizado($pedido));
        
        return redirect()->back()->with('success', 'Ticket #' . ($pedido->numero ?? $pedido->id) . ' entregado correctamente');
        
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->back()->with('error', 'Error al entregar ticket: ' . $e->getMessage());
    }
}

}
