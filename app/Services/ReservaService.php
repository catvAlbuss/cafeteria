<?php

namespace App\Services;

use App\Events\ReservaActualizada;
use App\Models\Mesa;
use App\Models\Reserva;

class ReservaService
{
    /**
     * Marca la reserva activa de una mesa como atendida (el cliente llegó y
     * se toma el pedido). Devuelve la reserva atendida o null si no hay.
     */
    public static function atenderActiva(Mesa $mesa): ?Reserva
    {
        $activa = Reserva::activaDeMesa($mesa->id);

        if (! $activa) {
            return null;
        }

        $activa->update([
            'estado' => Reserva::ESTADO_ATENDIDA,
            'hora_llegada' => now()->format('H:i'),
        ]);

        ReservaActualizada::dispatch($activa->fresh());

        return $activa;
    }
}
