<?php

namespace App\Models;

use App\Services\ReservaService;
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

    public const ESTADO_NO_PRESENTADO = 'no_presentado';

    public const ADELANTO_SIN_ADELANTO = 'sin_adelanto';

    public const ADELANTO_PAGADO = 'pagado';

    public const ADELANTO_APLICADO_PARCIAL = 'aplicado_parcial';

    public const ADELANTO_APLICADO_TOTAL = 'aplicado_total';

    public const ADELANTO_DEVUELTO = 'devuelto';

    public const ADELANTO_RETENIDO = 'retenido';

    protected $fillable = [
        'team_id',
        'mesa_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'cliente',
        'telefono',
        'personas',
        'adelanto_pagado',
        'adelanto_aplicado',
        'adelanto_pagado_at',
        'adelanto_metodo_pago',
        'adelanto_caja_id',
        'adelanto_pagado_por',
        'adelanto_estado',
        'notas',
        'estado',
        'fecha_cancelacion',
        'motivo_cancelacion',
        'cancelada_por',
        'hora_llegada',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'adelanto_pagado' => 'decimal:2',
        'adelanto_aplicado' => 'decimal:2',
        'adelanto_pagado_at' => 'datetime',
    ];

    public function mesa(): BelongsTo
    {
        return $this->belongsTo(Mesa::class);
    }

    public function cancelador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelada_por');
    }

    /**
     * Marcar como no presentadas todas las reservas confirmadas cuya hora_fin
     * ya pasó, más la tolerancia de retraso (`reservas.tolerancia_minutos`).
     *
     * El dinero no se mueve: el adelanto pasa a "retenido" para que caja sepa
     * que tiene S/ 20 esperando una decisión (devolverlo o no). No se emite
     * ningún egreso automáticamente.
     */
    public static function expirarVencidas(): int
    {
        $ahora = now();
        $tolerancia = (int) config('reservas.tolerancia_minutos', 0);

        $vencidas = static::query()
            ->where('estado', self::ESTADO_CONFIRMADA)
            ->where('fecha', '<=', $ahora->toDateString())
            ->get()
            ->filter(function (self $reserva) use ($ahora, $tolerancia) {
                $fin = Carbon::parse("{$reserva->fecha} {$reserva->hora_fin}");

                return $fin->addMinutes($tolerancia)->lte($ahora);
            })
            ->values();

        foreach ($vencidas as $reserva) {
            $datos = ['estado' => self::ESTADO_NO_PRESENTADO];

            if ((float) $reserva->adelanto_pagado > 0
                && $reserva->adelanto_estado === self::ADELANTO_PAGADO) {
                $datos['adelanto_estado'] = self::ADELANTO_RETENIDO;
            }

            $reserva->update($datos);
        }

        return $vencidas->count();
    }

    /**
     * Reserva confirmada de HOY que "bloquea" una mesa: la más próxima que
     * aún no pasó su hora de fin y cuyo horario ya entró en la ventana de
     * anticipación (hora_inicio - margen). Antes de esa ventana la mesa se
     * usa con normalidad y la reserva aún no es activa.
     */
    public static function activaDeMesa(int $mesaId): ?self
    {
        $margenInicio = (int) config('reservas.margen_inicio_minutos', 10);

        return static::query()
            ->where('mesa_id', $mesaId)
            ->whereDate('fecha', now()->toDateString())
            ->where('estado', self::ESTADO_CONFIRMADA)
            ->whereTime('hora_fin', '>', now()->format('H:i:s'))
            ->whereTime('hora_inicio', '<=', now()->addMinutes($margenInicio)->format('H:i:s'))
            ->orderBy('hora_inicio')
            ->orderBy('hora_fin')
            ->first();
    }

    /**
     * Sincroniza las mesas según sus reservas activas del momento:
     * - Mesas en "reserva" sin reserva activa se devuelven a "libre".
     * - Mesas "libres" cuya reserva ya entró en la ventana pasan a "reserva".
     *
     * @return array<int, Mesa> mesas cuyo estado cambió
     */
    public static function sincronizarMesasEnReserva(): array
    {
        $cambiadas = [];

        $mesas = Mesa::query()
            ->whereIn('estado', ['reserva', 'libre'])
            ->get();

        foreach ($mesas as $mesa) {
            if (ReservaService::aplicarReservaActiva($mesa)) {
                $cambiadas[] = $mesa;
            }
        }

        return $cambiadas;
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

    public function horaFinCarbon(): Carbon
    {
        return Carbon::createFromFormat('H:i', $this->hora_fin);
    }
}
