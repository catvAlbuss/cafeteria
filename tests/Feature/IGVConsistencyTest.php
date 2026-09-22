<?php

use App\Events\PedidoCreado;
use App\Models\Caja;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function igvUser(): User
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

test('CajaController registrar stores subtotal and IGV on the Pedido', function () {
    $user = igvUser();

    $subtotal = 100.00;
    $igv = $subtotal * 0.18;
    $total = $subtotal + $igv;

    $this->actingAs($user)->post(route('caja.registrar'), [
        'cliente' => 'Cliente IGV Test',
        'mesa' => null,
        'tipo' => 'salon',
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => 1, 'nombre' => 'Café Americano', 'cantidad' => 2, 'precio' => 50, 'subtotal' => 100],
        ],
        'subtotal' => $subtotal,
        'igv' => $igv,
        'total' => $total,
    ])->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('cliente', 'Cliente IGV Test')->first();
    expect($pedido)->not->toBeNull()
        ->and((float) $pedido->subtotal)->toBe($subtotal)
        ->and((float) $pedido->igv)->toBe($igv)
        ->and((float) $pedido->total)->toBe($total);
});

test('PedidoController store persists base, IGV and charged total on the Pedido', function () {
    $user = igvUser();
    Event::fake([PedidoCreado::class]);

    $this->actingAs($user)->post(route('pedidos.store'), [
        'cliente' => 'Mesa IGV Test',
        'productos' => [
            ['id' => 1, 'nombre' => 'Café Americano', 'categoria' => 'Bebidas', 'cantidad' => 2, 'precio' => 50, 'subtotal' => 100],
        ],
        'subtotal' => 84.75,
        'igv' => 15.25,
        'total' => 100,
    ])->assertSessionHasNoErrors();

    $pedido = Pedido::query()->where('cliente', 'Mesa IGV Test')->first();
    expect($pedido)->not->toBeNull()
        ->and((float) $pedido->subtotal)->toBe(84.75)
        ->and((float) $pedido->igv)->toBe(15.25)
        ->and((float) $pedido->total)->toBe(100.0);
});

test('IGV is always derived from the charged total (subtotal + IGV = total)', function () {
    $montoCargo = 100.00;
    $subtotal = round($montoCargo / 1.18, 2);
    $igv = round($montoCargo - $subtotal, 2);

    expect($subtotal)->toBe(84.75)
        ->and($igv)->toBe(15.25)
        ->and(round($subtotal + $igv, 2))->toBe($montoCargo);
});
