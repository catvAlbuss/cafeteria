<?php

use App\Enums\TeamRole;
use App\Events\CajaActualizada;
use App\Http\Middleware\EnsureOpenCashSession;
use App\Models\Caja;
use App\Models\Pedido;
use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

function cashSessionUser(Team $team): User
{
    $user = User::factory()->create(['current_team_id' => $team->id]);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    return $user;
}

test('an operational mutation is blocked until the venue opens its cash session', function () {
    $team = Team::factory()->create();
    $user = cashSessionUser($team);

    $this->actingAs($user)
        ->post(route('pedidos.store'), [])
        ->assertSessionHas('error', fn (string $message) => str_contains($message, 'sede está cerrada'));
});

test('a venue can only have one open cash session', function () {
    $team = Team::factory()->create();
    $user = cashSessionUser($team);

    $payload = ['caja' => 'Caja 01', 'turno' => 'Mañana', 'montoInicial' => 100];

    $this->actingAs($user)->post(route('contador.abrir'), $payload)
        ->assertRedirect(route('contador.index'))
        ->assertSessionHasNoErrors();
    $this->actingAs($user)->post(route('contador.abrir'), $payload)->assertSessionHasErrors('caja');

    expect(Caja::query()->where('estado', 'Abierta')->count())->toBe(1);
});

test('cashiers, venue administrators, and management can open the cash session', function (string $profile) {
    $team = Team::factory()->create();
    $teamRole = match ($profile) {
        'cashier' => TeamRole::Member,
        'administrator' => TeamRole::Admin,
        'management' => TeamRole::Member,
    };
    $user = User::factory()->create(['current_team_id' => $team->id]);
    $team->members()->attach($user, ['role' => $teamRole->value]);

    if (in_array($profile, ['cashier', 'management'], true)) {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
        $roleName = $profile === 'cashier' ? 'Cajero' : 'Gerente';
        Role::query()->create([
            'name' => $roleName,
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $user->assignRole($roleName);
    }

    $this->actingAs($user)->get(route('contador.index'))->assertOk();

    $response = $this->actingAs($user)->post(route('contador.abrir'), [
        'caja' => 'Caja 01',
        'turno' => 'Mañana',
        'montoInicial' => 100,
    ]);

    $response->assertRedirect(route('contador.index'))->assertSessionHasNoErrors();

    expect(Caja::query()->where('user_id', $user->id)->where('estado', 'Abierta')->exists())->toBeTrue();
})->with(['cashier', 'administrator', 'management']);

test('operational roles cannot view, open, or close the cash session', function (string $roleName) {
    $team = Team::factory()->create();
    $user = User::factory()->create(['current_team_id' => $team->id]);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    Role::query()->create([
        'name' => $roleName,
        'guard_name' => 'web',
        'team_id' => $team->id,
    ]);
    $user->assignRole($roleName);
    $cashSession = Caja::query()->create([
        'team_id' => $team->id,
        'user_id' => $user->id,
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);

    $this->actingAs($user)->get(route('contador.index'))->assertForbidden();
    $this->actingAs($user)->post(route('contador.abrir'), [
        'caja' => 'Caja 02',
        'turno' => 'Todo el día',
        'montoInicial' => 100,
    ])->assertForbidden();
    $this->actingAs($user)->post(route('contador.cerrar', $cashSession), [
        'montoFinal' => 100,
    ])->assertForbidden();

    expect($cashSession->fresh()->estado)->toBe('Abierta');
})->with(['Mesero', 'Cocinero', 'Bar', 'Supervisor']);

test('an all-day cash session opened by one employee unlocks the venue for the rest of the team', function () {
    $team = Team::factory()->create();
    $manager = cashSessionUser($team);
    $waiter = User::factory()->create(['current_team_id' => $team->id]);
    $team->members()->attach($waiter, ['role' => TeamRole::Member->value]);

    $this->actingAs($manager)->post(route('contador.abrir'), [
        'caja' => 'Caja Principal',
        'turno' => 'Todo el día',
        'montoInicial' => 100,
    ])->assertRedirect(route('contador.index'));

    $request = Request::create('/pedidos', 'POST');
    $request->setUserResolver(fn () => $waiter);
    $response = app(EnsureOpenCashSession::class)->handle($request, fn () => response('operación habilitada'));
    $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();
    $event = new CajaActualizada($caja);

    expect($response->isSuccessful())->toBeTrue()
        ->and($caja->turno)->toBe('Todo el día')
        ->and($event)->toBeInstanceOf(ShouldBroadcastNow::class)
        ->and($event)->toBeInstanceOf(ShouldRescue::class)
        ->and($event->broadcastWith())->toMatchArray([
            'id' => $caja->id,
            'estado' => 'Abierta',
            'turno' => 'Todo el día',
        ]);
});

test('cash reconciliation excludes card and yape payments and stores the blind count difference', function () {
    $team = Team::factory()->create();
    $user = cashSessionUser($team);
    $caja = Caja::query()->create([
        'team_id' => $team->id,
        'user_id' => $user->id,
        'caja' => 'Caja 01',
        'turno' => 'Mañana',
        'monto_inicial' => 100,
        'fecha_apertura' => now(),
        'estado' => 'Abierta',
    ]);

    foreach ([['efectivo', 50], ['tarjeta', 80], ['yape', 30]] as [$metodo, $total]) {
        Pedido::query()->create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'caja_id' => $caja->id,
            'numero' => Pedido::generarNumero(),
            'cliente' => 'Prueba',
            'productos' => [],
            'total' => $total,
            'metodo_pago' => $metodo,
            'tipo' => 'salon',
            'estado' => 'pagado',
            'area' => 'cocina',
        ]);
    }

    $this->actingAs($user)->post(route('contador.cerrar', $caja), [
        'montoFinal' => 145,
        'observaciones' => 'Faltante verificado',
    ])->assertSessionHasNoErrors();

    $caja->refresh();
    expect((float) $caja->efectivo_esperado)->toBe(150.0)
        ->and((float) $caja->diferencia_cierre)->toBe(-5.0)
        ->and((float) $caja->ventas_dia)->toBe(160.0)
        ->and((float) $caja->resumen_cierre['ventas_tarjeta'])->toBe(80.0)
        ->and((float) $caja->resumen_cierre['ventas_yape'])->toBe(30.0);
});

test('cash sessions are isolated by venue', function () {
    $firstTeam = Team::factory()->create();
    $secondTeam = Team::factory()->create();
    $firstUser = cashSessionUser($firstTeam);
    $secondUser = cashSessionUser($secondTeam);

    $this->actingAs($firstUser)->post(route('contador.abrir'), [
        'caja' => 'Caja 01', 'turno' => 'Mañana', 'montoInicial' => 100,
    ])->assertSessionHasNoErrors();

    $this->actingAs($secondUser)->post(route('contador.abrir'), [
        'caja' => 'Caja 01', 'turno' => 'Mañana', 'montoInicial' => 200,
    ])->assertSessionHasNoErrors();

    expect(Caja::withoutGlobalScopes()->where('estado', 'Abierta')->count())->toBe(2);
});
