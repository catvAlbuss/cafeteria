<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReporteController extends Controller
{
    public function index(Request $request)
    {
        try {
            $fechaInicio = $request->input('fecha_inicio', now()->startOfMonth()->toDateString());
            $fechaFin = $request->input('fecha_fin', now()->toDateString());

            $cacheKey = 'reportes.dashboard.'.auth()->user()->current_team_id.".{$fechaInicio}.{$fechaFin}";

            $data = call_user_func(function () use ($fechaInicio, $fechaFin) {

                // ============================================================
                // 1️⃣ DATOS DE VENTAS (SOLO PAGADOS)
                // ============================================================

                $ventasDia = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->sum('total');

                $ventasAyer = Pedido::whereDate('created_at', today()->subDay())
                    ->where('estado', 'pagado')
                    ->sum('total');

                $clientesHoy = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->count();

                $deliverysHoy = Pedido::whereDate('created_at', today())
                    ->where('tipo', 'delivery')
                    ->where('estado', 'pagado')
                    ->count();

                $deliverysEnRuta = Pedido::whereDate('created_at', today())
                    ->where('tipo', 'delivery')
                    ->where('estado', 'pagado')
                    ->count();

                // Ventas por tipo
                $ventasPorTipo = Pedido::whereBetween('created_at', [
                    Carbon::parse($fechaInicio)->startOfDay(),
                    Carbon::parse($fechaFin)->endOfDay(),
                ])
                    ->where('estado', 'pagado')
                    ->select('tipo', DB::raw('COUNT(*) as cantidad'), DB::raw('SUM(total) as total'))
                    ->groupBy('tipo')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'tipo' => $item->tipo ?? 'No especificado',
                            'cantidad' => $item->cantidad,
                            'total' => $item->total,
                        ];
                    });

                // Mesas
                $totalMesas = Mesa::count();
                $mesasOcupadas = Mesa::where('estado', 'ocupada')->count();
                $mesasLibres = Mesa::where('estado', 'libre')->count();

                // Tickets
                $ticketsHoy = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->count();

                // ============================================================
                // TICKETS POR ORIGEN (Mesa + Caja)
                // ============================================================

                $ticketsPorOrigen = Pedido::whereBetween('created_at', [
                    Carbon::parse($fechaInicio)->startOfDay(),
                    Carbon::parse($fechaFin)->endOfDay(),
                ])
                    ->where('estado', 'pagado')
                    ->select(
                        DB::raw('CASE 
        WHEN mesa_id IS NOT NULL THEN CONCAT("Mesa ", mesa_id)
        ELSE "Caja"
    END as origen'),
                        DB::raw('COUNT(*) as tickets')
                    )
                    ->groupBy('origen')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'origen' => $item->origen,
                            'tickets' => $item->tickets,
                        ];
                    });
                // Total cobrado hoy
                $totalCobradoHoy = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->sum('total');

                // Estado de caja
                $cajaActual = Caja::with('empleadoUser')->where('estado', 'Abierta')->first();

                // ============================================================
                // 2️⃣ RESUMEN
                // ============================================================

                $resumen = [
                    'ventasDia' => $ventasDia,
                    'ventasCambio' => $ventasAyer > 0 ? round((($ventasDia - $ventasAyer) / $ventasAyer) * 100) : 0,
                    'clientes' => $clientesHoy,
                    'clientesNuevos' => 0,
                    'deliverys' => $deliverysHoy,
                    'deliverysEnRuta' => $deliverysEnRuta,
                    'gananciaNeta' => $ventasDia,
                    'gananciaCambio' => 0,
                    'ticketsHoy' => $ticketsHoy,
                    'mesasOcupadas' => $mesasOcupadas,
                    'mesasLibres' => $mesasLibres,
                    'totalMesas' => $totalMesas,
                    'totalCobradoHoy' => $totalCobradoHoy,
                    'cajaAbierta' => $cajaActual !== null,
                    'cajaEmpleado' => $cajaActual ? $cajaActual->empleado : null,
                ];

                // ============================================================
                // 3️⃣ VENTAS DIARIAS (últimos 30 días)
                // ============================================================

                $ventasDiarias = Pedido::whereBetween('created_at', [now()->subDays(30), now()])
                    ->where('estado', 'pagado')
                    ->select(
                        DB::raw('DATE(created_at) as fecha'),
                        DB::raw('COUNT(*) as tickets'),
                        DB::raw('SUM(total) as ventas')
                    )
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy('fecha', 'asc')
                    ->get()
                    ->map(function ($item) {
                        $venta = $item->ventas ?? 0;

                        return [
                            'fecha' => Carbon::parse($item->fecha)->format('d/m/Y'),
                            'tickets' => $item->tickets ?? 0,
                            'ventas' => $venta,
                            'gastos' => round($venta * 0.25, 2),
                            'ganancia' => round($venta * 0.75, 2),
                        ];
                    });

                // ============================================================
                // 4️⃣ PRODUCTOS MÁS VENDIDOS
                // ============================================================

                $productosMasVendidos = $this->getProductosMasVendidos();

                // ============================================================
                // 5️⃣ TOTALES GENERALES
                // ============================================================

                $totalVentas = Pedido::where('estado', 'pagado')->sum('total');
                $totalTickets = Pedido::where('estado', 'pagado')->count();

                $totales = [
                    'totalVentas' => $totalVentas,
                    'totalTickets' => $totalTickets,
                    'totalGastos' => round($totalVentas * 0.25, 2),
                    'totalGanancia' => round($totalVentas * 0.75, 2),
                    'ticketPromedio' => $totalTickets > 0 ? $totalVentas / $totalTickets : 0,
                    'margenGanancia' => $totalVentas > 0 ? round(($totalVentas * 0.75 / $totalVentas) * 100, 1) : 0,
                ];

                // ============================================================
                // 6️ VENTAS DEL DÍA - DETALLE (agrupado por venta real, no por ticket individual)
                // ============================================================

                $mesasMap = Mesa::pluck('numero', 'id');

                $ventasDelDiaDetalle = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->orderByDesc('created_at')
                    ->get()
                    // Agrupa por venta_grupo (varios pedidos de una misma mesa cobrados juntos).
                    // Si no tiene venta_grupo (venta directa de Caja, delivery, o cobro individual
                    // antiguo), se trata como su propio grupo de 1 solo elemento (comportamiento
                    // igual al de antes para esos casos).
                    ->groupBy(fn ($pedido) => $pedido->venta_grupo ?: 'individual-'.$pedido->id)
                    ->map(function ($pedidosDelGrupo) use ($mesasMap) {
                        $primerPedido = $pedidosDelGrupo->first();

                        // Unir los productos de TODOS los pedidos del grupo (toda la mesa/venta)
                        $items = [];
                        foreach ($pedidosDelGrupo as $pedidoDelGrupo) {
                            $productosRaw = is_string($pedidoDelGrupo->productos)
                                ? json_decode($pedidoDelGrupo->productos, true)
                                : $pedidoDelGrupo->productos;

                            if (is_array($productosRaw)) {
                                foreach ($productosRaw as $item) {
                                    if (is_array($item) && isset($item['nombre'])) {
                                        $items[] = $item;
                                    } elseif (is_array($item) && isset($item['productos']) && is_array($item['productos'])) {
                                        foreach ($item['productos'] as $subItem) {
                                            if (is_array($subItem) && isset($subItem['nombre'])) {
                                                $items[] = $subItem;
                                            }
                                        }
                                    } elseif (is_array($item) && isset($item[0]) && is_array($item[0]) && isset($item[0]['nombre'])) {
                                        foreach ($item as $subItem) {
                                            if (is_array($subItem) && isset($subItem['nombre'])) {
                                                $items[] = $subItem;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Normalizar cada línea con precio/subtotal
                        $itemsConPrecio = collect($items)
                            ->filter(fn ($p) => is_array($p) && isset($p['nombre']))
                            ->map(function ($p) {
                                $precio = (float) ($p['precio'] ?? 0);
                                $cantidad = (int) ($p['cantidad'] ?? 1);
                                $subtotal = (float) ($p['subtotal'] ?? $precio * $cantidad);

                                return [
                                    'nombre' => $p['nombre'] ?? 'Producto',
                                    'cantidad' => $cantidad,
                                    'precio' => $precio,
                                    'subtotal' => $subtotal,
                                ];
                            })
                            // Fusiona líneas del mismo producto (ej: 2 tickets con "Capuccino" -> 1 línea "2x Capuccino")
                            ->groupBy('nombre')
                            ->map(function ($grupoProducto) {
                                $primero = $grupoProducto->first();

                                return [
                                    'nombre' => $primero['nombre'],
                                    'cantidad' => $grupoProducto->sum('cantidad'),
                                    'precio' => $primero['precio'],
                                    'subtotal' => $grupoProducto->sum('subtotal'),
                                ];
                            })
                            ->values()
                            ->toArray();

                        $productoTexto = collect($itemsConPrecio)
                            ->map(fn ($p) => ($p['cantidad'] ?? 1).'x '.($p['nombre'] ?? 'Producto'))
                            ->implode(', ');

                        // Determinar origen (igual que antes)
                        if ($primerPedido->mesa_id && isset($mesasMap[$primerPedido->mesa_id])) {
                            $numeroMesa = $mesasMap[$primerPedido->mesa_id];
                        } elseif ($primerPedido->tipo === 'delivery') {
                            $numeroMesa = 'Delivery';
                        } else {
                            $numeroMesa = 'Caja';
                        }

                        $totalGrupo = $pedidosDelGrupo->sum('total');
                        $fechaPago = $pedidosDelGrupo->sortByDesc('updated_at')->first()->updated_at
                            ?? $primerPedido->created_at;

                        return [
                            'fecha' => $fechaPago->format('d/m/Y H:i'),
                            'mesa' => $numeroMesa,
                            'producto' => $productoTexto ?: 'Sin productos',
                            'total' => $totalGrupo,
                            'metodo_pago' => $primerPedido->metodo_pago ? ucfirst($primerPedido->metodo_pago) : 'N/A',
                            'productosDetalle' => $itemsConPrecio,
                        ];
                    })
                    ->values();
                // ============================================================
                // 7 MÉTODOS DE PAGO
                // ============================================================

                $metodosPago = Pedido::whereDate('created_at', today())
                    ->where('estado', 'pagado')
                    ->whereNotNull('metodo_pago')
                    ->select('metodo_pago', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as cantidad'))
                    ->groupBy('metodo_pago')
                    ->get()
                    ->map(function ($item) {
                        $mapa = [
                            'efectivo' => 'Efectivo',
                            'tarjeta' => 'Tarjeta',
                            'yape' => 'Yape / Plin',
                        ];

                        return [
                            'metodo' => $mapa[$item->metodo_pago] ?? $item->metodo_pago,
                            'total' => $item->total,
                            'cantidad' => $item->cantidad,
                        ];
                    });

                // ============================================================
                // 8 MÉTODOS DE PAGO CON PORCENTAJES
                // ============================================================
                $metodosPagoConPorcentaje = $metodosPago->map(function ($item) use ($totalCobradoHoy) {
                    $item['porcentaje'] = $totalCobradoHoy > 0 ? round(($item['total'] / $totalCobradoHoy) * 100) : 0;

                    return $item;
                });

                // ============================================================
                // 9  DATOS DEL REPORTE (cacheados 5 min)
                // ============================================================

                return [
                    'resumen' => $resumen,
                    'ventasDiarias' => $ventasDiarias,
                    'ventasDelDiaDetalle' => $ventasDelDiaDetalle,
                    'productosMasVendidos' => $productosMasVendidos,
                    'metodosPago' => $metodosPagoConPorcentaje,
                    'totales' => $totales,
                    'ventasPorTipo' => $ventasPorTipo,
                    'ticketsPorOrigen' => $ticketsPorOrigen,
                    'estadoMesas' => [
                        'total' => $totalMesas,
                        'ocupadas' => $mesasOcupadas,
                        'libres' => $mesasLibres,
                    ],
                    'fechas' => [
                        'inicio' => $fechaInicio,
                        'fin' => $fechaFin,
                    ],
                ];
            });

            return Inertia::render('dinero/reportes', $data);

        } catch (\Exception $e) {
            Log::error('Error en Reportes: '.$e->getMessage());
            Log::error($e->getTraceAsString());

            return Inertia::render('dinero/reportes', [
                'resumen' => [
                    'ventasDia' => 0,
                    'ventasCambio' => 0,
                    'clientes' => 0,
                    'clientesNuevos' => 0,
                    'deliverys' => 0,
                    'deliverysEnRuta' => 0,
                    'gananciaNeta' => 0,
                    'gananciaCambio' => 0,
                    'ticketsHoy' => 0,
                    'mesasOcupadas' => 0,
                    'mesasLibres' => 0,
                    'totalMesas' => 0,
                    'totalCobradoHoy' => 0,
                    'cajaAbierta' => false,
                    'cajaEmpleado' => null,
                ],
                'ventasDiarias' => [],
                'ventasDelDiaDetalle' => [],
                'productosMasVendidos' => [],
                'metodosPago' => [],
                'totales' => [
                    'totalVentas' => 0,
                    'totalTickets' => 0,
                    'totalGastos' => 0,
                    'totalGanancia' => 0,
                    'ticketPromedio' => 0,
                    'margenGanancia' => 0,
                ],
                'ventasPorTipo' => [],
                'ticketsPorMesa' => [],
                'estadoMesas' => ['total' => 0, 'ocupadas' => 0, 'libres' => 0],
                'fechas' => ['inicio' => $fechaInicio, 'fin' => $fechaFin],
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getProductosMasVendidos()
    {
        // ✅ SOLO PEDIDOS PAGADOS
        $pedidos = Pedido::where('estado', 'pagado')->get();
        $productos = [];

        foreach ($pedidos as $pedido) {
            $items = is_string($pedido->productos) ? json_decode($pedido->productos, true) : $pedido->productos;
            if (is_array($items)) {
                foreach ($items as $item) {
                    $nombre = $item['nombre'] ?? 'Producto';
                    $cantidad = $item['cantidad'] ?? 1;
                    if (isset($productos[$nombre])) {
                        $productos[$nombre]['cantidad'] += $cantidad;
                    } else {
                        $productos[$nombre] = [
                            'nombre' => $nombre,
                            'cantidad' => $cantidad,
                            'icono' => $this->getIcono($nombre),
                        ];
                    }
                }
            }
        }

        usort($productos, function ($a, $b) {
            return $b['cantidad'] <=> $a['cantidad'];
        });

        return array_slice($productos, 0, 5);
    }

    private function getIcono($nombre)
    {
        $iconos = [
            'Café Americano' => '☕',
            'Café Latte' => '☕',
            'Cappuccino' => '☕',
            'Matcha Latte' => '🍵',
            'Croissant' => '🥐',
            'Cheesecake' => '🍰',
            'Sándwich' => '🥪',
            'Jugo' => '🧃',
        ];

        foreach ($iconos as $key => $icono) {
            if (strpos($nombre, $key) !== false) {
                return $icono;
            }
        }

        return '🍽️';
    }
}
