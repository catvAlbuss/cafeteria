<?php

use App\Models\MovimientoCaja;
use App\Models\Pedido;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

afterEach(function () {
    Carbon::setTestNow();
});

test('al cobrar una mesa con reserva en ventana, la mesa queda reservada y no libre', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $cajero = User::query()->where('usuario', 'cajero')->firstOrFail();
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($cajero);

    $mesa = crearMesaReservas($admin, '401');
    $reserva = crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(65),
        Reserva::ESTADO_CONFIRMADA, 'Cliente con reserva'
    );

    $mesa->update(['estado' => 'ocupada', 'user_id' => $mesero->id]);

    Pedido::query()->create([
        'team_id' => $mesero->current_team_id,
        'user_id' => $mesero->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente sentado',
        'productos' => [],
        'total' => 25,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'cocina',
    ]);

    $this->actingAs($mesero)->patch(route('mesas.cobrar', $mesa), [
        'metodo_pago' => 'efectivo',
        'pedido_ids' => [Pedido::query()->where('mesa_id', $mesa->id)->firstOrFail()->id],
        'authorization_pin' => '5678',
    ])->assertSessionHasNoErrors();

    $mesa->refresh();

    expect($mesa->estado)->toBe('reserva')
        ->and($mesa->cliente)->toBe('Cliente con reserva')
        ->and($mesa->personas)->toBe($reserva->personas)
        ->and($mesa->user_id)->toBeNull();
});

test('al cobrar un pedido suelto, la mesa refleja su reserva activa', function () {
    $cajero = User::query()->where('usuario', 'cajero')->firstOrFail();
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($cajero);

    $mesa = crearMesaReservas($admin, '402');
    crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(65),
        Reserva::ESTADO_CONFIRMADA, 'Reserva del 402'
    );

    $mesa->update(['estado' => 'ocupada', 'cliente' => 'Cliente sin reserva']);

    $pedido = Pedido::query()->create([
        'team_id' => $admin->current_team_id,
        'user_id' => $admin->id,
        'mesa_id' => $mesa->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente sentado',
        'productos' => [],
        'total' => 30,
        'tipo' => 'salon',
        'estado' => 'entregado',
        'area' => 'cocina',
    ]);

    $this->actingAs($cajero)->patch(route('pedidos.cobrar', $pedido), [
        'metodo_pago' => 'efectivo',
    ])->assertSessionHasNoErrors();

    $mesa->refresh();

    expect($mesa->estado)->toBe('reserva')
        ->and($mesa->cliente)->toBe('Reserva del 402');
});

test('liberar una mesa a mano con reserva en ventana la deja en reserva', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '403');
    crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(65),
        Reserva::ESTADO_CONFIRMADA, 'Reserva del 403'
    );

    $mesa->update(['estado' => 'ocupada', 'cliente' => 'Cliente sentado', 'personas' => 2]);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'estado' => 'libre',
    ])->assertSessionHasNoErrors();

    $mesa->refresh();

    expect($mesa->estado)->toBe('reserva')
        ->and($mesa->cliente)->toBe('Reserva del 403');
});

test('una reserva vencida pasa a no presentado y su adelanto se queda en caja sin egreso', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '404');

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Nunca llega',
        'fecha' => now()->toDateString(),
        'hora_inicio' => now()->subHours(3)->format('H:i'),
        'hora_fin' => now()->subHours(2)->format('H:i'),
        'personas' => 2,
        'adelanto' => 25,
    ])->assertSessionHasNoErrors();

    $reserva = Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail();

    expect($reserva->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and(MovimientoCaja::query()->count())->toBe(0);

    $this->actingAs($admin)->get(route('mesas.index'))->assertOk();

    $reserva->refresh();

    // El dinero no se mueve ni deja asiento: el adelanto sigue contado en la
    // línea de la caja (ahora como retenido) y caja decide si devolverlo.
    expect($reserva->estado)->toBe(Reserva::ESTADO_NO_PRESENTADO)
        ->and($reserva->adelanto_pagado)->toEqual(25)
        ->and($reserva->adelanto_estado)->toBe(Reserva::ADELANTO_RETENIDO)
        ->and(MovimientoCaja::query()->count())->toBe(0);
});

test('una reserva no presentada no bloquea reservar ese mismo horario', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '405');
    crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(65),
        Reserva::ESTADO_NO_PRESENTADO, 'Cliente viejo'
    );

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Cliente nuevo',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(5),
        'hora_fin' => horaFutura(65),
        'personas' => 2,
        'adelanto' => 30,
    ])->assertSessionHasNoErrors();

    expect(Reserva::query()->where('mesa_id', $mesa->id)->count())->toBe(2)
        ->and($mesa->fresh()->estado)->toBe('reserva')
        ->and($mesa->fresh()->cliente)->toBe('Cliente nuevo');
});

test('crear una reserva no pisa al cliente que ya está sentado en la mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '406');
    $mesa->update(['estado' => 'ocupada', 'cliente' => 'Cliente sentado', 'personas' => 5]);

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Reserva futura',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(5),
        'hora_fin' => horaFutura(65),
        'personas' => 2,
        'adelanto' => 25,
    ])->assertSessionHasNoErrors();

    $mesa->refresh();

    expect($mesa->estado)->toBe('ocupada')
        ->and($mesa->cliente)->toBe('Cliente sentado')
        ->and($mesa->personas)->toBe(5);
});

test('la sincronizacion devuelve las mesas que cambiaron en ambos sentidos', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    // Entra en la ventana: libre -> reserva.
    $mesaEntrada = crearMesaReservas($admin, '407');
    crearReservaHoy($admin, $mesaEntrada, horaFutura(5), horaFutura(65));

    // Se venció la ventana: reserva -> libre.
    $mesaSalida = crearMesaReservas($admin, '408');
    $mesaSalida->update(['estado' => 'reserva', 'cliente' => 'Huérfana']);

    $cambiadas = Reserva::sincronizarMesasEnReserva();

    expect(collect($cambiadas)->pluck('numero')->all())
        ->toContain($mesaEntrada->numero)
        ->toContain($mesaSalida->numero)
        ->and($mesaEntrada->fresh()->estado)->toBe('reserva')
        ->and($mesaSalida->fresh()->estado)->toBe('libre');
});

test('al elegir la reserva activa se ignoran las vencidas y gana la mas temprana', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    $mesa = crearMesaReservas($admin, '409');

    // Vencida hace horas y todavía no pasó por el chequeo de expiración.
    crearReservaHoy(
        $admin, $mesa,
        now()->subHours(3)->format('H:i'),
        now()->subHours(2)->format('H:i'),
        Reserva::ESTADO_CONFIRMADA,
        'Vencida'
    );
    $enVentana = crearReservaHoy(
        $admin, $mesa, horaFutura(3), horaFutura(30),
        Reserva::ESTADO_CONFIRMADA, 'En ventana'
    );

    expect(Reserva::activaDeMesa($mesa->id)?->id)->toBe($enVentana->id);

    // Dos en ventana a la vez: gana la de hora_inicio más temprana.
    crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(60),
        Reserva::ESTADO_CONFIRMADA, 'Mas temprana'
    );

    expect(Reserva::activaDeMesa($mesa->id)?->id)->toBe($enVentana->id);
});

test('la tolerancia protege al cliente que llega tarde a su hora de fin', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '410');

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Llega tarde',
        'fecha' => now()->toDateString(),
        'hora_inicio' => now()->subHours(2)->format('H:i'),
        'hora_fin' => now()->subMinutes(5)->format('H:i'),
        'personas' => 2,
        'adelanto' => 25,
    ])->assertSessionHasNoErrors();

    Reserva::expirarVencidas();

    expect(Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail()->estado)
        ->toBe(Reserva::ESTADO_CONFIRMADA);

    // Pasada la tolerancia de 10 min sí se da por no presentado.
    Carbon::setTestNow(now()->addMinutes(10));

    Reserva::expirarVencidas();

    $reserva = Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail();

    expect($reserva->estado)->toBe(Reserva::ESTADO_NO_PRESENTADO)
        ->and($reserva->adelanto_estado)->toBe(Reserva::ADELANTO_RETENIDO);
});

test('ocupar una mesa libre no confirma la asistencia de su reserva', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();

    abrirCajaReservas($admin);

    $mesa = crearMesaReservas($admin, '411');
    $reserva = crearReservaHoy(
        $admin, $mesa, horaFutura(5), horaFutura(65),
        Reserva::ESTADO_CONFIRMADA, 'Reserva del 411'
    );

    expect($mesa->estado)->toBe('libre');

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'estado' => 'ocupada',
    ])->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and($reserva->fresh()->hora_llegada)->toBeNull()
        ->and($mesa->fresh()->estado)->toBe('ocupada');
});

test('el planificador expira reservas y sincroniza las mesas cada minuto', function () {
    $this->artisan('schedule:list')
        ->expectsOutputToContain('Expire overdue reservations and update reserved tables');
});
