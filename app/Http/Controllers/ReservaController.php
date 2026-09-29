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
     * Ocupar el horario de una mesa con una nueva reserva. La mesa adopta el
     * estado "reserva" si la nueva reserva es la reserva activa de hoy.
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
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'personas' => 'required|integer|min:1',
            'notas' => 'nullable|string|max:255',
        ]);

        $margen = config('reservas.margen_minutos', 15);
        $inicio = Carbon::createFromFormat('H:i', $validated['hora_inicio'])
            ->subMinutes($margen)
            ->format('H:i:s');
        $fin = Carbon::createFromFormat('H:i', $validated['hora_fin'])
            ->addMinutes($margen)
            ->format('H:i:s');

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

        $reserva = Reserva::query()->create([
            'team_id' => auth()->user()->current_team_id,
            'mesa_id' => $mesa->id,
            'cliente' => $validated['cliente'],
            'telefono' => $validated['telefono'] ?? null,
            'fecha' => $validated['fecha'],
            'hora_inicio' => $validated['hora_inicio'],
            'hora_fin' => $validated['hora_fin'],
            'personas' => $validated['personas'],
            'notas' => $validated['notas'] ?? null,
            'estado' => Reserva::ESTADO_CONFIRMADA,
        ]);

        ReservaActualizada::dispatch($reserva->fresh());

        $this->reflejarActivaEnMesa($mesa, $reserva);

        return redirect()->back()->with(
            'success',
            "Reserva de {$validated['cliente']} a las {$validated['hora_inicio']} creada."
        );
    }

    /**
     * "Liberar reserva": NUNCA se borra. La reserva activa pasa a cancelada y
     * la mesa queda libre (o vuelve a "reserva" si hay otra próxima de hoy).
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

        $activa->update([
            'estado' => Reserva::ESTADO_CANCELADA,
            'fecha_cancelacion' => now(),
            'motivo_cancelacion' => trim($motivo),
            'cancelada_por' => auth()->id(),
        ]);

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
     * Refleja en la mesa la reserva activa del día (estado "reserva" + datos).
     */
    private function reflejarActivaEnMesa(Mesa $mesa, Reserva $reserva): void
    {
        // Solo las reservas de HOY afectan el estado operativo de la mesa.
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
