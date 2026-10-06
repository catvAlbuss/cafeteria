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
     *
     * Si la reserva tenía un adelanto pagado, se marca como aplicado.
     */
    public static function atenderActiva(Mesa $mesa): ?Reserva
    {
        $activa = Reserva::activaDeMesa($mesa->id);

        if (! $activa) {
            return null;
        }

        $updateData = [
            'estado' => Reserva::ESTADO_ATENDIDA,
            'hora_llegada' => now()->format('H:i'),
        ];

        // Si tenía adelanto pagado, se marca como aplicado
        if ($activa->adelanto_estado === Reserva::ADELANTO_PAGADO) {
            $updateData['adelanto_estado'] = Reserva::ADELANTO_APLICADO;
            $updateData['adelanto_aplicado_at'] = now();
        }

        $activa->update($updateData);

        ReservaActualizada::dispatch($activa->fresh());

        return $activa;
    }
}