<?php

use App\Models\Caja;
use App\Models\Pedido;
use App\Models\Plato;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function cajaNumeroPedidoUser(): User
{
    $user = User::query()->where('usuario', 'admin')->firstOrFail();
    Caja::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
        'total_ventas_caja' => 0,
        'total_pedidos' => 0,
        'contador_pedidos' => 0,
    ]);

    return $user;
}

function registrarPedidoCaja(User $user, ?string $cliente = null): Pedido
{
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');

    test()->actingAs($user)->post(route('caja.registrar'), [
        'cliente' => $cliente,
        'mesa' => null,
        'tipo' => 'llevar',
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
    ])->assertSessionHasNoErrors();

    return Pedido::query()->latest('id')->first();
}

test('cada venta directa incrementa el numero_pedido secuencial por caja', function () {
    $user = cajaNumeroPedidoUser();

    $pedido1 = registrarPedidoCaja($user, 'Pedido Uno');
    $pedido2 = registrarPedidoCaja($user, 'Pedido Dos');

    $caja = Caja::query()->where('estado', 'Abierta')->first();

    expect((int) $pedido1->numero_pedido)->toBe(1)
        ->and((int) $pedido2->numero_pedido)->toBe(2)
        ->and((int) $caja->contador_pedidos)->toBe(2)
        ->and((int) $pedido1->caja_id)->toBe($caja->id)
        ->and((int) $pedido2->caja_id)->toBe($caja->id);
});

test('al cerrar la caja y abrir otra, la secuencia vuelve a empezar', function () {
    $user = cajaNumeroPedidoUser();
    registrarPedidoCaja($user, 'Pedido Caja Anterior');

    $caja = Caja::query()->where('estado', 'Abierta')->first();
    $caja->update(['estado' => 'Cerrada', 'fecha_cierre' => now()]);

    Caja::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'caja' => 'Caja 02',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
        'total_ventas_caja' => 0,
        'total_pedidos' => 0,
        'contador_pedidos' => 0,
    ]);

    $pedidoNuevo = registrarPedidoCaja($user, 'Pedido Caja Nueva');

    expect((int) $pedidoNuevo->numero_pedido)->toBe(1);
});

test('cancelar la última venta devuelve el numero_pedido y reutiliza la secuencia', function () {
    $user = cajaNumeroPedidoUser();
    registrarPedidoCaja($user, 'Pedido Uno');

    $caja = Caja::query()->where('estado', 'Abierta')->first();
    $pedido1 = Pedido::query()->where('cliente', 'Pedido Uno')->first();

    expect((int) $caja->contador_pedidos)->toBe(1);

    $this->actingAs($user)->post(route('caja.cancelar', $pedido1))
        ->assertJson(['success' => true]);

    $caja->refresh();

    expect((int) $caja->contador_pedidos)->toBe(0);

    // El siguiente pedido vuelve a usar el número 1.
    $pedidoNuevo = registrarPedidoCaja($user, 'Reutilizado');

    expect((int) $pedidoNuevo->numero_pedido)->toBe(1)
        ->and((int) $caja->refresh()->contador_pedidos)->toBe(1);
});

test('cancelar una venta intermedia no rompe la secuencia de numero_pedido', function () {
    $user = cajaNumeroPedidoUser();
    registrarPedidoCaja($user, 'Primero');
    registrarPedidoCaja($user, 'Segundo');

    // Se anula el pedido 1, pero el 2 sigue vigente: el contador no baja.
    $primero = Pedido::query()->where('cliente', 'Primero')->first();

    $this->actingAs($user)->post(route('caja.cancelar', $primero))
        ->assertJson(['success' => true]);

    $caja = Caja::query()->where('estado', 'Abierta')->first();

    expect((int) $caja->refresh()->contador_pedidos)->toBe(2);

    $pedidoNuevo = registrarPedidoCaja($user, 'Nuevo');

    expect((int) $pedidoNuevo->numero_pedido)->toBe(3);
});

test('los pedidos de mesa no reciben numero_pedido (se mantiene numbero global)', function () {
    $user = cajaNumeroPedidoUser();
    registrarPedidoCaja($user, 'Venta Directa');

    $pedidoMesa = Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Pedido de mesa',
        'productos' => [],
        'total' => 15,
        'estado' => 'pendiente',
        'caja_id' => Caja::query()->where('estado', 'Abierta')->first()->id,
    ]);

    expect($pedidoMesa->numero_pedido)->toBeNull()
        ->and($pedidoMesa->numero)->toStartWith('#');
});
