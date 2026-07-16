<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

test('inventory schema and routes are available', function () {
    expect(Schema::hasColumns('insumos', ['team_id', 'nombre', 'unidad', 'stock', 'precio']))->toBeTrue()
        ->and(Schema::hasColumns('movimientos_inventario', ['team_id', 'item_type', 'item_id', 'tipo', 'cantidad']))->toBeTrue()
        ->and(Schema::hasColumns('recetas', ['team_id', 'plato_id', 'insumo_id', 'cantidad']))->toBeTrue()
        ->and(Route::has('cardex.index'))->toBeTrue()
        ->and(Route::has('mermas.store'))->toBeTrue()
        ->and(Route::has('insumos.index'))->toBeTrue()
        ->and(Route::has('insumos.comprar'))->toBeTrue()
        ->and(Route::has('insumos.mermar'))->toBeTrue()
        ->and(Route::has('insumos.show'))->toBeFalse()
        ->and(Route::has('insumos.create'))->toBeFalse()
        ->and(Route::has('insumos.edit'))->toBeFalse();
});
