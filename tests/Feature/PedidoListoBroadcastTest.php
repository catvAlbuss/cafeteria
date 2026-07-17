<?php

use App\Events\PedidoListo;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

test('broadcasts the ready order immediately with the assigned waiter', function () {
    $mozo = new User(['name' => 'Lucía Ramos']);
    $mozo->id = 17;

    $mesa = new Mesa(['numero' => '08']);
    $mesa->id = 8;
    $mesa->setRelation('meseroUser', $mozo);

    $pedido = new Pedido(['numero' => '#0042']);
    $pedido->id = 42;
    $pedido->team_id = 3;
    $pedido->mesa_id = 8;
    $pedido->setRelation('mesa', $mesa);
    $pedido->setRelation('empleado', $mozo);

    $event = new PedidoListo($pedido);

    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class)
        ->and($event->broadcastAs())->toBe('pedido.listo')
        ->and($event->broadcastWith())->toMatchArray([
            'id' => 42,
            'numero' => '#0042',
            'mesa_id' => 8,
            'mesa_numero' => '08',
            'mozo_id' => 17,
            'mozo_nombre' => 'Lucía Ramos',
        ]);
});
