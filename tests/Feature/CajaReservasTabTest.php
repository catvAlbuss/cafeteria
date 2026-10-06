<?php

use App\Models\Caja;
use App\Models\Reserva;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);

    $this->admin = User::query()->where('usuario', 'admin')->firstOrFail();
    abrirCajaReservas($this->admin);
    $this->caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();
});

test('la pestaña de reservas de caja recibe las reservas de hoy con su adelanto y llegada', function () {
    $mesa = crearMesaReservas($this->admin);
    $reserva = crearReservaHoy($this->admin, $mesa, horaFutura(5), horaFutura(65));

    $reserva->update([
        'estado' => Reserva::ESTADO_ATENDIDA,
        'hora_llegada' => '12:30',
        'adelanto_pagado' => 20,
        'adelanto_caja_id' => $this->caja->id,
        'adelanto_estado' => Reserva::ADELANTO_PAGADO,
    ]);

    $props = $this->actingAs($this->admin)
        ->get(route('caja'))
        ->assertOk()
        ->viewData('page')['props'];

    $guardada = collect($props['reservas'])->firstWhere('id', $reserva->id);

    expect($props['hoy'])->toBe(now()->toDateString())
        ->and($guardada['fecha'])->toBe(now()->toDateString())
        ->and($guardada['hora_llegada'])->toBe('12:30')
        ->and($guardada['adelanto_caja_id'])->toBe($this->caja->id)
        ->and($guardada['adelanto_estado'])->toBe(Reserva::ADELANTO_PAGADO);
});

test('la pestaña de reservas de caja lista los meseros de la sede sin incluir al cajero', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();

    $props = $this->actingAs($this->admin)
        ->get(route('caja'))
        ->assertOk()
        ->viewData('page')['props'];

    $ids = array_column($props['meseros'], 'id');

    expect($ids)->toContain($mesero->id)
        ->and($ids)->not->toContain($this->admin->id);
});

test('una reserva de mañana no entra a la pestaña de reservas de caja', function () {
    $mesa = crearMesaReservas($this->admin);

    $manana = Reserva::query()->create([
        'team_id' => $this->admin->current_team_id,
        'mesa_id' => $mesa->id,
        'fecha' => now()->addDay()->toDateString(),
        'hora_inicio' => '19:00',
        'hora_fin' => '20:00',
        'cliente' => 'De mañana',
        'personas' => 2,
        'estado' => Reserva::ESTADO_CONFIRMADA,
    ]);

    $props = $this->actingAs($this->admin)
        ->get(route('caja'))
        ->assertOk()
        ->viewData('page')['props'];

    expect(collect($props['reservas'])->pluck('id'))->not->toContain($manana->id);
});
