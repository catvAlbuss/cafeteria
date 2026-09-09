<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plato; 
use App\Models\Pedido; 
use App\Events\PedidoCreado;
use App\Events\PedidoActualizado;
use App\Services\ProductionAreaClassifier;

class DeliveryController extends Controller
{
    
protected $areaClassifier;
    public function __construct(ProductionAreaClassifier $areaClassifier)
    {
        $this->areaClassifier = $areaClassifier;
    }

  public function index()
    {
        $pedidos = Delivery::whereDate('created_at', today())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => $this->formatear($d));

        $platos = Plato::where('stock', '>', 0)
            ->orderBy('categoria')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'categoria', 'precio', 'stock', 'imagen']);

        return Inertia::render('clientes/delivery', [
            'pedidos' => $pedidos,
            'platos' => $platos,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente' => 'required|string|max:255',
            'telefono' => 'required|string|max:20',
            'direccion' => 'required|string|max:255',
            'productos' => 'required|array|min:1',
            'productos.*.nombre' => 'required|string',
            'productos.*.cantidad' => 'required|integer|min:1',
            'productos.*.precio' => 'required|numeric|min:0',
            'productos.*.subtotal' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        $numero = Delivery::count() + 1;
        $codigo = 'D-' . str_pad($numero, 3, '0', STR_PAD_LEFT);

        Delivery::create([
            'codigo' => $codigo,
            'cliente' => $validated['cliente'],
            'telefono' => $validated['telefono'],
            'direccion' => $validated['direccion'],
            'productos' => $validated['productos'],
            'total' => $validated['total'],
            'estado' => 'pendiente',
            'estado_delivery' => 'pendiente',
        ]);

        return back()->with('success', 'Pedido de delivery creado');
    }

    public function enviar(Delivery $delivery, Request $request)
    {
        $validated = $request->validate(['repartidor' => 'required|string|max:255']);

        $delivery->update([
            'repartidor' => $validated['repartidor'],
            'estado_delivery' => 'en_ruta',
        ]);

        return back();
    }

public function entregar(Delivery $delivery, Request $request)
{
    $validated = $request->validate(['metodo_pago' => 'required|in:efectivo,tarjeta,yape']);
    $delivery->update([
        'metodo_pago' => $validated['metodo_pago'],
        'estado' => 'pagado',
        'estado_delivery' => 'entregado',
    ]);

    $pedidos = \App\Models\Pedido::where('delivery_id', $delivery->id)->get();
    foreach ($pedidos as $pedido) {
        $pedido->update(['estado' => 'pagado']);
        broadcast(new \App\Events\PedidoActualizado($pedido));
    }

    return back()->with('success', 'Delivery entregado y cobrado');
}

    public function cancelar(Delivery $delivery)
    {
        $delivery->update(['estado_delivery' => 'cancelado']);
        return back();
    }

    public function destroy(Delivery $delivery)
    {
        $delivery->delete();
        return back();
    }

    private function formatear(Delivery $delivery): array
    {
        $productoTexto = collect($delivery->productos ?? [])
            ->map(fn($p) => ($p['cantidad'] ?? 1) . 'x ' . ($p['nombre'] ?? 'Producto'))
            ->implode(' · ');

        return [
            'id' => $delivery->id,
            'codigo' => $delivery->codigo,
            'cliente' => $delivery->cliente,
            'telefono' => $delivery->telefono,
            'direccion' => $delivery->direccion,
            'productos' => $productoTexto,
            'total' => (float) $delivery->total,
            'estado_delivery' => $delivery->estado_delivery,
            'estado_pago' => $delivery->estado,
            'repartidor' => $delivery->repartidor,
            'horaPedido' => $delivery->created_at->format('h:i A'),
            'horaEntrega' => $delivery->estado_delivery === 'entregado' && $delivery->updated_at
                ? $delivery->updated_at->format('h:i A')
                : null,
        ];
    }
public function cocina(Delivery $delivery)
{
    $delivery->update(['estado_delivery' => 'preparando']);
    $productos = is_array($delivery->productos)
        ? $delivery->productos
        : json_decode($delivery->productos, true) ?? [];

 
    foreach ($productos as $producto) {
        // Detectar el área del producto
        $area = $this->areaClassifier->detect($producto, 'cocina');

        $pedido = Pedido::create([
            'numero' => Pedido::generarNumero(),
            'team_id' => auth()->user()->current_team_id,
            'user_id' => auth()->id(),
            'mesa_id' => null,
            'mesa' => null,
            'delivery_id' => $delivery->id,
            'cliente' => $delivery->cliente,
            'tipo' => 'delivery',
            'productos' => [$producto], 
            'total' => (float) $producto['subtotal'],
            'estado' => 'pendiente',
            'area' => $area,
            'observaciones' => 'Delivery ' . $delivery->codigo . ' - ' . $producto['nombre'],
            'hora_pedido' => now(),
        ]);

        broadcast(new PedidoCreado($pedido));
    }

    return back()->with('success', 'Pedido enviado a cocina correctamente');
}


public function listoParaEntregar($id)
{
    $delivery = Delivery::findOrFail($id);
    $delivery->update([
        'estado_delivery' => 'listo_para_entregar',
    ]);

    $pedidos = \App\Models\Pedido::where('delivery_id', $delivery->id)->get();
    foreach ($pedidos as $pedido) {
        $pedido->update(['estado' => 'listo']);
        broadcast(new \App\Events\PedidoActualizado($pedido));
    }

    return back()->with('success', 'Pedido listo para entregar');
}

public function enRuta($id)
{
    $delivery = Delivery::findOrFail($id);
    $delivery->update([
        'estado_delivery' => 'en_ruta',
    ]);

    $pedidos = \App\Models\Pedido::where('delivery_id', $delivery->id)->get();
    foreach ($pedidos as $pedido) {
        $pedido->update(['estado' => 'entregado']);
        broadcast(new \App\Events\PedidoActualizado($pedido));
    }

    return back()->with('success', 'Delivery en camino');
}
}