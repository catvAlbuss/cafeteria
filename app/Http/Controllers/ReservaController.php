<?php

namespace App\Http\Controllers;

use App\Events\CajaActualizada;
use App\Events\MesaActualizada;
use App\Events\ReservaActualizada;
use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Reserva;
use App\Services\ReservaService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $minimo = (float) config('reservas.adelanto_minimo', 20);

        $validated = $request->validate([
            'cliente' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:30',
            'fecha' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'personas' => 'required|integer|min:1',
            'notas' => 'nullable|string|max:255',
            // Toda reserva deja un adelanto en caja; no existe la reserva "gratis".
            'adelanto' => "required|numeric|min:{$minimo}|max:9999",
            'adelanto_metodo_pago' => 'nullable|in:efectivo,tarjeta,yape',
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
            ->whereNotIn('estado', [Reserva::ESTADO_CANCELADA, Reserva::ESTADO_NO_PRESENTADO])
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

        $metodo = $validated['adelanto_metodo_pago'] ?? 'efectivo';

        // La reserva y su dinero van juntos: sin caja abierta no se reserva.
        // El adelanto no deja movimiento de caja —es temporal y puede
        // devolverse—, se contabiliza en la línea de adelantos del arqueo.
        $reserva = DB::transaction(function () use ($validated, $mesa, $metodo) {
            $caja = Caja::query()
                ->where('team_id', auth()->user()->current_team_id)
                ->where('estado', 'Abierta')
                ->lockForUpdate()
                ->firstOrFail();

            return Reserva::query()->create([
                'team_id' => auth()->user()->current_team_id,
                'mesa_id' => $mesa->id,
                'cliente' => $validated['cliente'],
                'telefono' => $validated['telefono'] ?? null,
                'fecha' => $validated['fecha'],
                'hora_inicio' => $validated['hora_inicio'],
                'hora_fin' => $validated['hora_fin'],
                'personas' => $validated['personas'],
                'adelanto_pagado' => $validated['adelanto'],
                'adelanto_metodo_pago' => $metodo,
                'adelanto_pagado_at' => now(),
                'adelanto_caja_id' => $caja->id,
                'adelanto_pagado_por' => auth()->id(),
                'adelanto_estado' => Reserva::ADELANTO_PAGADO,
                'notas' => $validated['notas'] ?? null,
                'estado' => Reserva::ESTADO_CONFIRMADA,
            ]);
        });

        ReservaActualizada::dispatch($reserva->fresh());

        if (ReservaService::aplicarReservaActiva($mesa)) {
            MesaActualizada::dispatch($mesa->fresh());
        }

        return redirect()->back()->with(
            'success',
            "Reserva de {$validated['cliente']} a las {$validated['hora_inicio']} creada. "
            .'Adelanto S/ '.number_format((float) $validated['adelanto'], 2).' en caja.'
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

        // Al liberarse, la mesa vuelve a mirar sus reservas: si hay otra en
        // ventana se queda pintada con ese cliente, y si no queda libre.
        if (ReservaService::aplicarReservaActiva($mesa)) {
            MesaActualizada::dispatch($mesa->fresh());
        }

        return redirect()->back()->with(
            'success',
            "Reserva de {$activa->cliente} cancelada ({$activa->motivo_cancelacion})."
        );
    }

    /**
     * Devolver el adelanto que todavía está en caja (pagado sin aplicar o
     * retenido de una reserva no presentada) y la reserva queda como
     * "devuelto". El dinero sale de la línea de adelantos del arqueo; solo
     * si fue cobrado en otra jornada se registra además un egreso.
     *
     * El dinero solo sale de caja con "autorizar cancelaciones": el cajero
     * ve y aplica, pero devolver es de Supervisor para arriba.
     */
    public function devolver(Request $request, Reserva $reserva): RedirectResponse
    {
        if (! in_array($reserva->adelanto_estado, [Reserva::ADELANTO_PAGADO, Reserva::ADELANTO_RETENIDO], true)) {
            return redirect()->back()->withErrors([
                'reserva' => 'El adelanto de esta reserva ya no está en caja.',
            ]);
        }

        if ((float) $reserva->adelanto_pagado <= 0) {
            return redirect()->back()->withErrors([
                'reserva' => 'Esta reserva no tiene adelanto que devolver.',
            ]);
        }

        $caja = DB::transaction(function () use ($request, $reserva) {
            $caja = Caja::query()
                ->where('team_id', auth()->user()->current_team_id)
                ->where('estado', 'Abierta')
                ->lockForUpdate()
                ->firstOrFail();

            ReservaService::devolverAdelanto($reserva, $caja, $request->user());

            return $caja;
        });

        ReservaActualizada::dispatch($reserva->fresh());
        broadcast(new CajaActualizada($caja->fresh()));

        return redirect()->back()->with(
            'success',
            'Devolución de S/ '.number_format((float) $reserva->adelanto_pagado, 2)
            ." a {$reserva->cliente} registrada en caja."
        );
    }

    /**
     * El cliente llegó y caja lo confirma (es caja quien recibe la reserva,
     * no tiene sentido ir mesa por mesa buscando el nombre): la reserva pasa
     * a atendida con su hora y la mesa queda ocupada con los datos del
     * cliente, opcionalmente asignada a un mesero para abrir el pedido.
     *
     * No se mueve dinero: el adelanto sigue esperando a que se cobre o a que
     * caja lo devuelva.
     */
    public function llegada(Request $request, Reserva $reserva): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $pendiente = $this->comprobarPendienteDeLlegada($reserva);

        if ($pendiente !== null) {
            return redirect()->back()->withErrors(['reserva' => $pendiente]);
        }

        $mesa = $reserva->mesa;

        if (! $mesa->activa) {
            return redirect()->back()->withErrors([
                'reserva' => "La mesa #{$mesa->numero} de esta reserva está desactivada.",
            ]);
        }

        $ocupada = ! in_array($mesa->estado, ['libre', 'reserva'], true)
            || $mesa->pedidos()->whereNotIn('estado', ['pagado', 'cancelado'])->exists();

        if ($ocupada) {
            return redirect()->back()->withErrors([
                'reserva' => "La mesa #{$mesa->numero} ya está ocupada: no se puede sentar a {$reserva->cliente}.",
            ]);
        }

        if (! empty($validated['user_id'])
            && ! auth()->user()->currentTeam->members()->where('users.id', $validated['user_id'])->exists()) {
            return redirect()->back()->withErrors(['user_id' => 'El mesero no pertenece a esta sede.']);
        }

        DB::transaction(function () use ($reserva, $mesa, $validated) {
            $mesa->update([
                'estado' => 'ocupada',
                'cliente' => $reserva->cliente,
                'personas' => $reserva->personas,
                'user_id' => $validated['user_id'] ?? null,
            ]);

            $reserva->update([
                'estado' => Reserva::ESTADO_ATENDIDA,
                'hora_llegada' => now()->format('H:i'),
            ]);
        });

        ReservaActualizada::dispatch($reserva->fresh());
        broadcast(new MesaActualizada($mesa->fresh()));

        return redirect()->back()->with(
            'success',
            "{$reserva->cliente} llegó a la mesa #{$mesa->numero}."
        );
    }

    /**
     * Adelantar el "no presentado" que el programador de reservas marca solo
     * pasada la tolerancia: la reserva sale de la cola de por llegar y su
     * adelanto queda retenido en caja hasta que alguien decida devolverlo.
     */
    public function noLlego(Reserva $reserva): RedirectResponse
    {
        $pendiente = $this->comprobarPendienteDeLlegada($reserva);

        if ($pendiente !== null) {
            return redirect()->back()->withErrors(['reserva' => $pendiente]);
        }

        $reserva->update(['estado' => Reserva::ESTADO_NO_PRESENTADO]);

        if ((float) $reserva->adelanto_pagado > 0
            && $reserva->adelanto_estado === Reserva::ADELANTO_PAGADO) {
            $reserva->update(['adelanto_estado' => Reserva::ADELANTO_RETENIDO]);
        }

        ReservaActualizada::dispatch($reserva->fresh());

        $mesa = $reserva->mesa;

        if (ReservaService::aplicarReservaActiva($mesa)) {
            broadcast(new MesaActualizada($mesa->fresh()));
        }

        return redirect()->back()->with(
            'success',
            "{$reserva->cliente} no llegó. El adelanto queda en caja por si vuelve a reclamar."
        );
    }

    /**
     * Solo una reserva de hoy todavía confirmada puede marcar llegada o
     * ausencia; devuelve el mensaje de error o null si se puede actuar.
     */
    private function comprobarPendienteDeLlegada(Reserva $reserva): ?string
    {
        if ($reserva->estado !== Reserva::ESTADO_CONFIRMADA) {
            return "La reserva de {$reserva->cliente} ya no está esperando la llegada del cliente.";
        }

        if ($reserva->fecha > now()->toDateString()) {
            return "La reserva de {$reserva->cliente} es para el {$reserva->fecha}.";
        }

        return null;
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
