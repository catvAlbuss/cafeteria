<?php

namespace App\Events;

use App\Models\Caja;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CajaActualizada implements ShouldBroadcastNow, ShouldRescue
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
            'empleado' => $this->caja->empleado,
            'turno' => $this->caja->turno,
            'estado' => $this->caja->estado,
            'monto_inicial' => (float) $this->caja->monto_inicial,
            'monto_final' => $this->caja->monto_final === null ? null : (float) $this->caja->monto_final,
            'ventas_dia' => $this->caja->ventas_dia === null ? null : (float) $this->caja->ventas_dia,
            'observaciones' => $this->caja->observaciones,
            'fecha_apertura' => $this->caja->fecha_apertura?->toISOString(),
            'fecha_cierre' => $this->caja->fecha_cierre?->toISOString(),
            'total_ventas_caja' => $this->caja->total_ventas_caja,
        ];
    }
}
