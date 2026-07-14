<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Caja;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ContadorController extends Controller
{
    /**
     * Mostrar la página del contador
     */
   public function index()
{
    // 1. Obtener caja actual (abierta)
    $cajaActual = Caja::where('estado', 'Abierta')->first();

    // 2. Ingresos del día (desde pedidos)
    $ingresosHoy = Pedido::whereDate('created_at', today())
        ->where('estado', '!=', 'cancelado')
        ->sum('total');

    // 3. Resumen financiero
    $resumen = [
        'ingresos' => $ingresosHoy,
        'cajaActual' => $cajaActual ? $cajaActual->monto_inicial + $ingresosHoy : 0,
    ];

    // 4. Ingresos detallados por tipo
    $ingresosDetalle = [
        [
            'concepto' => 'Ventas en caja',
            'monto' => Pedido::whereDate('created_at', today())
                ->where('tipo', 'caja')
                ->where('estado', '!=', 'cancelado')
                ->sum('total')
        ],
        [
            'concepto' => 'Deliverys',
            'monto' => Pedido::whereDate('created_at', today())
                ->where('tipo', 'delivery')
                ->where('estado', '!=', 'cancelado')
                ->sum('total')
        ],
        [
            'concepto' => 'Pedidos mesa',
            'monto' => Pedido::whereDate('created_at', today())
                ->where('tipo', 'mesa')
                ->where('estado', '!=', 'cancelado')
                ->sum('total')
        ],
    ];

    // 5. Movimientos recientes (últimos 10 pedidos)
    $movimientos = Pedido::where('estado', '!=', 'cancelado')
        ->orderBy('created_at', 'desc')
        ->limit(10)
        ->get()
        ->map(function ($pedido) {
            $descripcion = match($pedido->tipo) {
                'delivery' => 'Delivery',
                'caja' => 'Venta en caja',
                'mesa' => 'Pedido mesa',
                default => 'Venta'
            };
            
            return [
                'id' => $pedido->id,
                'tipo' => 'ingreso',
                'descripcion' => $descripcion,
                'monto' => $pedido->total,
                'cliente' => $pedido->cliente ?? 'Anónimo',
                'hora' => $pedido->created_at->format('h:i A'),
            ];
        })
        ->toArray();

    // 6. Historial de cajas
    $cajas = Caja::orderBy('created_at', 'desc')->get();

    // 7. Estadísticas adicionales
    $totalPedidosHoy = Pedido::whereDate('created_at', today())
        ->where('estado', '!=', 'cancelado')
        ->count();

    $totalCajasAbiertas = Caja::where('estado', 'Abierta')->count();
    $totalCajasCerradas = Caja::where('estado', 'Cerrada')->count();

    // 👇 AQUÍ ESTÁ EL CAMBIO: 'restaurante/contador' → 'dinero/contador'
    return Inertia::render('dinero/contador', [
        'cajas' => $cajas,
        'cajaActual' => $cajaActual,
        'resumen' => $resumen,
        'movimientos' => $movimientos,
        'ingresosDetalle' => $ingresosDetalle,
        'estadisticas' => [
            'totalPedidosHoy' => $totalPedidosHoy,
            'totalCajasAbiertas' => $totalCajasAbiertas,
            'totalCajasCerradas' => $totalCajasCerradas,
        ],
    ]);
}
    /**
     * Abrir una nueva caja
     */
    public function abrir(Request $request)
    {
        $validated = $request->validate([
            'empleado' => 'required|string|max:100',
            'caja' => 'required|string|max:50',
            'turno' => 'required|in:Mañana,Tarde,Noche',
            'montoInicial' => 'required|numeric|min:0',
        ]);

        // Verificar si hay caja abierta
        $abierta = Caja::where('estado', 'Abierta')->first();
        if ($abierta) {
            return redirect()->back()->with('error', 'Ya hay una caja abierta. Ciérrala primero.');
        }

        $caja = Caja::create([
            'caja' => $validated['caja'],
            'empleado' => $validated['empleado'],
            'turno' => $validated['turno'],
            'monto_inicial' => $validated['montoInicial'],
            'fecha_apertura' => now(),
            'estado' => 'Abierta',
        ]);

        return redirect()->back()->with('success', 'Caja abierta correctamente.');
    }

    /**
     * Cerrar una caja
     */
    public function cerrar(Request $request, $id)
    {
        $validated = $request->validate([
            'montoFinal' => 'required|numeric|min:0',
            'ventasDia' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        $caja = Caja::findOrFail($id);
        
        if ($caja->estado === 'Cerrada') {
            return redirect()->back()->with('error', 'Esta caja ya está cerrada.');
        }

        // Calcular ingresos del día desde la apertura
        $ingresosDesdeApertura = Pedido::where('caja_id', $caja->id)
            ->where('estado', '!=', 'cancelado')
            ->sum('total');

        $caja->update([
            'monto_final' => $validated['montoFinal'],
            'ventas_dia' => $validated['ventasDia'],
            'observaciones' => $validated['observaciones'],
            'fecha_cierre' => now(),
            'estado' => 'Cerrada',
            'total_ventas_caja' => $ingresosDesdeApertura,
        ]);

        return redirect()->back()->with('success', 'Caja cerrada correctamente.');
    }

    /**
     * Eliminar un registro de caja
     */
    public function destroy($id)
    {
        $caja = Caja::findOrFail($id);
        
        if ($caja->estado === 'Abierta') {
            return redirect()->back()->with('error', 'No se puede eliminar una caja abierta.');
        }
        
        $caja->delete();
        return redirect()->back()->with('success', 'Registro eliminado correctamente.');
    }
}