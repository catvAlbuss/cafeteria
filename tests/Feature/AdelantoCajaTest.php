<?php

use App\Models\Caja;
use App\Models\MovimientoCaja;
use App\Models\Pedido;
use App\Models\Plato;
use App\Models\Reserva;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function adelantoEsperadoDe(TestCase $test, User $user): float
{
    $props = $test->actingAs($user)
        ->get(route('contador.index'))
        ->assertOk()
        ->viewData('page')['props'];

    return (float) $props['resumen']['efectivo_esperado'];
}

function reservarAdelanto(
    User $user,
    string $numeroMesa,
    float $adelanto = 20,
    string $metodo = 'efectivo',
    string $estadoReserva = Reserva::ESTADO_ATENDIDA,
    string $estadoAdelanto = Reserva::ADELANTO_PAGADO,
): array {
    $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();
    $mesa = crearMesaReservas($user, $numeroMesa);

    $reserva = crearReservaHoy(
        $user, $mesa, horaFutura(5), horaFutura(65),
        $estadoReserva, 'Cliente reserva '.$numeroMesa
    );

    $reserva->update([
        'adelanto_pagado' => $adelanto,
        'adelanto_metodo_pago' => $metodo,
        'adelanto_pagado_at' => now(),
        'adelanto_caja_id' => $caja->id,
        'adelanto_pagado_por' => $user->id,
        'adelanto_estado' => $estadoAdelanto,
    ]);

    return [$caja, $mesa, $reserva->fresh()];
}

test('al cobrar, el adelanto sale de la línea de caja y el arqueo queda exacto', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $cajero = User::query()->where('usuario', 'cajero')->firstOrFail();

    abrirCajaReservas($admin);

    [, $mesa, $reserva] = reservarAdelanto($admin, '501');

    $mesa->update(['estado' => 'ocupada', 'cliente' => 'Cliente reserva 501']);

    $pedido = Pedido::query()->create([
        'team_id' => $admin->current_team_id,
        'user_id' => $admin->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente reserva 501',
        'productos' => [],
        'total' => 50,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'cocina',
    ]);

    $this->actingAs($cajero)->patch(route('mesas.cobrar', $mesa), [
        'metodo_pago' => 'efectivo',
        'pedido_ids' => [$pedido->id],
        'authorization_pin' => '5678',
    ])->assertSessionHasNoErrors();

    // Mientras el adelanto siga en la caja que lo cobró no se mueve un sol.
    expect(MovimientoCaja::query()->count())->toBe(0);

    expect($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_APLICADO_TOTAL)
        ->and((float) $reserva->fresh()->adelanto_aplicado)->toBe(20.0)
        ->and($pedido->fresh()->reserva_id)->toBe($reserva->id);

    // Fondo 100 + venta 50 = 150, que es lo que hay físicamente: 100 + 20
    // depositados + 30 que puso el cliente. La línea de adelantos bajó de 20
    // a 0 al aplicarse, exactamente lo que falta en el cajón.
    expect(adelantoEsperadoDe($this, $admin))->toBe(150.0);
});

test('un adelanto cobrado en Yape no infla el efectivo esperado', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    reservarAdelanto($admin, '502', 20, 'yape');

    $props = $this->actingAs($admin)->get(route('contador.index'))
        ->assertOk()->viewData('page')['props'];

    expect((float) $props['resumen']['efectivo_esperado'])->toBe(100.0)
        ->and((float) $props['resumen']['ingresos_aportes'])->toBe(0.0)
        ->and((float) $props['resumen']['adelantos_en_caja'])->toBe(20.0)
        ->and((float) $props['resumen']['adelantos_en_caja_efectivo'])->toBe(0.0)
        ->and((float) $props['resumen']['ventas_yape'])->toBe(0.0);
});

test('el dinero que todavía está en caja se puede devolver sin dejar movimiento', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    [, , $reserva] = reservarAdelanto(
        $admin, '503', 20, 'efectivo',
        Reserva::ESTADO_NO_PRESENTADO, Reserva::ADELANTO_RETENIDO
    );

    expect(adelantoEsperadoDe($this, $admin))->toBe(120.0);

    $this->actingAs($admin)->post(route('reservas.devolver', $reserva))
        ->assertSessionHasNoErrors();

    expect(MovimientoCaja::query()->count())->toBe(0)
        ->and($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_DEVUELTO);

    // 100 de fondo: los 20 salen de la línea de adelantos al devolverse.
    expect(adelantoEsperadoDe($this, $admin))->toBe(100.0);
});

test('un adelanto cobrado en otra jornada sí deja egreso al devolver', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    // El dinero de esa reserva viaja heredado en el monto inicial de la
    // jornada actual, así que la línea de adelantos ya no lo cuenta.
    $cajaHeredada = Caja::query()->create([
        'team_id' => $admin->current_team_id,
        'caja' => 'Caja anterior',
        'user_id' => $admin->id,
        'turno' => 'Todo el día',
        'monto_inicial' => 0,
        'estado' => 'Cerrada',
        'fecha_apertura' => now()->subDay(),
        'fecha_cierre' => now()->subDay(),
    ]);

    $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();
    $caja->update(['monto_inicial' => 120.0]);

    [, , $reserva] = reservarAdelanto($admin, '508');
    $reserva->update(['adelanto_caja_id' => $cajaHeredada->id]);

    expect(adelantoEsperadoDe($this, $admin))->toBe(120.0);

    $this->actingAs($admin)->post(route('reservas.devolver', $reserva))
        ->assertSessionHasNoErrors();

    $egreso = MovimientoCaja::query()->where('tipo', 'egreso')->firstOrFail();

    expect((float) $egreso->monto)->toBe(20.0)
        ->and($egreso->concepto)->toContain('Devolución de adelanto')
        ->and($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_DEVUELTO);

    expect(adelantoEsperadoDe($this, $admin))->toBe(100.0);
});

test('el cajero ve las reservas pero no puede devolver el dinero', function () {
    $cajero = User::query()->where('usuario', 'cajero')->firstOrFail();
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($cajero);

    [, , $reserva] = reservarAdelanto($cajero, '504');

    $this->actingAs($cajero)->post(route('reservas.devolver', $reserva))
        ->assertForbidden();

    expect($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_PAGADO)
        ->and(MovimientoCaja::query()->where('tipo', 'egreso')->count())->toBe(0);

    $this->actingAs($admin)->post(route('reservas.devolver', $reserva))
        ->assertSessionHasNoErrors();

    expect($reserva->fresh()->adelanto_estado)->toBe(Reserva::ADELANTO_DEVUELTO);
});

test('al anular una venta en efectivo el arqueo sigue exacto', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();

    $pedido = Pedido::query()->create([
        'team_id' => $admin->current_team_id,
        'user_id' => $admin->id,
        'caja_id' => $caja->id,
        'numero' => Pedido::generarNumero(),
        'numero_pedido' => 1,
        'cliente' => 'Venta anulable',
        'productos' => [],
        'total' => 50,
        'metodo_pago' => 'efectivo',
        'tipo' => 'salon',
        'estado' => 'pagado',
        'area' => 'cocina',
        'stock_descontado' => true,
    ]);

    expect(adelantoEsperadoDe($this, $admin))->toBe(150.0);

    $this->actingAs($admin)->post(route('caja.cancelar', $pedido))
        ->assertOk();

    expect(adelantoEsperadoDe($this, $admin))->toBe(100.0);
});

test('anular una venta registrada en caja mantiene el arqueo exacto', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $plato = Plato::firstWhere('nombre', 'Cafe Americano');

    $this->actingAs($admin)->post(route('caja.registrar'), [
        'cliente' => 'Venta registrada anulable',
        'mesa' => null,
        'tipo' => 'salon',
        'metodoPago' => 'efectivo',
        'productos' => [
            ['id' => $plato->id, 'nombre' => $plato->nombre, 'cantidad' => 2, 'precio' => 7.5, 'subtotal' => 15],
        ],
        'subtotal' => 15,
        'igv' => 2.7,
        'total' => 17.7,
    ])->assertSessionHasNoErrors();

    expect(adelantoEsperadoDe($this, $admin))->toBe(117.7);

    $pedido = Pedido::query()->where('cliente', 'Venta registrada anulable')->firstOrFail();

    $this->actingAs($admin)->post(route('caja.cancelar', $pedido))
        ->assertOk();

    expect(adelantoEsperadoDe($this, $admin))->toBe(100.0);
});

test('caja recibe las reservas de hoy y las que dejaron dinero sin resolver', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    [, , $vigente] = reservarAdelanto($admin, '505');
    [, , $olvidada] = reservarAdelanto($admin, '506', 20, 'efectivo', Reserva::ESTADO_CANCELADA);
    [, , $sinDinero] = reservarAdelanto(
        $admin, '507', 0, 'efectivo',
        Reserva::ESTADO_CANCELADA, Reserva::ADELANTO_SIN_ADELANTO
    );

    $props = $this->actingAs($admin)->get(route('caja'))
        ->assertOk()->viewData('page')['props'];

    $ids = collect($props['reservas'])->pluck('id');

    expect($ids)->toContain($vigente->id)
        ->toContain($olvidada->id)
        ->not->toContain($sinDinero->id);
});
