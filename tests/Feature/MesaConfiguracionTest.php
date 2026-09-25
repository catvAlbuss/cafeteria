<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    abrirCaja($admin);
});

function abrirCaja(User $user): void
{
    Caja::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
}

function crearMesaLibre(User $user, string $numero = '201'): Mesa
{
    return Mesa::query()->create([
        'team_id' => $user->current_team_id,
        'numero' => $numero,
        'capacidad' => 4,
        'sillas' => 4,
        'estado' => 'libre',
    ]);
}

test('un administrador puede editar las sillas de una mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'sillas' => 6,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->sillas)->toBe(6);
});

test('un administrador no puede poner mas de 10 sillas en una mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'sillas' => 11,
    ])->assertSessionHasErrors('sillas');

    expect($mesa->fresh()->sillas)->toBe(4);
});

test('el numero de mesa es inmutable al actualizar', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'sillas' => 3,
        'numero' => '999',
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->numero)->toBe('201')
        ->and($mesa->fresh()->sillas)->toBe(3);
});

test('un mesero no puede editar sillas ni desactivar mesas', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaLibre($mesero);

    $this->actingAs($mesero)->patch(route('mesas.update', $mesa), [
        'sillas' => 3,
    ])->assertSessionHasErrors('sillas');

    $this->actingAs($mesero)->patch(route('mesas.update', $mesa), [
        'activa' => false,
    ])->assertSessionHasErrors('activa');

    expect($mesa->fresh()->sillas)->toBe(4)
        ->and($mesa->fresh()->activa)->toBeTrue();
});

test('la capacidad al crear una mesa es como maximo 8 y las sillas 10', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    // capacidad 9 falla (máx 8)
    $this->actingAs($admin)->post(route('mesas.store'), [
        'numero' => '301',
        'capacidad' => 9,
        'sillas' => 8,
    ])->assertSessionHasErrors(['capacidad']);

    // sillas 11 falla (máx 10)
    $this->actingAs($admin)->post(route('mesas.store'), [
        'numero' => '301',
        'capacidad' => 8,
        'sillas' => 11,
    ])->assertSessionHasErrors(['sillas']);

    $this->actingAs($admin)->post(route('mesas.store'), [
        'numero' => '301',
        'capacidad' => 8,
        'sillas' => 8,
    ])->assertSessionHasNoErrors();

    expect(Mesa::query()->where('numero', '301')->exists())->toBeTrue();
});

test('restablecer sillas vuelve a la capacidad natural de la mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaLibre($admin);
    $mesa->update(['sillas' => 6]);

    expect($mesa->fresh()->sillas)->toBe(6);

    // Simula el botón "Restablecer" (sillas = capacidad)
    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'sillas' => $mesa->fresh()->capacidad,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->sillas)->toBe(4);
});

test('una mesa libre sin pedidos puede desactivarse y reactivarse', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'activa' => false,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->activa)->toBeFalse();

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'activa' => true,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->activa)->toBeTrue();
});

test('una mesa ocupada no puede desactivarse', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaLibre($admin);
    $mesa->update(['estado' => 'ocupada', 'user_id' => $mesero->id]);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'activa' => false,
    ])->assertSessionHasErrors('activa');

    expect($mesa->fresh()->activa)->toBeTrue();
});

test('una mesa desactivada no acepta cambios de estado', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'activa' => false,
    ])->assertSessionHasNoErrors();

    $this->actingAs($mesero)->patch(route('mesas.update', $mesa), [
        'estado' => 'ocupada',
    ])->assertSessionHas('error');

    expect($mesa->fresh()->estado)->toBe('libre');
});

test('una mesa desactivada no acepta pedidos nuevos', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaLibre($admin);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'activa' => false,
    ])->assertSessionHasNoErrors();

    $this->actingAs($mesero)->post(route('pedidos.store'), [
        'mesa_id' => $mesa->id,
        'productos' => [
            [
                'nombre' => 'Cafe',
                'cantidad' => 1,
                'precio' => 15,
                'subtotal' => 15,
            ],
        ],
        'total' => 15,
        'tipo' => 'salon',
    ])->assertSessionHasErrors('mesa_id');
});

test('solo se puede eliminar una mesa libre y sin historial', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();

    // Ocupada: no se puede eliminar
    $mesaOcupada = crearMesaLibre($admin, '202');
    $mesaOcupada->update(['estado' => 'ocupada', 'user_id' => $mesero->id]);

    $this->actingAs($admin)->delete(route('mesas.destroy', $mesaOcupada))
        ->assertSessionHasErrors('mesa');

    expect(Mesa::query()->where('id', $mesaOcupada->id)->exists())->toBeTrue();

    // Libre pero con historial (pedido pagado): no se puede eliminar
    $mesaConHistorial = crearMesaLibre($admin, '203');
    Pedido::query()->create([
        'team_id' => $admin->current_team_id,
        'user_id' => $mesero->id,
        'mesa_id' => $mesaConHistorial->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'productos' => [],
        'total' => 10,
        'tipo' => 'salon',
        'estado' => 'pagado',
        'area' => 'cocina',
    ]);

    $this->actingAs($admin)->delete(route('mesas.destroy', $mesaConHistorial))
        ->assertSessionHasErrors('mesa');

    expect(Mesa::query()->where('id', $mesaConHistorial->id)->exists())->toBeTrue();

    // Libre y sin historial: se elimina
    $mesaLibre = crearMesaLibre($admin, '204');

    $this->actingAs($admin)->delete(route('mesas.destroy', $mesaLibre))
        ->assertSessionHasNoErrors();

    expect(Mesa::query()->where('id', $mesaLibre->id)->exists())->toBeFalse();
});

test('un mesero no puede eliminar mesas', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaLibre($mesero);

    $this->actingAs($mesero)->delete(route('mesas.destroy', $mesa))
        ->assertForbidden();

    expect(Mesa::query()->where('id', $mesa->id)->exists())->toBeTrue();
});
