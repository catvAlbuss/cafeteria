<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plato; 

class DeliveryController extends Controller
{
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
    return back()->with('success', 'Pedido enviado a cocina');
}


public function listoParaEntregar($id)
{
    $delivery = Delivery::findOrFail($id);
    $delivery->update([
        'estado_delivery' => 'listo_para_entregar',
    ]);
    return back()->with('success', 'Pedido listo para entregar');
}

public function enRuta($id)
{
    $delivery = Delivery::findOrFail($id);
    $delivery->update([
        'estado_delivery' => 'en_ruta',
    ]);
    return back()->with('success', 'Delivery en camino');
}
}