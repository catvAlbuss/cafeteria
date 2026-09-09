<?php

namespace App\Events;

use App\Models\Pedido;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PedidoListo implements ShouldBroadcastNow, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Pedido $pedido) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("sede.{$this->pedido->team_id}.salon")];
    }

    public function broadcastAs(): string
    {
        return 'pedido.listo';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->pedido->loadMissing(['mesa.meseroUser', 'empleado']);
        $mozo = $this->pedido->mesa?->meseroUser ?? $this->pedido->empleado;

        return [
            'id' => $this->pedido->id,
            'numero' => $this->pedido->numero,
            'mesa_id' => $this->pedido->mesa_id,
            'mesa_numero' => $this->pedido->mesa?->numero,
            'mozo_id' => $mozo?->id,
            'mozo_nombre' => $mozo?->name,
        ];
    }
}
