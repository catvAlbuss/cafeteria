<?php

use App\Models\Caja;
use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Models\Plato;
use App\Models\Team;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function cajaCancelarVentaUser(): User
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
    ]);

    return $user;
}

test('registrar descuenta stock y registra el cardex de salida', function () {
    $user = cajaCancelarVentaUser();
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');
    $stockInicial = (float) $plato->stock;

    $this->actingAs($user)->post(route('caja.registrar'), [
        'cliente' => 'Cliente Stock Test',
        'mesa' => null,
        'tipo' => 'salon',
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 2, 'precio' => 7.50, 'subtotal' => 15.00],
        ],
        'subtotal' => 15.00,
        'igv' => 2.70,
        'total' => 17.70,
    ])->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('cliente', 'Cliente Stock Test')->first();
    $plato->refresh();

    expect((float) $plato->stock)->toBe($stockInicial - 2)
        ->and($pedido->stock_descontado)->toBeTrue();

    $movimiento = MovimientoInventario::query()
        ->where('item_type', 'plato')
        ->where('item_id', $plato->id)
        ->where('tipo', 'salida')
        ->where('motivo', 'venta')
        ->first();

    expect($movimiento)->not->toBeNull()
        ->and((float) $movimiento->cantidad)->toBe(2.0)
        ->and((float) $movimiento->stock_resultante)->toBe((float) $plato->stock);
});

test('cancelar la venta restaura el stock, revierte caja y registra el cardex de entrada', function () {
    $user = cajaCancelarVentaUser();
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');
    $stockInicial = (float) $plato->stock;

    $this->actingAs($user)->post(route('caja.registrar'), [
        'cliente' => 'Cliente Cancel Test',
        'mesa' => null,
        'tipo' => 'salon',
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 3, 'precio' => 7.50, 'subtotal' => 22.50],
        ],
        'subtotal' => 22.50,
        'igv' => 4.05,
        'total' => 26.55,
    ])->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('cliente', 'Cliente Cancel Test')->first();
    $caja = Caja::query()->where('estado', 'Abierta')->first();

    expect((float) $caja->total_ventas_caja)->toBe(26.55)
        ->and((int) $caja->total_pedidos)->toBe(1);

    $this->actingAs($user)->post(route('caja.cancelar', $pedido))
        ->assertJson(['success' => true]);

    $plato->refresh();
    $pedido->refresh();
    $caja->refresh();

    expect((float) $plato->stock)->toBe($stockInicial)
        ->and($pedido->estado)->toBe('cancelado')
        ->and($pedido->stock_descontado)->toBeFalse()
        ->and((float) $caja->total_ventas_caja)->toBe(0.0)
        ->and((int) $caja->total_pedidos)->toBe(0);

    $movimiento = MovimientoInventario::query()
        ->where('item_type', 'plato')
        ->where('item_id', $plato->id)
        ->where('tipo', 'entrada')
        ->where('motivo', 'ajuste')
        ->where('referencia_id', $pedido->id)
        ->first();

    expect($movimiento)->not->toBeNull()
        ->and((float) $movimiento->cantidad)->toBe(3.0)
        ->and((float) $movimiento->stock_resultante)->toBe($stockInicial);
});

test('cancelar una venta ya anulada no dobla la restauración del stock', function () {
    $user = cajaCancelarVentaUser();
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');
    $stockInicial = (float) $plato->stock;

    $this->actingAs($user)->post(route('caja.registrar'), [
        'cliente' => 'Cliente Doble Cancel',
        'mesa' => null,
        'tipo' => 'salon',
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
    ])->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('cliente', 'Cliente Doble Cancel')->first();

    $this->actingAs($user)->post(route('caja.cancelar', $pedido))->assertJson(['success' => true]);
    $this->actingAs($user)->post(route('caja.cancelar', $pedido))->assertJson(['success' => false]);

    $plato->refresh();

    expect((float) $plato->stock)->toBe($stockInicial);
});

test('cancelar una venta de otra sede es rechazada', function () {
    $user = cajaCancelarVentaUser();

    $otroTeam = Team::factory()->create();
    $pedidoOtroTeam = Pedido::query()->create([
        'team_id' => $otroTeam->id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Otra Sede',
        'productos' => [],
        'total' => 10,
        'estado' => 'pagado',
        'stock_descontado' => true,
    ]);

    $this->actingAs($user)->post(route('caja.cancelar', $pedidoOtroTeam))
        ->assertNotFound();
});
