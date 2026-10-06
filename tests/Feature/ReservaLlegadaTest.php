<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Reserva;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    abrirCajaReservas($admin);
});

function reservaEnVentanaDeLlegada(User $user, ?Mesa $mesa = null): array
{
    $mesa ??= crearMesaReservas($user);
    $reserva = crearReservaHoy($user, $mesa, horaFutura(5), horaFutura(65));

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $reserva->cliente,
        'personas' => $reserva->personas,
    ]);

    return [$mesa, $reserva];
}

test('la llegada confirmada en caja ocupa la mesa y atiende la reserva', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva), [
        'user_id' => User::query()->where('usuario', 'mesero')->firstOrFail()->id,
    ])->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_ATENDIDA)
        ->and($reserva->fresh()->hora_llegada)->not->toBeNull()
        ->and($mesa->fresh()->estado)->toBe('ocupada')
        ->and($mesa->fresh()->cliente)->toBe($reserva->cliente)
        ->and($mesa->fresh()->personas)->toBe($reserva->personas)
        ->and($mesa->fresh()->user_id)->toBe(User::query()->where('usuario', 'mesero')->firstOrFail()->id);
});

test('la llegada sin mesero ocupa la mesa sin asignarla', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertSessionHasNoErrors();

    expect($mesa->fresh()->estado)->toBe('ocupada')
        ->and($mesa->fresh()->user_id)->toBeNull()
        ->and($reserva->fresh()->estado)->toBe(Reserva::ESTADO_ATENDIDA);
});

test('la llegada no se puede confirmar dos veces', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertSessionHasErrors('reserva');

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_ATENDIDA)
        ->and($mesa->fresh()->estado)->toBe('ocupada');
});

test('la llegada no se confirma si la mesa esta ocupada por otro pedido', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $mesa->update(['estado' => 'ocupada']);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertSessionHasErrors('reserva');

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and($mesa->fresh()->cliente)->toBe($reserva->cliente);
});

test('la llegada no admite un mesero inexistente', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva), [
        'user_id' => 999999,
    ])->assertSessionHasErrors('user_id');

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and($mesa->fresh()->estado)->toBe('reserva');
});

test('un mesero no puede confirmar llegadas ni ausencias', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($mesero);

    $this->actingAs($mesero)->post(route('reservas.llegada', $reserva))
        ->assertForbidden();

    $this->actingAs($mesero)->post(route('reservas.no-llego', $reserva))
        ->assertForbidden();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA);
});

test('sin caja abierta no se puede confirmar llegadas', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $mesa->update(['estado' => 'libre', 'cliente' => null, 'personas' => null]);
    Caja::query()->update(['estado' => 'Cerrada']);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertRedirect();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA);
});

test('marcar no llego retiene el adelanto y libera la mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $reserva->update([
        'adelanto_pagado' => 20,
        'adelanto_aplicado' => 0,
        'adelanto_estado' => Reserva::ADELANTO_PAGADO,
    ]);

    $this->actingAs($admin)->post(route('reservas.no-llego', $reserva))
        ->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_NO_PRESENTADO)
        ->and($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_RETENIDO)
        ->and((float) $reserva->fresh()->adelanto_pagado)->toBe(20.0)
        ->and($mesa->fresh()->estado)->toBe('libre')
        ->and($mesa->fresh()->cliente)->toBeNull();
});

test('no llego sin adelanto no mueve dinero', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.no-llego', $reserva))
        ->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_NO_PRESENTADO)
        ->and($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_SIN_ADELANTO);
});

test('no llego no se marca dos veces', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    [$mesa, $reserva] = reservaEnVentanaDeLlegada($admin);

    $this->actingAs($admin)->post(route('reservas.no-llego', $reserva))
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)->post(route('reservas.no-llego', $reserva))
        ->assertSessionHasErrors('reserva');

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_NO_PRESENTADO);
});

test('la llegada de una reserva de manana se rechaza', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    $reserva = Reserva::query()->create([
        'team_id' => $admin->current_team_id,
        'mesa_id' => $mesa->id,
        'fecha' => now()->addDay()->toDateString(),
        'hora_inicio' => '19:00',
        'hora_fin' => '20:00',
        'cliente' => 'De mañana',
        'personas' => 2,
        'estado' => Reserva::ESTADO_CONFIRMADA,
    ]);

    $this->actingAs($admin)->post(route('reservas.llegada', $reserva))
        ->assertSessionHasErrors('reserva');

    $this->actingAs($admin)->post(route('reservas.no-llego', $reserva))
        ->assertSessionHasErrors('reserva');

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and($mesa->fresh()->estado)->toBe('libre');
});
