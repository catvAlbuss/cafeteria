<?php

namespace App\Events;

use App\Models\Pedido;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PedidoCreado implements ShouldBroadcastNow, ShouldRescue
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
        return 'pedido.creado';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->pedido->loadMissing('mesa');

        return [
            'id' => $this->pedido->id,
            'numero' => $this->pedido->numero,
            'mesa_id' => $this->pedido->mesa_id,
            'mesa' => $this->pedido->mesa ? ['id' => $this->pedido->mesa->id, 'numero' => $this->pedido->mesa->numero] : null,
            'cliente' => $this->pedido->cliente,
            'tipo' => $this->pedido->tipo,
            'productos' => $this->pedido->productos,
            'total' => $this->pedido->total,
            'estado' => $this->pedido->estado,
            'area' => $this->pedido->area,
            'observaciones' => $this->pedido->observaciones,
            'hora_pedido' => $this->pedido->hora_pedido,
            'created_at' => $this->pedido->created_at,
        ];
    }
}
