<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('a table is released only after payment with an authorized pin', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $cashier = User::query()->where('usuario', 'cajero')->firstOrFail();
    $mesa = Mesa::query()->firstOrFail();
    $mesa->update(['estado' => 'ocupada', 'user_id' => $waiter->id]);
    $caja = Caja::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $cashier->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
    $pedido = Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'productos' => [],
        'total' => 25,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'cocina',
    ]);

    $this->actingAs($waiter)->patch(route('mesas.cobrar', $mesa), [
        'metodo_pago' => 'efectivo',
        'pedido_ids' => [$pedido->id],
        'authorization_pin' => '1234',
    ])->assertSessionHasErrors('authorization_pin');

    expect($mesa->fresh()->estado)->toBe('ocupada')
        ->and($pedido->fresh()->estado)->toBe('entregado');

    $this->actingAs($waiter)->patch(route('mesas.cobrar', $mesa), [
        'metodo_pago' => 'efectivo',
        'pedido_ids' => [$pedido->id],
        'authorization_pin' => '5678',
    ])->assertSessionHasNoErrors();

    $mesa->refresh();
    $pedido->refresh();

    expect($mesa->estado)->toBe('libre')
        ->and($mesa->user_id)->toBeNull()
        ->and($pedido->estado)->toBe('pagado')
        ->and($pedido->caja_id)->toBe($caja->id);
});

test('an occupied table with unpaid orders cannot be released manually', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $cashier = User::query()->where('usuario', 'cajero')->firstOrFail();
    Caja::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $cashier->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
    $mesa = Mesa::query()->firstOrFail();
    $mesa->update(['estado' => 'ocupada', 'user_id' => $waiter->id]);
    Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'productos' => [],
        'total' => 12,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'bar',
    ]);

    $this->actingAs($waiter)->patch(route('mesas.update', $mesa), [
        'estado' => 'libre',
    ])->assertSessionHasErrors('estado');

    expect($mesa->fresh()->estado)->toBe('ocupada');
});
