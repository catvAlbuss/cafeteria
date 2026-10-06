<?php

namespace App\Http\Controllers;

use App\Events\CajaActualizada;
use App\Exports\ContadorExport;
use App\Exports\HistorialSheetExport;
use App\Exports\IngresosSheetExport;
use App\Exports\MovimientosSheetExport;
use App\Models\Caja;
use App\Models\Reserva;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ContadorController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage-cash-session');

        $cajaActual = Caja::query()->with(['empleadoUser', 'movimientos.user'])
            ->where('estado', 'Abierta')->first();
        $ultimaCaja = Caja::query()->where('estado', 'Cerrada')->latest('fecha_cierre')->first();
        $cajas = Caja::query()->with('empleadoUser')->latest()->get();
        $resumenCaja = $cajaActual ? $this->resumen($cajaActual) : $this->resumenVacio();

        return Inertia::render('dinero/contador', [
            'cajas' => $cajas,
            'cajaActual' => $cajaActual,
            'ultimaCaja' => $ultimaCaja?->only(['id', 'monto_final', 'fecha_cierre']),
            'puedeAbrir' => true,
            'resumen' => [
                'ingresos' => $resumenCaja['ventas_totales'],
                'cajaActual' => $resumenCaja['efectivo_esperado'],
                'ventas_efectivo' => $resumenCaja['ventas_efectivo'],
                'ventas_tarjeta' => $resumenCaja['ventas_tarjeta'],
                'ventas_yape' => $resumenCaja['ventas_yape'],
                ...$resumenCaja,
            ],
            'movimientos' => $cajaActual?->movimientos->map(fn ($movimiento) => [
                'id' => $movimiento->id,
                'tipo' => $movimiento->tipo,
                'descripcion' => $movimiento->concepto,
                'monto' => (float) $movimiento->monto,
                'cliente' => $movimiento->user?->name,
                'hora' => $movimiento->created_at->format('h:i A'),
            ])->values() ?? [],
            'ingresosDetalle' => [
                ['concepto' => 'Efectivo', 'monto' => $resumenCaja['ventas_efectivo']],
                ['concepto' => 'Tarjeta', 'monto' => $resumenCaja['ventas_tarjeta']],
                ['concepto' => 'Yape', 'monto' => $resumenCaja['ventas_yape']],
            ],
            'estadisticas' => [
                'totalPedidosHoy' => $cajaActual?->pedidos()->where('estado', '!=', 'cancelado')->count() ?? 0,
                'totalCajasAbiertas' => $cajaActual ? 1 : 0,
                'totalCajasCerradas' => Caja::query()->where('estado', 'Cerrada')->count(),
            ],
        ]);
    }

    public function abrir(Request $request): RedirectResponse
    {
        Gate::authorize('manage-cash-session');

        $validated = $request->validate([
            'caja' => ['required', 'string', 'max:50'],
            'turno' => ['required', 'in:Todo el día,Mañana,Tarde,Noche'],
            'montoInicial' => ['required', 'numeric', 'min:0'],
            'justificacionApertura' => ['nullable', 'string', 'max:1000'],
        ]);

        $caja = DB::transaction(function () use ($request, $validated) {
            $teamId = (int) $request->user()->current_team_id;
            Team::query()->whereKey($teamId)->lockForUpdate()->firstOrFail();
            $abierta = Caja::withoutGlobalScopes()->where('team_id', $teamId)
                ->where('estado', 'Abierta')->lockForUpdate()->first();

            if ($abierta) {
                throw ValidationException::withMessages(['caja' => 'La sede ya tiene una jornada abierta.']);
            }

            $ultima = Caja::withoutGlobalScopes()->where('team_id', $teamId)
                ->where('estado', 'Cerrada')->latest('fecha_cierre')->lockForUpdate()->first();
            $monto = round((float) $validated['montoInicial'], 2);
            $heredado = $ultima?->monto_final !== null && round((float) $ultima->monto_final, 2) === $monto;

            if ($ultima && ! $heredado && blank($validated['justificacionApertura'] ?? null)) {
                throw ValidationException::withMessages([
                    'justificacionApertura' => 'Explique por qué el monto inicial difiere del último cierre.',
                ]);
            }

            return Caja::query()->create([
                'team_id' => $teamId,
                'caja' => $validated['caja'],
                'user_id' => $request->user()->id,
                'turno' => $validated['turno'],
                'monto_inicial' => $monto,
                'origen_fondo' => $heredado ? 'heredado' : 'manual',
                'justificacion_apertura' => $validated['justificacionApertura'] ?? null,
                'fecha_apertura' => now(),
                'estado' => 'Abierta',
            ]);
        });

        broadcast(new CajaActualizada($caja));

        return to_route('contador.index')->with('success', 'Jornada abierta. La sede ya puede operar.');
    }

    public function cerrar(Request $request, int $id): RedirectResponse
    {
        Gate::authorize('manage-cash-session');

        $validated = $request->validate([
            'montoFinal' => ['required', 'numeric', 'min:0'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);

        $caja = DB::transaction(function () use ($request, $validated, $id) {
            $caja = Caja::query()->whereKey($id)->lockForUpdate()->firstOrFail();

            if ($caja->estado === 'Cerrada') {
                throw ValidationException::withMessages(['caja' => 'Esta jornada ya está cerrada.']);
            }

            $resumen = $this->resumen($caja);
            $contado = round((float) $validated['montoFinal'], 2);
            $diferencia = round($contado - $resumen['efectivo_esperado'], 2);

            if ($diferencia !== 0.0 && blank($validated['observaciones'] ?? null)) {
                throw ValidationException::withMessages([
                    'observaciones' => 'Debe explicar el sobrante o faltante de caja.',
                ]);
            }

            $caja->update([
                'closed_by' => $request->user()->id,
                'monto_final' => $contado,
                'efectivo_esperado' => $resumen['efectivo_esperado'],
                'diferencia_cierre' => $diferencia,
                'ventas_dia' => $resumen['ventas_totales'],
                'observaciones' => $validated['observaciones'] ?? null,
                'fecha_cierre' => now(),
                'estado' => 'Cerrada',
                'total_ventas_caja' => $resumen['ventas_totales'],
                'resumen_cierre' => $resumen,
            ]);

            return $caja;
        });

        broadcast(new CajaActualizada($caja));

        $mensaje = 'Jornada cerrada y arqueo registrado.';
        $sinResolver = (float) ($caja->resumen_cierre['adelantos_sin_resolver'] ?? 0);

        if ($sinResolver > 0) {
            $mensaje .= ' Quedan S/'.number_format($sinResolver, 2)
                .' en adelantos retenidos o de reservas canceladas sin resolver: devuélvelos o aplícalos a la cuenta del cliente.';
        }

        return back()->with('success', $mensaje);
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->hasRole('Gerente'), 403);
        $caja = Caja::query()->findOrFail($id);
        abort_if($caja->estado === 'Abierta', 422, 'No se puede eliminar una jornada abierta.');
        $caja->delete();

        return back()->with('success', 'Registro eliminado correctamente.');
    }

    /**
     * Exportar reporte de contador
     */
    public function export(Request $request)
    {
        Gate::authorize('manage-cash-session');

        $teamId = (int) $request->user()->current_team_id;

        // Obtener datos según filtros
        $query = Caja::query()->with('empleadoUser')
            ->where('team_id', $teamId);

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->fecha_inicio) {
            $query->whereDate('fecha_apertura', '>=', $request->fecha_inicio);
        }

        if ($request->fecha_fin) {
            $query->whereDate('fecha_apertura', '<=', $request->fecha_fin);
        }

        if ($request->empleado) {
            $query->whereHas('empleadoUser', function ($q) use ($request) {
                $q->where('name', 'LIKE', '%'.$request->empleado.'%');
            });
        }

        // Obtener caja actual para movimientos
        $cajaActual = Caja::query()->with('movimientos.user')
            ->where('team_id', $teamId)
            ->where('estado', 'Abierta')
            ->first();

        // Preparar datos de ingresos
        $ingresos = collect([
            ['concepto' => 'Ventas Efectivo', 'monto' => (float) ($request->ingresos_efectivo ?? 0)],
            ['concepto' => 'Ventas Tarjeta', 'monto' => (float) ($request->ingresos_tarjeta ?? 0)],
            ['concepto' => 'Ventas Yape', 'monto' => (float) ($request->ingresos_yape ?? 0)],
            ['concepto' => 'Total Ingresos', 'monto' => (float) ($request->ingresos_total ?? 0)],
        ]);

        $historial = $query->get();
        $movimientos = $cajaActual?->movimientos->map(fn ($movimiento) => (object) [
            'id' => $movimiento->id,
            'tipo' => $movimiento->tipo,
            'descripcion' => $movimiento->concepto,
            'monto' => (float) $movimiento->monto,
            'cliente' => $movimiento->user?->name,
            'hora' => $movimiento->created_at->format('h:i A'),
        ])->values() ?? collect();

        // Exportar hoja específica si se solicita
        if ($request->hoja === 'ingresos') {
            return Excel::download(new IngresosSheetExport($ingresos), 'ingresos_dia_'.now()->format('Y-m-d').'.xlsx');
        }

        if ($request->hoja === 'historial') {
            return Excel::download(new HistorialSheetExport($historial), 'historial_caja_'.now()->format('Y-m-d').'.xlsx');
        }

        if ($request->hoja === 'movimientos') {
            return Excel::download(new MovimientosSheetExport($movimientos), 'movimientos_'.now()->format('Y-m-d').'.xlsx');
        }

        // Exportar todo
        return Excel::download(
            new ContadorExport($ingresos, $historial, $movimientos),
            'reporte_contador_'.now()->format('Y-m-d').'.xlsx'
        );
    }

    /** @return array<string, float> */
    private function resumen(Caja $caja): array
    {
        $ventas = $caja->pedidos()->where('estado', '!=', 'cancelado')
            ->selectRaw('COALESCE(SUM(total), 0) as total')
            ->selectRaw("COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as efectivo")
            ->selectRaw("COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as tarjeta")
            ->selectRaw("COALESCE(SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END), 0) as yape")
            ->first();
        $movimientos = $caja->movimientos()->selectRaw("COALESCE(SUM(CASE WHEN tipo IN ('ingreso', 'aporte') THEN monto ELSE 0 END), 0) as entradas")
            ->selectRaw("COALESCE(SUM(CASE WHEN tipo IN ('egreso', 'retiro') THEN monto ELSE 0 END), 0) as salidas")
            // El efectivo esperado solo suma los movimientos que tocan la
            // caja física: un adelanto cobrado en Yape no está en el cajón.
            // metodo_pago null = fila antigua = efectivo.
            ->selectRaw("COALESCE(SUM(CASE WHEN tipo IN ('ingreso', 'aporte') AND (metodo_pago IS NULL OR metodo_pago = 'efectivo') THEN monto ELSE 0 END), 0) as entradas_efectivo")
            ->selectRaw("COALESCE(SUM(CASE WHEN tipo IN ('egreso', 'retiro') AND (metodo_pago IS NULL OR metodo_pago = 'efectivo') THEN monto ELSE 0 END), 0) as salidas_efectivo")
            ->first();

        // El adelanto de una reserva es dinero temporal: entra al cajón y sale
        // al aplicarse o devolverse, sin registrar movimiento alguno. Se
        // contabiliza aquí, en una línea propia que nace y muere con ese
        // estado, y solo mientras el dinero siga en LA caja que lo cobró: al
        // cerrar la jornada el saldo viaja heredado en el monto inicial de la
        // siguiente.
        $adelantos = Reserva::query()
            ->where('adelanto_caja_id', $caja->id)
            ->whereIn('adelanto_estado', [Reserva::ADELANTO_PAGADO, Reserva::ADELANTO_RETENIDO])
            ->where('adelanto_pagado', '>', 0)
            ->selectRaw('COALESCE(SUM(adelanto_pagado), 0) as total')
            // Un adelanto en Yape no está en el cajón, igual que las ventas.
            ->selectRaw("COALESCE(SUM(CASE WHEN adelanto_metodo_pago IS NULL OR adelanto_metodo_pago = 'efectivo' THEN adelanto_pagado ELSE 0 END), 0) as efectivo")
            ->first();

        // Dinero de la línea que ya no tiene una cuenta que lo consumirá:
        // reservas que no llegaron (retenido) o canceladas sin devolver.
        // Al cerrar conviene avisar para que el cajero lo resuelva.
        $sinResolver = Reserva::query()
            ->where('adelanto_caja_id', $caja->id)
            ->where('adelanto_pagado', '>', 0)
            ->where(function ($q) {
                $q->where('adelanto_estado', Reserva::ADELANTO_RETENIDO)
                    ->orWhere(function ($q2) {
                        $q2->where('adelanto_estado', Reserva::ADELANTO_PAGADO)
                            ->whereIn('estado', [Reserva::ESTADO_CANCELADA, Reserva::ESTADO_NO_PRESENTADO]);
                    });
            })
            ->selectRaw('COALESCE(SUM(adelanto_pagado), 0) as total')
            ->first();

        $efectivo = (float) $ventas->efectivo;
        $entradas = (float) $movimientos->entradas;
        $salidas = (float) $movimientos->salidas;
        $entradasEfectivo = (float) $movimientos->entradas_efectivo;
        $salidasEfectivo = (float) $movimientos->salidas_efectivo;
        $adelantosEfectivo = (float) $adelantos->efectivo;

        return [
            'fondo_inicial' => (float) $caja->monto_inicial,
            'ventas_totales' => (float) $ventas->total,
            'ventas_efectivo' => $efectivo,
            'ventas_tarjeta' => (float) $ventas->tarjeta,
            'ventas_yape' => (float) $ventas->yape,
            'ingresos_aportes' => $entradas,
            'gastos_retiros' => $salidas,
            'ingresos_aportes_efectivo' => $entradasEfectivo,
            'gastos_retiros_efectivo' => $salidasEfectivo,
            'adelantos_en_caja' => (float) $adelantos->total,
            'adelantos_en_caja_efectivo' => $adelantosEfectivo,
            'adelantos_sin_resolver' => (float) $sinResolver->total,
            'efectivo_esperado' => round((float) $caja->monto_inicial + $efectivo + $entradasEfectivo - $salidasEfectivo + $adelantosEfectivo, 2),
        ];
    }

    /** @return array<string, float> */
    private function resumenVacio(): array
    {
        return array_fill_keys([
            'fondo_inicial', 'ventas_totales', 'ventas_efectivo', 'ventas_tarjeta',
            'ventas_yape', 'ingresos_aportes', 'gastos_retiros',
            'ingresos_aportes_efectivo', 'gastos_retiros_efectivo',
            'adelantos_en_caja', 'adelantos_en_caja_efectivo',
            'adelantos_sin_resolver',
            'efectivo_esperado',
        ], 0.0);
    }
}
