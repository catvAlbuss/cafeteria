<?php

use App\Models\Pedido;
use App\Models\Plato;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function cajaRegistrarPayload(array $sobre): array
{
    $plato = Plato::query()->where('nombre', 'Cafe Americano')->firstOrFail();

    return array_merge([
        'cliente' => 'Cliente tipo caja',
        'mesa' => null,
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => $plato->id, 'nombre' => $plato->nombre, 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
    ], $sobre);
}

function cajaRegistrarUsuario(): User
{
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    return $admin;
}

test('rechaza el tipo delivery al registrar un pedido', function () {
    $admin = cajaRegistrarUsuario();

    $this->actingAs($admin)
        ->post(route('caja.registrar'), cajaRegistrarPayload(['tipo' => 'delivery']))
        ->assertSessionHasErrors('tipo');

    expect(Pedido::query()->where('tipo', 'delivery')->count())->toBe(0);
});

test('acepta salon y llevar como tipos de pedido en caja', function () {
    $admin = cajaRegistrarUsuario();

    $this->actingAs($admin)
        ->post(route('caja.registrar'), cajaRegistrarPayload(['tipo' => 'salon']))
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->post(route('caja.registrar'), cajaRegistrarPayload(['tipo' => 'llevar', 'cliente' => 'Cliente llevar']))
        ->assertSessionHasNoErrors();

    expect(Pedido::query()->where('tipo', 'salon')->count())->toBe(1)
        ->and(Pedido::query()->where('tipo', 'llevar')->count())->toBe(1);
});
