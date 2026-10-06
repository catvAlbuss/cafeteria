<?php

namespace App\Http\Controllers;

use App\Events\MesaActualizada;
use App\Events\ReservaActualizada;
use App\Models\Mesa;
use App\Models\Reserva;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReservaController extends Controller
{
    /**
     * Ocupar el horario de una mesa con una nueva reserva.
     */
    public function store(Request $request, Mesa $mesa): RedirectResponse
    {
        $this->autorizarGestion();

        if (! $mesa->activa) {
            return redirect()->back()->withErrors([
                'reserva' => 'La mesa está desactivada y no puede recibir reservas.',
            ]);
        }

        Reserva::expirarVencidas();

        $validated = $request->validate([
            'cliente' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:30',
            'fecha' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'nullable|date_format:H:i|after:hora_inicio',
            'tolerancia_minutos' => 'nullable|integer|min:5|max:120',
            'personas' => 'required|integer|min:1',
            'notas' => 'nullable|string|max:255',
            // Adelanto
            'adelanto_monto' => 'required|numeric|min:20',
            'adelanto_metodo_pago' => 'required|in:efectivo,tarjeta,yape',
        ], [
            'adelanto_monto.required' => 'El adelanto es obligatorio para confirmar la reserva.',
            'adelanto_monto.min' => 'El adelanto mínimo es de S/ 20.',
            'adelanto_metodo_pago.required' => 'Debes seleccionar el método de pago del adelanto.',
        ]);

        // Calcular tolerancia y hora límite
        $tolerancia = $validated['tolerancia_minutos'] ?? 20;
        $horaLimiteLlegada = Reserva::calcularHoraLimite($validated['hora_inicio'], $tolerancia);

        // Verificar conflictos de horario
        $margen = config('reservas.margen_minutos', 15);
        $inicio = Carbon::createFromFormat('H:i', $validated['hora_inicio'])
            ->subMinutes($margen)
            ->format('H:i:s');

        // Si hay hora_fin, usar ese; si no, usar la hora límite de llegada + margen
        if (! empty($validated['hora_fin'])) {
            $fin = Carbon::createFromFormat('H:i', $validated['hora_fin'])
                ->addMinutes($margen)
                ->format('H:i:s');
        } else {
            $fin = Carbon::createFromFormat('H:i', $horaLimiteLlegada)
                ->addMinutes($margen)
                ->format('H:i:s');
        }

        $conflictos = Reserva::query()
            ->where('mesa_id', $mesa->id)
            ->whereDate('fecha', $validated['fecha'])
            ->whereNotIn('estado', [Reserva::ESTADO_CANCELADA, Reserva::ESTADO_EXPIRADA])
            ->where(function ($q) use ($inicio, $fin) {
                $q->whereTime('hora_inicio', '<', $fin)
                    ->whereTime('hora_fin', '>', $inicio);
            })
            ->exists();

        if ($conflictos) {
            return redirect()->back()->withErrors([
                'reserva' => "La mesa ya tiene una reserva en ese horario (se respeta un margen de {$margen} min entre reservas).",
            ])->withInput();
        }

        // Verificar que hay caja abierta (para registrar el adelanto)
        $caja = \App\Models\Caja::query()
            ->where('team_id', auth()->user()->current_team_id)
            ->where('estado', 'Abierta')
            ->first();

        if (! $caja) {
            return redirect()->back()->withErrors([
                'reserva' => 'Debe haber una caja abierta para registrar el adelanto.',
            ])->withInput();
        }

        $reserva = Reserva::query()->create([
            'team_id' => auth()->user()->current_team_id,
            'mesa_id' => $mesa->id,
            'cliente' => $validated['cliente'],
            'telefono' => $validated['telefono'] ?? null,
            'fecha' => $validated['fecha'],
            'hora_inicio' => $validated['hora_inicio'],
            'hora_fin' => $validated['hora_fin'] ?? null,
            'tolerancia_minutos' => $tolerancia,
            'hora_limite_llegada' => $horaLimiteLlegada,
            'personas' => $validated['personas'],
            'notas' => $validated['notas'] ?? null,
            'estado' => Reserva::ESTADO_CONFIRMADA,
            // Adelanto
            'adelanto_monto' => $validated['adelanto_monto'],
            'adelanto_metodo_pago' => $validated['adelanto_metodo_pago'],
            'adelanto_caja_id' => $caja->id,
            'adelanto_pagado_at' => now(),
            'adelanto_estado' => Reserva::ADELANTO_PAGADO,
        ]);

        ReservaActualizada::dispatch($reserva->fresh());

        $this->reflejarActivaEnMesa($mesa, $reserva);

        $mensaje = "Reserva de {$validated['cliente']} a las {$validated['hora_inicio']} creada";
        $mensaje .= " (Adelanto: S/ " . number_format($validated['adelanto_monto'], 2) . ")";

        return redirect()->back()->with('success', $mensaje);
    }

    /**
     * "Liberar reserva": la reserva activa pasa a cancelada y el adelanto
     * queda como perdido (no se devuelve).
     */
    public function cancelar(Request $request, Mesa $mesa): RedirectResponse
    {
        $this->autorizarGestion();

        $activa = Reserva::activaDeMesa($mesa->id);

        if (! $activa) {
            return redirect()->back()->withErrors([
                'reserva' => 'Esta mesa no tiene una reserva activa para liberar.',
            ]);
        }

        $motivo = $request->input('motivo') ?: 'Liberación manual';

        $updateData = [
            'estado' => Reserva::ESTADO_CANCELADA,
            'fecha_cancelacion' => now(),
            'motivo_cancelacion' => trim($motivo),
            'cancelada_por' => auth()->id(),
        ];

        // Si tenía adelanto pagado, se marca como perdido
        if ($activa->adelanto_estado === Reserva::ADELANTO_PAGADO) {
            $updateData['adelanto_estado'] = Reserva::ADELANTO_PERDIDO;
        }

        $activa->update($updateData);

        ReservaActualizada::dispatch($activa->fresh());

        $siguienteActiva = Reserva::activaDeMesa($mesa->id);

        if ($siguienteActiva) {
            $mesa->update([
                'cliente' => $siguienteActiva->cliente,
                'personas' => $siguienteActiva->personas,
            ]);
        } else {
            $mesa->update([
                'estado' => 'libre',
                'cliente' => null,
                'personas' => null,
            ]);

            MesaActualizada::dispatch($mesa->fresh());
        }

        return redirect()->back()->with(
            'success',
            "Reserva de {$activa->cliente} cancelada ({$activa->motivo_cancelacion})."
        );
    }

    /**
     * Refleja en la mesa la reserva activa del día.
     */
    private function reflejarActivaEnMesa(Mesa $mesa, Reserva $reserva): void
    {
        if ($reserva->fecha !== now()->toDateString()) {
            return;
        }

        $activa = Reserva::activaDeMesa($mesa->id);

        if (! $activa || $activa->id !== $reserva->id) {
            return;
        }

        $estadoAnterior = $mesa->estado;

        $mesa->update([
            'estado' => $mesa->estado === 'libre' ? 'reserva' : $mesa->estado,
            'cliente' => $activa->cliente,
            'personas' => $activa->personas,
        ]);

        if ($mesa->estado !== $estadoAnterior) {
            MesaActualizada::dispatch($mesa->fresh());
        }
    }

    private function autorizarGestion(): void
    {
        $usuario = auth()->user();

        $puede = $usuario?->can('gestionar mesas')
            || $usuario?->roles->pluck('name')->intersect([
                'Administración',
                'Gerencia',
                'Caja',
                'Administrador',
                'Gerente',
                'Cajero',
            ])->isNotEmpty();

        abort_unless($puede, 403);
    }
}