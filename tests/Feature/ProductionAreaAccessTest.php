<?php

use App\Models\Insumo;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('bar users can only open the bar production station', function () {
    $barUser = User::query()->where('usuario', 'bar')->firstOrFail();

    $this->actingAs($barUser)
        ->get(route('produccion', ['area' => 'cocina']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventario/produccion')
            ->where('areaActiva', 'bar')
            ->missing('resumenProduccion'));
});

test('kitchen users can only open the kitchen production station', function () {
    $kitchenUser = User::query()->where('usuario', 'cocinero')->firstOrFail();

    $this->actingAs($kitchenUser)
        ->get(route('produccion', ['area' => 'bar']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventario/produccion')
            ->where('areaActiva', 'cocina')
            ->missing('resumenProduccion'));
});

test('kitchen and bar users receive their operational summary on home', function (string $username, string $area) {
    $user = User::query()->where('usuario', $username)->firstOrFail();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('productionArea', $area)
            ->has('productionSummary.platosHoy')
            ->has('productionSummary.porArea')
            ->has('productionSummary.stockEscaso')
            ->where('teams', []));
})->with([
    ['cocinero', 'cocina'],
    ['bar', 'bar'],
]);

test('kitchen and bar users cannot manage or switch teams', function (string $username) {
    $user = User::query()->where('usuario', $username)->firstOrFail();

    $this->actingAs($user)
        ->get(route('teams.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('teams.switch', $user->currentTeam))
        ->assertForbidden();
})->with(['cocinero', 'bar']);

test('management keeps the administrative home dashboard', function () {
    $manager = User::query()->where('usuario', 'admin')->firstOrFail();

    $this->actingAs($manager)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('productionArea', null)
            ->where('productionSummary', null)
            ->has('teams'));
});

test('cashiers receive a role specific home dashboard', function () {
    $cashier = User::query()->where('usuario', 'cajero')->firstOrFail();

    $this->actingAs($cashier)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('productionArea', null)
            ->where('productionSummary', null)
            ->has('cashierSummary.salesToday')
            ->has('cashierSummary.transactionsToday')
            ->has('cashierSummary.readyToCharge')
            ->has('cashierSummary.activeTables')
            ->has('cashierSummary.openRegister'));
});

test('waiters receive a personal dashboard scoped to their own sales and tables', function () {
    $waiter = User::query()->where('usuario', 'mesero')->firstOrFail();
    $otherWaiter = User::query()->where('usuario', 'mesera.ana')->firstOrFail();
    $table = Mesa::query()->firstOrFail();
    $table->update(['user_id' => $waiter->id, 'estado' => 'ocupada', 'cliente' => 'Cliente frecuente']);

    Pedido::query()->create([
        'team_id' => $waiter->current_team_id,
        'user_id' => $waiter->id,
        'mesa_id' => $table->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Cliente frecuente',
        'productos' => [['nombre' => 'Café americano', 'categoria' => 'Bebidas', 'cantidad' => 3, 'precio' => 7, 'subtotal' => 21]],
        'total' => 21,
        'estado' => 'pagado',
        'area' => 'bar',
        'hora_pedido' => now(),
    ]);
    Pedido::query()->create([
        'team_id' => $otherWaiter->current_team_id,
        'user_id' => $otherWaiter->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'No debe aparecer',
        'productos' => [['nombre' => 'Producto ajeno', 'categoria' => 'Bebidas', 'cantidad' => 99, 'precio' => 10, 'subtotal' => 990]],
        'total' => 990,
        'estado' => 'pagado',
        'area' => 'bar',
        'hora_pedido' => now(),
    ]);

    $this->actingAs($waiter)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('waiterSummary.salesToday', 21)
            ->where('waiterSummary.ordersToday', 1)
            ->where('waiterSummary.activeTables', 1)
            ->where('waiterSummary.topProducts.0.name', 'Café americano')
            ->where('waiterSummary.topProducts.0.quantity', 3)
            ->where('waiterSummary.topCategories.0.name', 'Bebidas')
            ->where('waiterSummary.mostFrequentTable.numero', $table->numero)
            ->where('waiterSummary.topCustomer.name', 'Cliente frecuente')
            ->where('cashierSummary', null)
            ->where('productionSummary', null));
});

test('operational inventory is isolated by area without exposing the area label', function (string $username, string $visibleArea, string $hiddenArea) {
    $user = User::query()->where('usuario', $username)->firstOrFail();

    Insumo::create([
        'team_id' => $user->current_team_id,
        'nombre' => "Visible {$visibleArea}",
        'categoria' => 'Prueba',
        'area' => $visibleArea,
        'unidad' => 'kg',
        'stock' => 8,
        'stock_minimo' => 2,
        'precio' => 1,
        'activo' => true,
    ]);

    Insumo::create([
        'team_id' => $user->current_team_id,
        'nombre' => "Oculto {$hiddenArea}",
        'categoria' => 'Prueba',
        'area' => $hiddenArea,
        'unidad' => 'kg',
        'stock' => 8,
        'stock_minimo' => 2,
        'precio' => 1,
        'activo' => true,
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('productionSummary.inventario', 1)
            ->where('productionSummary.inventario.0.nombre', "Visible {$visibleArea}")
            ->missing('productionSummary.inventario.0.area'));

    $this->actingAs($user)
        ->get(route('insumos.operativo'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventario/operativo')
            ->has('insumos', 1)
            ->where('insumos.0.nombre', "Visible {$visibleArea}")
            ->missing('insumos.0.area'));
})->with([
    ['cocinero', 'cocina', 'bar'],
    ['bar', 'bar', 'cocina'],
]);

test('the operational inventory page rejects non kitchen roles', function () {
    $manager = User::query()->where('usuario', 'admin')->firstOrFail();

    $this->actingAs($manager)
        ->get(route('insumos.operativo'))
        ->assertForbidden();
});
