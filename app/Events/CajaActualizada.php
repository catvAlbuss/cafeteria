<?php

namespace App\Events;

use App\Models\Caja;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CajaActualizada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Caja $caja) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("sede.{$this->caja->team_id}.caja")];
    }

    public function broadcastAs(): string
    {
        return 'caja.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->caja->id,
            'caja' => $this->caja->caja,
            'estado' => $this->caja->estado,
            'total_ventas_caja' => $this->caja->total_ventas_caja,
        ];
    }
}
