<?php

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, it's "PHPUnit\Framework\TestCase". Of course, you may need to change
| the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you'll often need to check that your test meets
| certain conditions. Here you can also expose custom expectations as global
| functions to help you to reduce the number of lines of code in your test files.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| Here you can expose global helpers used by the reservation tests. Defining
| them here (instead of in a single test file) keeps them available to every
| test file without redeclaration errors.
|
*/

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
