<?php

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
            ->where('areaActiva', 'bar'));
});

test('kitchen users can only open the kitchen production station', function () {
    $kitchenUser = User::query()->where('usuario', 'cocinero')->firstOrFail();

    $this->actingAs($kitchenUser)
        ->get(route('produccion', ['area' => 'bar']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventario/produccion')
            ->where('areaActiva', 'cocina'));
});
