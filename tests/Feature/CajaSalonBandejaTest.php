<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function cajaSalonBandejaUser(): User
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
    ]);

    return $user;
}

function cajaProps($response): array
{
    return $response->viewData('page')['props'] ?? [];
}

test('mesas in listo_cobrar state and their unpaid pedidos are passed to Caja', function () {
    $user = cajaSalonBandejaUser();
    $mesa = Mesa::query()->first();
    $mesa->update(['estado' => 'listo_cobrar', 'user_id' => $user->id]);

    $pedido = Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente Salón',
        'productos' => [],
        'total' => 78,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'cocina',
    ]);

    $response = $this->actingAs($user)->get(route('caja'));
    $response->assertOk();

    $props = cajaProps($response);
    $mesas = $props['mesas'] ?? [];
    $pedidos = $props['pedidos'] ?? [];

    expect($mesas)->not->toBeEmpty()
        ->and(collect($mesas)->firstWhere('id', $mesa->id)['estado'])->toBe('listo_cobrar')
        ->and(collect($pedidos)->contains('id', $pedido->id))->toBeTrue();
});

test('a table that is not ready to charge does not appear in the Caja bandeja', function () {
    $user = cajaSalonBandejaUser();
    $mesa = Mesa::query()->first();
    $mesa->update(['estado' => 'ocupada', 'user_id' => $user->id]);

    $pedido = Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente Ocupada',
        'productos' => [],
        'total' => 12,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'bar',
    ]);

    $response = $this->actingAs($user)->get(route('caja'));
    $response->assertOk();

    $props = cajaProps($response);
    $mesas = $props['mesas'] ?? [];

    expect(collect($mesas)->firstWhere('id', $mesa->id)['estado'])->toBe('ocupada');
});