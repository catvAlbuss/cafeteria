<?php

namespace App\Events;

use App\Models\Reserva;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservaActualizada implements ShouldBroadcastNow, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Reserva $reserva) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("sede.{$this->reserva->team_id}.reservas")];
    }

    public function broadcastAs(): string
    {
        return 'reserva.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->reserva->id,
            'mesa_id' => $this->reserva->mesa_id,
            'fecha' => $this->reserva->fecha,
            'hora_inicio' => $this->reserva->hora_inicio,
            'hora_fin' => $this->reserva->hora_fin,
            'cliente' => $this->reserva->cliente,
            'personas' => $this->reserva->personas,
            'estado' => $this->reserva->estado,
            'hora_llegada' => $this->reserva->hora_llegada,
            'adelanto_pagado' => $this->reserva->adelanto_pagado,
            'adelanto_aplicado' => $this->reserva->adelanto_aplicado,
            'adelanto_metodo_pago' => $this->reserva->adelanto_metodo_pago,
            'adelanto_estado' => $this->reserva->adelanto_estado,
        ];
    }
}
