<?php

use App\Models\Caja;
use App\Models\Insumo;
use App\Models\MovimientoInventario;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);

    $this->manager = User::query()->where('usuario', 'admin')->firstOrFail();
    Caja::query()->create([
        'team_id' => $this->manager->current_team_id,
        'user_id' => $this->manager->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
});

test('an input without inventory movements can be deleted', function () {
    $insumo = crearInsumoParaEliminar($this->manager);

    $this->actingAs($this->manager)
        ->delete(route('insumos.destroy', $insumo))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Insumo::query()->find($insumo->id))->toBeNull();
});

test('an input with cardex movements cannot be deleted', function () {
    $insumo = crearInsumoParaEliminar($this->manager);
    MovimientoInventario::query()->create([
        'team_id' => $this->manager->current_team_id,
        'item_type' => 'insumo',
        'item_id' => $insumo->id,
        'tipo' => 'entrada',
        'cantidad' => 5,
        'stock_resultante' => 5,
        'motivo' => 'compra',
        'user_id' => $this->manager->id,
    ]);

    $this->actingAs($this->manager)
        ->delete(route('insumos.destroy', $insumo))
        ->assertRedirect()
        ->assertSessionHasErrors('insumo');

    expect(Insumo::query()->find($insumo->id))->not->toBeNull();
});

function crearInsumoParaEliminar(User $user): Insumo
{
    return Insumo::query()->create([
        'team_id' => $user->current_team_id,
        'nombre' => 'Insumo eliminable '.fake()->unique()->word(),
        'categoria' => 'Prueba',
        'area' => 'cocina',
        'unidad' => 'kg',
        'stock' => 5,
        'stock_minimo' => 1,
        'precio' => 2,
        'proveedor' => 'Proveedor',
        'activo' => true,
    ]);
}
