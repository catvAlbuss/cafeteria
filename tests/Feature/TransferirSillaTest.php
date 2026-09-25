<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    Caja::query()->create([
        'team_id' => $this->waiter->current_team_id,
        'user_id' => $this->waiter->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
});

function crearMesaTest(int $numero, int $capacidad, int $sillas): Mesa
{
    return Mesa::query()->create([
        'team_id' => auth()->user()->current_team_id,
        'numero' => $numero,
        'capacidad' => $capacidad,
        'sillas' => $sillas,
        'estado' => 'libre',
    ]);
}

test('mover una silla de una mesa a otra decrementa el origen e incrementa el destino', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 5);
    $destino = crearMesaTest(2, 5, 3);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]))
        ->assertRedirect();

    expect($origen->fresh()->sillas)->toBe(4)
        ->and($destino->fresh()->sillas)->toBe(4);
});

test('mover una silla hacia atras restaura los conteos originales', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 4);
    $destino = crearMesaTest(2, 5, 3);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]));

    expect($origen->fresh()->sillas)->toBe(3)
        ->and($destino->fresh()->sillas)->toBe(4);

    $this->patch(route('mesas.transferir-silla', ['origen' => $destino, 'destino' => $origen]));

    expect($origen->fresh()->sillas)->toBe(4)
        ->and($destino->fresh()->sillas)->toBe(3);
});

test('mover la misma silla dos veces consecutivas acumula movimientos', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 5);
    $destino = crearMesaTest(2, 5, 3);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]));
    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]));

    expect($origen->fresh()->sillas)->toBe(3)
        ->and($destino->fresh()->sillas)->toBe(5);
});

test('no permite transferir si el destino excederia su capacidad sin forzar', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 5);
    $destino = crearMesaTest(2, 3, 3);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]))
        ->assertSessionHas('aviso_capacidad');

    expect($origen->fresh()->sillas)->toBe(5)
        ->and($destino->fresh()->sillas)->toBe(3);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]), ['forzar' => true])
        ->assertRedirect();

    expect($origen->fresh()->sillas)->toBe(4)
        ->and($destino->fresh()->sillas)->toBe(4);
});

test('no permite transferir desde una mesa ocupada', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 5);
    $destino = crearMesaTest(2, 5, 3);
    $origen->update(['estado' => 'ocupada']);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]));

    expect($origen->fresh()->sillas)->toBe(5)
        ->and($destino->fresh()->sillas)->toBe(3);
});

test('no permite transferir a una mesa ocupada', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(1, 5, 5);
    $destino = crearMesaTest(2, 5, 3);
    $destino->update(['estado' => 'ocupada']);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]));

    expect($origen->fresh()->sillas)->toBe(5)
        ->and($destino->fresh()->sillas)->toBe(3);
});

test('no permite que una mesa supere las 10 sillas, incluso forzando', function () {
    $this->actingAs($this->waiter);
    $origen = crearMesaTest(3, 8, 8);
    $destino = crearMesaTest(4, 8, 10);

    $this->patch(route('mesas.transferir-silla', ['origen' => $origen, 'destino' => $destino]), ['forzar' => true])
        ->assertSessionHas('error');

    expect($origen->fresh()->sillas)->toBe(8)
        ->and($destino->fresh()->sillas)->toBe(10);
});
