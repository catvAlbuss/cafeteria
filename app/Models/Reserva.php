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

    protected $fillable = [
        'team_id',
        'mesa_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'cliente',
        'telefono',
        'personas',
        'notas',
        'estado',
        'fecha_cancelacion',
        'motivo_cancelacion',
        'cancelada_por',
        'hora_llegada',
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
     * Marcar como expiradas todas las reservas confirmadas cuya hora_fin ya
     * pasó (el cliente nunca llegó). Es el "chequeo lazy" de expiración.
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
                            ->whereTime('hora_fin', '<=', $ahora->format('H:i:s'));
                    });
            })
            ->get();

        foreach ($vencidas as $reserva) {
            $reserva->update(['estado' => self::ESTADO_EXPIRADA]);
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
            ->first();
    }

    /**
     * Sincroniza las mesas según sus reservas activas del momento:
     * - Mesas en "reserva" sin reserva activa se devuelven a "libre".
     * - Mesas "libres" cuya reserva ya entró en la ventana pasan a "reserva".
     *
     * @return array<int, Mesa> mesas liberadas
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

    public function horaFinCarbon(): Carbon
    {
        return Carbon::createFromFormat('H:i', $this->hora_fin);
    }
}
