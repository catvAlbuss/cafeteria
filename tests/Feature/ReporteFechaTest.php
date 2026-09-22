<?php

use App\Models\Caja;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function reporteFechaUser(): User
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

test('la fecha de las ventas del día se muestra en hora local de Lima (UTC-5)', function () {
    $user = reporteFechaUser();

    $pedido = Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Venta Directa',
        'tipo' => 'llevar',
        'productos' => [
            ['id' => 1, 'nombre' => 'Cafe Americano', 'cantidad' => 1, 'precio' => 7.50, 'subtotal' => 7.50],
        ],
        'subtotal' => 7.50,
        'igv' => 1.35,
        'total' => 8.85,
        'estado' => 'pagado',
        'caja_id' => Caja::query()->where('estado', 'Abierta')->first()->id,
    ]);

    $pedido->created_at = Carbon::parse('2026-09-22 11:05:48', 'America/Lima');
    $pedido->updated_at = Carbon::parse('2026-09-22 11:05:48', 'America/Lima');
    $pedido->save();

    test()->actingAs($user)
        ->get(route('reportes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ventasDelDiaDetalle', fn ($detalle) => collect($detalle)->contains('fecha', '22/09/2026 11:05')));
});
