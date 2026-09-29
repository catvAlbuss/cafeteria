<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    abrirCajaReservas($admin);
});

afterEach(function () {
    Carbon::setTestNow();
});

function abrirCajaReservas(User $user): void
{
    Caja::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);
}

function crearMesaReservas(User $user, string $numero = '301'): Mesa
{
    return Mesa::query()->create([
        'team_id' => $user->current_team_id,
        'numero' => $numero,
        'capacidad' => 4,
        'sillas' => 4,
        'estado' => 'libre',
    ]);
}

function crearReservaHoy(
    User $user,
    Mesa $mesa,
    string $inicio,
    string $fin,
    string $estado = Reserva::ESTADO_CONFIRMADA,
    string $cliente = 'Cliente reserva',
): Reserva {
    return Reserva::query()->create([
        'team_id' => $user->current_team_id,
        'mesa_id' => $mesa->id,
        'fecha' => now()->toDateString(),
        'hora_inicio' => $inicio,
        'hora_fin' => $fin,
        'cliente' => $cliente,
        'personas' => 3,
        'estado' => $estado,
    ]);
}

function horaFutura(int $minutos): string
{
    return now()->addMinutes($minutos)->format('H:i');
}

test('una reserva dentro de la ventana deja la mesa en estado reserva', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Carlos Ruiz',
        'telefono' => '999888777',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(5),
        'hora_fin' => horaFutura(65),
        'personas' => 3,
    ])->assertSessionHasNoErrors();

    $reserva = Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail();

    expect($reserva->cliente)->toBe('Carlos Ruiz')
        ->and($reserva->estado)->toBe(Reserva::ESTADO_CONFIRMADA)
        ->and($mesa->fresh()->estado)->toBe('reserva')
        ->and($mesa->fresh()->cliente)->toBe('Carlos Ruiz')
        ->and($mesa->fresh()->personas)->toBe(3);
});

test('una reserva lejana no bloquea la mesa y esta se sigue usando normal', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Reserva de tarde',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(120),
        'hora_fin' => horaFutura(180),
        'personas' => 4,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->estado)->toBe('libre')
        ->and($mesa->fresh()->cliente)->toBeNull();

    Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail()->fresh();
});

test('la sincronización bloquea la mesa solo al entrar en la ventana', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    $reserva = crearReservaHoy($admin, $mesa, horaFutura(120), horaFutura(180));

    // Aún lejos: la mesa debe permanecer libre.
    Reserva::sincronizarMesasEnReserva();

    expect($mesa->fresh()->estado)->toBe('libre');

    // Avanzamos el reloj hasta dentro de la ventana (+5 min antes del inicio).
    Carbon::setTestNow(now()->addMinutes(115));

    Reserva::sincronizarMesasEnReserva();

    $mesa = $mesa->fresh();

    expect($mesa->estado)->toBe('reserva')
        ->and($mesa->cliente)->toBe($reserva->cliente)
        ->and($mesa->personas)->toBe($reserva->personas);

    Carbon::setTestNow();
});

test('no se permite sobreponer reservas en la misma mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    crearReservaHoy($admin, $mesa, horaFutura(120), horaFutura(180));

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Ana Torres',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(90),
        'hora_fin' => horaFutura(170),
        'personas' => 2,
    ])->assertSessionHasErrors('reserva');

    expect(Reserva::query()->where('mesa_id', $mesa->id)->count())->toBe(1);
});

test('el margen de minutos también bloquea reservas contiguas', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    // 15:00 - 16:00 (relativo al ahora).
    crearReservaHoy($admin, $mesa, horaFutura(120), horaFutura(180));

    // Termina justo cuando empieza la otra: el margen de 15 min sigue
    // generando conflicto.
    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Otro cliente',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(180),
        'hora_fin' => horaFutura(240),
        'personas' => 2,
    ])->assertSessionHasErrors('reserva');

    // Sin solape real y con más de 15 min de separación: se acepta.
    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Zoe',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(220),
        'hora_fin' => horaFutura(280),
        'personas' => 2,
    ])->assertSessionHasNoErrors();

    expect(Reserva::query()->where('mesa_id', $mesa->id)->count())->toBe(2);
});

test('un mesero no puede crear ni liberar reservas', function () {
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaReservas($mesero);

    $this->actingAs($mesero)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Intento',
        'fecha' => now()->toDateString(),
        'hora_inicio' => horaFutura(5),
        'hora_fin' => horaFutura(65),
        'personas' => 2,
    ])->assertForbidden();

    crearReservaHoy($mesero, $mesa, horaFutura(5), horaFutura(65));

    $this->actingAs($mesero)->patch(route('mesas.reservas.cancelar', $mesa), [
        'motivo' => 'test',
    ])->assertForbidden();

    expect(Reserva::query()->where('mesa_id', $mesa->id)->firstOrFail()->estado)
        ->toBe(Reserva::ESTADO_CONFIRMADA);
});

test('liberar la reserva cancela (no borra) y deja la mesa libre', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    $reserva = crearReservaHoy($admin, $mesa, horaFutura(5), horaFutura(65));

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $reserva->cliente,
        'personas' => $reserva->personas,
    ]);

    $this->actingAs($admin)->patch(route('mesas.reservas.cancelar', $mesa), [
        'motivo' => 'El cliente no llegó',
    ])->assertSessionHasNoErrors();

    $actualizada = $reserva->fresh();

    expect($actualizada->estado)->toBe(Reserva::ESTADO_CANCELADA)
        ->and($actualizada->motivo_cancelacion)->toBe('El cliente no llegó')
        ->and($actualizada->cancelada_por)->toBe($admin->id)
        ->and($actualizada->fecha_cancelacion)->not->toBeNull()
        ->and($mesa->fresh()->estado)->toBe('libre')
        ->and($mesa->fresh()->cliente)->toBeNull();
});

test('al liberar la activa, la mesa vuelve a reserva cuando la próxima entra en ventana', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    $activa = crearReservaHoy($admin, $mesa, horaFutura(5), horaFutura(65), cliente: 'Primera');
    crearReservaHoy($admin, $mesa, horaFutura(120), horaFutura(180), cliente: 'Segunda');

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $activa->cliente,
        'personas' => $activa->personas,
    ]);

    $this->actingAs($admin)->patch(route('mesas.reservas.cancelar', $mesa))
        ->assertSessionHasNoErrors();

    // La segunda aún está lejos: la mesa queda libre hasta su ventana.
    expect($mesa->fresh()->estado)->toBe('libre');

    // Dentro de la ventana de la segunda, la mesa vuelve a "reserva".
    Carbon::setTestNow(now()->addMinutes(115));

    Reserva::sincronizarMesasEnReserva();

    expect($mesa->fresh()->estado)->toBe('reserva')
        ->and($mesa->fresh()->cliente)->toBe('Segunda');
});

test('al ocupar una mesa reservada, la reserva activa pasa a atendida', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    $reserva = crearReservaHoy($admin, $mesa, horaFutura(5), horaFutura(65));

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $reserva->cliente,
        'personas' => $reserva->personas,
    ]);

    $this->actingAs($admin)->patch(route('mesas.update', $mesa), [
        'estado' => 'ocupada',
    ])->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_ATENDIDA)
        ->and($reserva->fresh()->hora_llegada)->not->toBeNull()
        ->and($mesa->fresh()->estado)->toBe('ocupada');
});

test('al registrar un pedido en una mesa reservada, la reserva pasa a atendida', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesero = User::query()->where('usuario', 'mesero')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    $reserva = crearReservaHoy($admin, $mesa, horaFutura(5), horaFutura(65));

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $reserva->cliente,
        'personas' => $reserva->personas,
    ]);

    $this->actingAs($mesero)->post(route('pedidos.store'), [
        'mesa_id' => $mesa->id,
        'productos' => [
            [
                'nombre' => 'Cafe',
                'cantidad' => 1,
                'precio' => 15,
                'subtotal' => 15,
            ],
        ],
        'total' => 15,
        'tipo' => 'salon',
    ])->assertSessionHasNoErrors();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_ATENDIDA)
        ->and($reserva->fresh()->hora_llegada)->not->toBeNull();
});

test('las reservas vencidas se expiran de forma lazy y liberan la mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    $inicio = now()->subHours(2)->format('H:i');
    $fin = now()->subHour()->format('H:i');

    $reserva = crearReservaHoy($admin, $mesa, $inicio, $fin);

    $mesa->update([
        'estado' => 'reserva',
        'cliente' => $reserva->cliente,
        'personas' => $reserva->personas,
    ]);

    $this->actingAs($admin)->get(route('mesas.index'))->assertOk();

    expect($reserva->fresh()->estado)->toBe(Reserva::ESTADO_EXPIRADA)
        ->and($mesa->fresh()->estado)->toBe('libre')
        ->and($mesa->fresh()->cliente)->toBeNull();
});

test('una mesa con historial de reservas no puede eliminarse', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);
    crearReservaHoy($admin, $mesa, horaFutura(5), horaFutura(65));

    $this->actingAs($admin)->delete(route('mesas.destroy', $mesa))
        ->assertSessionHasErrors('mesa');

    expect(Mesa::query()->where('id', $mesa->id)->exists())->toBeTrue();
});

test('una reserva para otro día no cambia el estado operativo de la mesa', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $mesa = crearMesaReservas($admin);

    $this->actingAs($admin)->post(route('mesas.reservas.store', $mesa), [
        'cliente' => 'Mañana',
        'fecha' => now()->addDay()->toDateString(),
        'hora_inicio' => '19:00',
        'hora_fin' => '20:00',
        'personas' => 4,
    ])->assertSessionHasNoErrors();

    expect($mesa->fresh()->estado)->toBe('libre')
        ->and($mesa->fresh()->cliente)->toBeNull();
});
