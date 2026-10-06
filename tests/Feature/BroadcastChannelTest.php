<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Broadcast;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function canalDeReservas(): mixed
{
    $canales = Broadcast::connection(config('broadcasting.default'))
        ->getChannels();

    return $canales['sede.{teamId}.reservas'] ?? null;
}

test('el canal de reservas está declarado en el broadcaster', function () {
    expect(canalDeReservas())->not->toBeNull()
        ->and(canalDeReservas())->toBeCallable();
});

test('un miembro de la sede puede suscribirse al canal de reservas', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $autorizado = canalDeReservas();

    expect($autorizado($admin, (int) $admin->current_team_id))->toBeTrue();
});

test('una sede distinta no puede suscribirse al canal de reservas', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $autorizado = canalDeReservas();

    expect($autorizado($admin, (int) $admin->current_team_id + 1000))
        ->toBeFalse();
});
