<?php

use App\Events\PedidoCreado;
use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('a mixed waiter order is split and broadcast to kitchen and bar', function () {
    $manager = User::query()->where('usuario', 'admin')->firstOrFail();
    Caja::query()->create([
        'team_id' => $manager->current_team_id,
        'user_id' => $manager->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
    Event::fake([PedidoCreado::class]);

    $response = $this->actingAs($manager)->post(route('pedidos.store'), [
        'cliente' => 'Mesa de prueba',
        'productos' => [
            ['id' => 1, 'nombre' => 'Lomo saltado', 'categoria' => 'Platos fuertes', 'cantidad' => 1, 'precio' => 25, 'subtotal' => 25],
            ['id' => 2, 'nombre' => 'Café americano', 'categoria' => 'Bebidas', 'cantidad' => 2, 'precio' => 7.5, 'subtotal' => 15],
        ],
        'total' => 40,
    ]);

    $response->assertRedirect()->assertSessionHasNoErrors();

    $orders = Pedido::query()->where('cliente', 'Mesa de prueba')->get()->keyBy('area');
    expect($orders)->toHaveCount(2)
        ->and($orders->keys()->all())->toEqualCanonicalizing(['cocina', 'bar'])
        ->and($orders['cocina']->productos)->toHaveCount(1)
        ->and($orders['bar']->productos)->toHaveCount(1)
        ->and((float) $orders['cocina']->total)->toBe(25.0)
        ->and((float) $orders['bar']->total)->toBe(15.0);

    Event::assertDispatchedTimes(PedidoCreado::class, 2);
    Event::assertDispatched(PedidoCreado::class, fn (PedidoCreado $event) => $event->pedido->area === 'cocina');
    Event::assertDispatched(PedidoCreado::class, fn (PedidoCreado $event) => $event->pedido->area === 'bar');
});

test('opening an order URL redirects to the existing sales page', function () {
    $manager = User::query()->where('usuario', 'admin')->firstOrFail();
    $order = Pedido::query()->create([
        'team_id' => $manager->current_team_id,
        'user_id' => $manager->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Prueba',
        'productos' => [['nombre' => 'Café', 'cantidad' => 1, 'precio' => 7, 'subtotal' => 7]],
        'total' => 7,
        'estado' => 'pendiente',
        'area' => 'bar',
        'hora_pedido' => now(),
    ]);

    $this->actingAs($manager)
        ->get(route('pedidos.show', $order))
        ->assertRedirect(route('ventas'));
});

test('a waiter can create a table order without a broadcasting failure rolling it back', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $table = Mesa::query()->firstOrFail();
    Caja::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);

    $response = $this->actingAs($waiter)->post(route('pedidos.store'), [
        'mesa_id' => $table->id,
        'cliente' => 'Cliente del mozo',
        'productos' => [
            ['id' => 1, 'nombre' => 'Lomo saltado', 'categoria' => 'Platos fuertes', 'cantidad' => 1, 'precio' => 25, 'subtotal' => 25],
        ],
        'total' => 25,
    ]);

    $response->assertRedirect()->assertSessionHasNoErrors();

    expect(Pedido::query()->where('user_id', $waiter->id)->where('mesa_id', $table->id)->exists())->toBeTrue();
});

test('historical order number formats do not cause duplicate numbers for new waiter orders', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    Caja::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
    $historicalOrder = Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'numero' => 'PEDIDO-LEGACY',
        'cliente' => 'Histórico',
        'productos' => [['nombre' => 'Producto', 'cantidad' => 1, 'precio' => 1, 'subtotal' => 1]],
        'total' => 1,
        'estado' => 'pagado',
        'area' => 'cocina',
        'hora_pedido' => now(),
    ]);

    $this->actingAs($waiter)->post(route('pedidos.store'), [
        'cliente' => 'Nuevo cliente',
        'productos' => [
            ['nombre' => 'Café americano', 'categoria' => 'Bebidas', 'cantidad' => 1, 'precio' => 7, 'subtotal' => 7],
        ],
        'total' => 7,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Pedido::query()->where('cliente', 'Nuevo cliente')->value('numero'))
        ->toBe('#'.str_pad((string) ($historicalOrder->id + 1), 4, '0', STR_PAD_LEFT));
});
