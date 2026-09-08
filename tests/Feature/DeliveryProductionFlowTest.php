<?php

use App\Events\PedidoCreado;
use App\Models\Caja;
use App\Models\Delivery;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('sending a delivery to production creates linked orders', function () {
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
    $delivery = Delivery::query()->create([
        'team_id' => $manager->current_team_id,
        'user_id' => $manager->id,
        'codigo' => 'D-TEST',
        'cliente' => 'Cliente delivery',
        'telefono' => '999999999',
        'direccion' => 'Dirección de prueba',
        'productos' => [
            ['nombre' => 'Lomo saltado', 'categoria' => 'Platos fuertes', 'cantidad' => 1, 'precio' => 25, 'subtotal' => 25],
            ['nombre' => 'Café', 'categoria' => 'Bebidas', 'cantidad' => 2, 'precio' => 7, 'subtotal' => 14],
        ],
        'total' => 39,
        'estado' => 'pendiente',
        'estado_delivery' => 'pendiente',
    ]);
    Event::fake([PedidoCreado::class]);

    $this->actingAs($manager)
        ->patch(route('delivery.cocina', $delivery))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $pedidos = Pedido::query()->where('delivery_id', $delivery->id)->get();

    expect($delivery->fresh()->estado_delivery)->toBe('preparando')
        ->and($pedidos)->toHaveCount(2)
        ->and($pedidos->pluck('tipo')->unique()->all())->toBe(['delivery'])
        ->and($pedidos->pluck('area')->all())->toEqualCanonicalizing(['cocina', 'bar']);

    Event::assertDispatchedTimes(PedidoCreado::class, 2);
});
