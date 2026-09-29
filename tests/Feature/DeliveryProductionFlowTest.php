<?php

use App\Models\Caja;
use App\Models\Delivery;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function crearDeliveryAdmin(): array
{
    $manager = User::query()->where('usuario', 'admin')->firstOrFail();
    $caja = Caja::query()
        ->where('team_id', $manager->current_team_id)
        ->where('estado', 'Abierta')
        ->first();

    if (! $caja) {
        $caja = Caja::query()->create([
            'team_id' => $manager->current_team_id,
            'user_id' => $manager->id,
            'caja' => 'Caja Principal',
            'turno' => 'Todo el día',
            'monto_inicial' => 100,
            'fecha_apertura' => now(),
            'estado' => 'Abierta',
        ]);
    }

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

    return [$manager, $caja, $delivery];
}

test('sending a delivery to production no longer creates pending orders in bar or kitchen', function () {
    [$manager, , $delivery] = crearDeliveryAdmin();

    $this->actingAs($manager)
        ->patch(route('delivery.cocina', $delivery))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $pedidos = Pedido::query()->where('delivery_id', $delivery->id)->get();

    expect($delivery->fresh()->estado_delivery)->toBe('preparando')
        ->and($pedidos)->toHaveCount(0);
});

test('delivery stays isolated: delivering updates its own state without linking to orders or the cash register', function () {
    [$manager, $caja, $delivery] = crearDeliveryAdmin();

    $this->actingAs($manager)
        ->patch(route('delivery.entregar', $delivery), [
            'metodo_pago' => 'efectivo',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('delivery_id', $delivery->id)->first();

    expect($pedido)->toBeNull()
        ->and($delivery->fresh()->estado)->toBe('pagado')
        ->and($delivery->fresh()->estado_delivery)->toBe('entregado')
        ->and($delivery->fresh()->metodo_pago)->toBe('efectivo')
        ->and((int) $caja->fresh()->total_ventas_caja)->toBe(0)
        ->and((int) $caja->fresh()->contador_pedidos)->toBe(0);
});

test('delivering an already paid delivery is rejected', function () {
    [$manager, , $delivery] = crearDeliveryAdmin();
    $delivery->update(['estado' => 'pagado']);

    $this->actingAs($manager)
        ->patch(route('delivery.entregar', $delivery), [
            'metodo_pago' => 'yape',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Pedido::query()->where('delivery_id', $delivery->id)->count())->toBe(0);
});
