<?php

namespace App\Events;

use App\Models\Mesa;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MesaActualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Mesa $mesa) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("sede.{$this->mesa->team_id}.mesas")];
    }

    public function broadcastAs(): string
    {
        return 'mesa.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->mesa->id,
            'numero' => $this->mesa->numero,
            'estado' => $this->mesa->estado,
            'cliente' => $this->mesa->cliente,
            'personas' => $this->mesa->personas,
            'pedido_listo' => $this->mesa->pedido_listo,
            'mesero' => $this->mesa->mesero,
            'sillas' => $this->mesa->sillas,
        ];
    }
}
