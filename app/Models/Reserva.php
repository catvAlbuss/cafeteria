<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class Reserva extends Model
{
    use BelongsToTeam;

    public const ESTADO_CONFIRMADA = 'confirmada';

    public const ESTADO_ATENDIDA = 'atendida';

    public const ESTADO_CANCELADA = 'cancelada';

    public const ESTADO_EXPIRADA = 'expirada';

    // Estados del adelanto
    public const ADELANTO_PENDIENTE = 'pendiente';

    public const ADELANTO_PAGADO = 'pagado';

    public const ADELANTO_APLICADO = 'aplicado';

    public const ADELANTO_PERDIDO = 'perdido';

    protected $fillable = [
        'team_id',
        'mesa_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'tolerancia_minutos',
        'hora_limite_llegada',
        'cliente',
        'telefono',
        'personas',
        'notas',
        'estado',
        'fecha_cancelacion',
        'motivo_cancelacion',
        'cancelada_por',
        'hora_llegada',
        // Adelanto
        'adelanto_monto',
        'adelanto_metodo_pago',
        'adelanto_caja_id',
        'adelanto_pagado_at',
        'adelanto_estado',
        'adelanto_aplicado_at',
    ];

    protected $casts = [
        'adelanto_monto' => 'decimal:2',
        'adelanto_pagado_at' => 'datetime',
        'adelanto_aplicado_at' => 'datetime',
        'tolerancia_minutos' => 'integer',
    ];

    public function mesa(): BelongsTo
    {
        return $this->belongsTo(Mesa::class);
    }

    public function cancelador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelada_por');
    }

    public function cajaAdelanto(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'adelanto_caja_id');
    }

    /**
     * Marcar como expiradas todas las reservas confirmadas cuya hora límite
     * de llegada ya pasó (el cliente nunca llegó).
     *
     * Si la reserva tenía un adelanto pagado, se marca como "perdido".
     */
    public static function expirarVencidas(): int
    {
        $ahora = now();

        $vencidas = static::query()
            ->where('estado', self::ESTADO_CONFIRMADA)
            ->where(function ($q) use ($ahora) {
                $q->whereDate('fecha', '<', $ahora->toDateString())
                    ->orWhere(function ($q2) use ($ahora) {
                        $q2->whereDate('fecha', '=', $ahora->toDateString())
                            ->whereTime('hora_limite_llegada', '<=', $ahora->format('H:i:s'));
                    });
            })
            ->get();

        foreach ($vencidas as $reserva) {
            // Si tiene adelanto pagado, se marca como perdido
            $updateData = ['estado' => self::ESTADO_EXPIRADA];

            if ($reserva->adelanto_estado === self::ADELANTO_PAGADO) {
                $updateData['adelanto_estado'] = self::ADELANTO_PERDIDO;
            }

            $reserva->update($updateData);
        }

        return $vencidas->count();
    }

    /**
     * Reserva confirmada de HOY que "bloquea" una mesa: la más próxima que
     * aún no pasó su hora límite de llegada y cuyo horario ya entró en la
     * ventana de anticipación (hora_inicio - margen).
     */
    public static function activaDeMesa(int $mesaId): ?self
    {
        $margenInicio = (int) config('reservas.margen_inicio_minutos', 10);

        return static::query()
            ->where('mesa_id', $mesaId)
            ->whereDate('fecha', now()->toDateString())
            ->where('estado', self::ESTADO_CONFIRMADA)
            ->whereTime('hora_limite_llegada', '>', now()->format('H:i:s'))
            ->whereTime('hora_inicio', '<=', now()->addMinutes($margenInicio)->format('H:i:s'))
            ->orderBy('hora_inicio')
            ->first();
    }

    /**
     * Sincroniza las mesas según sus reservas activas del momento.
     */
    public static function sincronizarMesasEnReserva(): array
    {
        $liberadas = [];

        foreach (Mesa::query()->where('estado', 'reserva')->get() as $mesa) {
            $activa = self::activaDeMesa($mesa->id);

            if ($activa) {
                $mesa->update([
                    'cliente' => $activa->cliente,
                    'personas' => $activa->personas,
                ]);

                continue;
            }

            $mesa->update([
                'estado' => 'libre',
                'cliente' => null,
                'personas' => null,
            ]);

            $liberadas[] = $mesa;
        }

        foreach (Mesa::query()->where('estado', 'libre')->get() as $mesa) {
            $activa = self::activaDeMesa($mesa->id);

            if (! $activa) {
                continue;
            }

            $mesa->update([
                'estado' => 'reserva',
                'cliente' => $activa->cliente,
                'personas' => $activa->personas,
            ]);
        }

        return $liberadas;
    }

    /**
     * Todas las reservas de una sede para una fecha (por defecto hoy).
     */
    public static function delDia(int $teamId, ?string $fecha = null): Collection
    {
        return static::query()
            ->where('team_id', $teamId)
            ->whereDate('fecha', $fecha ?? now()->toDateString())
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get()
            ->values();
    }

    public function horaFinCarbon(): ?Carbon
    {
        if (! $this->hora_fin) {
            return null;
        }

        return Carbon::createFromFormat('H:i', $this->hora_fin);
    }

    /**
     * ¿La reserva tiene un adelanto aplicado (pagado y aún vigente)?
     */
    public function tieneAdelantoAplicable(): bool
    {
        return $this->adelanto_estado === self::ADELANTO_APLICADO
            && (float) $this->adelanto_monto > 0;
    }

    /**
     * ¿La reserva tiene un adelanto pendiente de pago?
     */
    public function tieneAdelantoPendiente(): bool
    {
        return $this->adelanto_estado === self::ADELANTO_PENDIENTE;
    }

    /**
     * Calcula la hora límite de llegada (hora_inicio + tolerancia).
     */
    public static function calcularHoraLimite(string $horaInicio, int $toleranciaMinutos): string
    {
        return Carbon::createFromFormat('H:i', $horaInicio)
            ->addMinutes($toleranciaMinutos)
            ->format('H:i');
    }
}