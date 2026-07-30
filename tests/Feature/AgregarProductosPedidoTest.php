<?php

use App\Events\PedidoCreado;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('new products are added as production orders to an order in preparation', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $pedido = Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'productos' => [['nombre' => 'Lomo', 'cantidad' => 1, 'precio' => 25, 'subtotal' => 25]],
        'total' => 25,
        'estado' => 'preparando',
        'area' => 'cocina',
    ]);
    Event::fake([PedidoCreado::class]);

    $this->actingAs($waiter)
        ->post("/pedidos/{$pedido->id}/agregar-productos", [
            'productos_nuevos' => [
                ['id' => 1, 'nombre' => 'Café', 'categoria' => 'Bebidas', 'cantidad' => 2, 'precio' => 7.5, 'subtotal' => 15],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $nuevoPedido = Pedido::query()
        ->whereKeyNot($pedido->id)
        ->where('cliente', 'Cliente prueba')
        ->firstOrFail();

    expect($nuevoPedido->estado)->toBe('pendiente')
        ->and($nuevoPedido->area)->toBe('bar')
        ->and((float) $nuevoPedido->total)->toBe(15.0)
        ->and($nuevoPedido->user_id)->toBe($waiter->id);

    Event::assertDispatched(PedidoCreado::class, fn (PedidoCreado $event) => $event->pedido->is($nuevoPedido));
});

test('products cannot be added when the original order is not in preparation', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $pedido = Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'productos' => [],
        'total' => 0,
        'estado' => 'pendiente',
        'area' => 'cocina',
    ]);

    $this->actingAs($waiter)
        ->post("/pedidos/{$pedido->id}/agregar-productos", [
            'productos_nuevos' => [
                ['nombre' => 'Café', 'cantidad' => 1, 'precio' => 7, 'subtotal' => 7],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Pedido::query()->count())->toBe(1);
});
