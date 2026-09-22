<?php

use App\Http\Controllers\FacturaController;
use App\Models\Caja;
use App\Models\Pedido;
use App\Models\Plato;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function emitirComprobanteUser(): User
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
        'total_ventas_caja' => 0,
        'total_pedidos' => 0,
        'contador_pedidos' => 0,
    ]);

    return $user;
}

test('emitir comprobante de una venta directa persiste el metodo_pago en el pedido', function () {
    $user = emitirComprobanteUser();
    $plato = Plato::firstWhere('nombre', 'Cafe Americano');

    $pedido = Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Venta Directa',
        'tipo' => 'llevar',
        'productos' => [
            ['id' => $plato->id, 'nombre' => 'Cafe Americano', 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
        'estado' => 'pagado',
        'caja_id' => Caja::query()->where('estado', 'Abierta')->first()->id,
    ]);

    $this->mock(FacturaController::class, function ($mock) {
        $mock->shouldReceive('generateInvoice')
            ->once()
            ->andReturn(response()->json([
                'success' => true,
                'file' => 'B001-00000001',
                'code' => '0',
                'message' => 'Aceptado',
                'pdf_url' => 'http://localhost/pdf/B001-00000001',
                'xml_url' => null,
                'cdr_url' => null,
            ]));
    });

    test()->actingAs($user)->post(route('pedidos.emitir-comprobante'), [
        'pedido_ids' => [$pedido->id],
        'tipo_documento' => '03',
        'documento' => '00000000',
        'nombre' => 'Venta Directa',
        'direccion' => '-',
        'metodo_pago' => 'tarjeta',
        'authorization_pin' => '0000',
    ])->assertOk()->assertJson(['success' => true]);

    expect($pedido->refresh()->metodo_pago)->toBe('tarjeta');
});
