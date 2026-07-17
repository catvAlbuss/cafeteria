<?php

namespace App\Events;

use App\Models\Pedido;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PedidoActualizado implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Pedido $pedido) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("sede.{$this->pedido->team_id}.produccion"),
            new PrivateChannel("sede.{$this->pedido->team_id}.pedidos"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'pedido.actualizado';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->pedido->id,
            'numero' => $this->pedido->numero,
            'mesa_id' => $this->pedido->mesa_id,
            'estado' => $this->pedido->estado,
            'hora_entrega' => $this->pedido->hora_entrega,
        ];
    }
}
