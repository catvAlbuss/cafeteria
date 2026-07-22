<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\TeamInvitation;
use App\Services\ProductionSummary;
use App\Services\WaiterSummary;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ProductionSummary $productionSummary, WaiterSummary $waiterSummary): Response
    {
        $user = $request->user();
        $email = strtolower($user->email);
        $periodo = $request->get('periodo', 'hoy');

        // ============================================================
        // INVITACIONES PENDIENTES (ya existente)
        // ============================================================
        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => [
                    'name' => $invitation->team->name,
                    'slug' => $invitation->team->slug,
                ],
            ]);

        // ============================================================
        // PRODUCCIÓN (ya existente)
        // ============================================================
        $productionArea = match (true) {
            $user->hasRole('Bar') => 'bar',
            $user->hasRole('Cocinero') => 'cocina',
            default => null,
        };

        $productionAreas = $productionArea === 'bar'
            ? ['bar']
            : ['cocina', 'horno', 'postres'];

        // ============================================================
        // CAJA (ya existente)
        // ============================================================
        $cashierSummary = $user->hasRole('Cajero') ? [
            'salesToday' => (float) Pedido::query()
                ->whereHas('caja', fn ($query) => $query->where('estado', 'Abierta'))
                ->where('estado', 'pagado')
                ->sum('total'),
            'transactionsToday' => Pedido::query()
                ->whereHas('caja', fn ($query) => $query->where('estado', 'Abierta'))
                ->where('estado', 'pagado')
                ->count(),
            'readyToCharge' => Pedido::query()
                ->where('estado', 'listo')
                ->count(),
            'activeTables' => Mesa::query()
                ->whereIn('estado', ['ocupada', 'listo_cobrar'])
                ->count(),
            'openRegister' => Caja::query()
                ->where('estado', 'Abierta')
                ->first(['id', 'caja', 'turno', 'monto_inicial', 'fecha_apertura']),
        ] : null;

        // ============================================================
        // MOZO (ya existente)
        // ============================================================
        $waiterSummaryData = $user->hasRole('Mesero')
            ? $waiterSummary->forUser((int) $user->current_team_id, (int) $user->id)
            : null;

        // ============================================================
        // DATOS GENERALES DEL DASHBOARD (NUEVO)
        // ============================================================
        $fechas = $this->getFechasPeriodo($periodo);

        // Ventas del período
        $ventasQuery = Pedido::where('estado', 'pagado')
            ->whereBetween('created_at', [$fechas['inicio'], $fechas['fin']]);

        $totalVentas = $ventasQuery->sum('total');
        $totalPedidos = $ventasQuery->count();
        $ticketPromedio = $totalPedidos > 0 ? $totalVentas / $totalPedidos : 0;

        // Ventas por día (gráfico)
        $ventasPorDia = Pedido::where('estado', 'pagado')
            ->whereBetween('created_at', [$fechas['inicio'], $fechas['fin']])
            ->select(DB::raw('DATE(created_at) as fecha'), DB::raw('SUM(total) as total'))
            ->groupBy('fecha')
            ->orderBy('fecha')
            ->get()
            ->map(fn ($item) => [
                'fecha' => Carbon::parse($item->fecha)->format('d/m'),
                'total' => (float) $item->total,
            ]);

        // Top productos
        $topProductos = Pedido::where('estado', 'pagado')
            ->whereBetween('created_at', [$fechas['inicio'], $fechas['fin']])
            ->get()
            ->flatMap(fn ($pedido) => is_array($pedido->productos) ? $pedido->productos : json_decode($pedido->productos, true) ?? [])
            ->groupBy('nombre')
            ->map(fn ($items) => [
                'nombre' => $items->first()['nombre'] ?? 'Producto',
                'cantidad' => $items->sum('cantidad'),
                'total' => $items->sum('subtotal'),
            ])
            ->sortByDesc('total')
            ->take(5)
            ->values();

        // Distribución por categoría
        $distribucionCategorias = Pedido::where('estado', 'pagado')
            ->whereBetween('created_at', [$fechas['inicio'], $fechas['fin']])
            ->get()
            ->flatMap(fn ($pedido) => is_array($pedido->productos) ? $pedido->productos : json_decode($pedido->productos, true) ?? [])
            ->groupBy('categoria')
            ->map(fn ($items) => [
                'name' => $items->first()['categoria'] ?? 'Otros',
                'value' => $items->sum('subtotal'),
            ])
            ->sortByDesc('value')
            ->take(4)
            ->values();

        // Estado de mesas
        $mesasOcupadas = Mesa::where('estado', 'ocupada')->count();
        $mesasTotal = Mesa::count();

        // Variación con período anterior
        $fechasAnterior = $this->getFechasPeriodoAnterior($periodo);
        $ventasAnterior = Pedido::where('estado', 'pagado')
            ->whereBetween('created_at', [$fechasAnterior['inicio'], $fechasAnterior['fin']])
            ->sum('total');

        $variacion = $ventasAnterior > 0
            ? (($totalVentas - $ventasAnterior) / $ventasAnterior) * 100
            : 0;

        // ============================================================
        // RENDER FINAL
        // ============================================================
        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'productionArea' => $productionArea,
            'productionSummary' => $productionArea
                ? $productionSummary->forTeamAndAreas((int) $user->current_team_id, $productionAreas)
                : null,
            'cashierSummary' => $cashierSummary,
            'waiterSummary' => $waiterSummaryData,
            'resumen' => [
                'ventas' => (float) $totalVentas,
                'ventasCambio' => round($variacion, 1),
                'pedidos' => $totalPedidos,
                'pedidosCambio' => 0,
                'ticketPromedio' => (float) $ticketPromedio,
                'ticketCambio' => 0,
                'mesasActivas' => $mesasOcupadas,
                'mesasTotal' => $mesasTotal,
                'ventasPorDia' => $ventasPorDia,
                'topProductos' => $topProductos,
                'distribucionCategorias' => $distribucionCategorias,
                'periodo' => $periodo,
            ],
        ]);
    }

    // ============================================================
    // FUNCIONES AUXILIARES
    // ============================================================

    private function getFechasPeriodo(string $periodo): array
    {
        $now = Carbon::now();

        switch ($periodo) {
            case 'hoy':
                return ['inicio' => $now->copy()->startOfDay(), 'fin' => $now->copy()->endOfDay()];
            case 'semana':
                return ['inicio' => $now->copy()->startOfWeek(), 'fin' => $now->copy()->endOfWeek()];
            case 'mes':
                return ['inicio' => $now->copy()->startOfMonth(), 'fin' => $now->copy()->endOfMonth()];
            case 'año':
                return ['inicio' => $now->copy()->startOfYear(), 'fin' => $now->copy()->endOfYear()];
            default:
                return ['inicio' => $now->copy()->startOfDay(), 'fin' => $now->copy()->endOfDay()];
        }
    }

    private function getFechasPeriodoAnterior(string $periodo): array
    {
        $now = Carbon::now();

        switch ($periodo) {
            case 'hoy':
                return ['inicio' => $now->copy()->subDay()->startOfDay(), 'fin' => $now->copy()->subDay()->endOfDay()];
            case 'semana':
                return ['inicio' => $now->copy()->subWeek()->startOfWeek(), 'fin' => $now->copy()->subWeek()->endOfWeek()];
            case 'mes':
                return ['inicio' => $now->copy()->subMonth()->startOfMonth(), 'fin' => $now->copy()->subMonth()->endOfMonth()];
            case 'año':
                return ['inicio' => $now->copy()->subYear()->startOfYear(), 'fin' => $now->copy()->subYear()->endOfYear()];
            default:
                return ['inicio' => $now->copy()->subDay()->startOfDay(), 'fin' => $now->copy()->subDay()->endOfDay()];
        }
    }
}
