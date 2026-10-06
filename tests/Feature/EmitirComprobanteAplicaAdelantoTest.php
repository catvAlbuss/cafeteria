<?php

use App\Http\Controllers\FacturaController;
use App\Models\MovimientoCaja;
use App\Models\Pedido;
use App\Models\Reserva;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('emitir comprobante de una mesa con reserva atendida aplica el adelanto', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    [$caja, $mesa, $reserva] = reservarAdelanto($admin, '701');

    $mesa->update(['estado' => 'ocupada', 'cliente' => 'Cliente reserva 701']);

    $pedido = Pedido::query()->create([
        'team_id' => $admin->current_team_id,
        'user_id' => $admin->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente reserva 701',
        'productos' => [],
        'total' => 50,
        'tipo' => 'salon',
        'estado' => 'pendiente_emision',
        'area' => 'cocina',
        'caja_id' => $caja->id,
    ]);

    test()->mock(FacturaController::class, function ($mock) {
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

    $response = $this->actingAs($admin)->post(route('pedidos.emitir-comprobante'), [
        'pedido_ids' => [$pedido->id],
        'mesa_id' => $mesa->id,
        'tipo_documento' => '03',
        'documento' => '00000000',
        'nombre' => 'Cliente reserva',
        'direccion' => '-',
        'metodo_pago' => 'efectivo',
        'authorization_pin' => '0000',
    ]);

    $response->assertOk()->assertJson(['success' => true]);

    // El adelanto se aplicó y el pedido quedó vinculado a la reserva.
    expect($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_APLICADO_TOTAL)
        ->and((float) $reserva->fresh()->adelanto_aplicado)->toBe(20.0)
        ->and($pedido->fresh()->reserva_id)->toBe($reserva->id)
        ->and($pedido->fresh()->estado)->toBe('pagado');

    // La mesa queda libre y, con el adelanto en la misma caja, no se mueve un sol.
    expect($mesa->fresh()->estado)->toBe('libre')
        ->and(MovimientoCaja::query()->count())->toBe(0);
});
