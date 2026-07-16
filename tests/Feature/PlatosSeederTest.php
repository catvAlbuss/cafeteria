<?php

use App\Models\Plato;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PlatosSeeder;

test('platos seeder links every product to a public image', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(PlatosSeeder::class);

    $platos = Plato::withoutGlobalScopes()->get();

    expect($platos)->toHaveCount(12);

    $platos->each(function (Plato $plato): void {
        expect($plato->imagen)
            ->not->toBeNull()
            ->toStartWith('/img/productos/');

        expect(public_path(ltrim($plato->imagen, '/')))->toBeFile();
    });
});
