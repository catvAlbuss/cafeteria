<?php

use App\Models\Pedido;
use App\Models\Plato;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function pendientesProduccionPedido(User $user, string $area, string $estado = 'pendiente'): Pedido
{
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');

    return Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente prueba',
        'tipo' => 'salon',
        'area' => $area,
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
        'estado' => $estado,
    ]);
}

test('la prop pendientesProduccion cuenta por área los pendientes y preparando', function () {
    $user = User::query()->where('usuario', 'admin')->firstOrFail();

    pendientesProduccionPedido($user, 'cocina');
    pendientesProduccionPedido($user, 'horno');
    pendientesProduccionPedido($user, 'postres');
    pendientesProduccionPedido($user, 'bar');
    pendientesProduccionPedido($user, 'bar', 'preparando');

    // Fuera del conteo: estados no activos y áreas ajenas.
    pendientesProduccionPedido($user, 'cocina', 'listo');
    pendientesProduccionPedido($user, 'otra_area');

    $response = $this->actingAs($user)->get(route('dashboard'))->assertOk();

    $props = $response->viewData('page')['props'];

    expect($props['pendientesProduccion'])->toBe(['cocina' => 3, 'bar' => 2]);
});

test('sin permiso de ver cocina/bar la prop de pendientes queda en cero', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    pendientesProduccionPedido($admin, 'cocina');

    $usuario = User::factory()->create(['current_team_id' => $admin->current_team_id]);

    $response = $this->actingAs($usuario)->get(route('dashboard'))->assertOk();

    $props = $response->viewData('page')['props'];

    expect($props['pendientesProduccion'])->toBe(['cocina' => 0, 'bar' => 0]);
});
