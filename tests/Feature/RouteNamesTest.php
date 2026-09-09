<?php

use Illuminate\Support\Facades\Route;

test('route names are unique so they can be cached', function () {
    $duplicateNames = collect(Route::getRoutes())
        ->map(fn ($route) => $route->getName())
        ->filter()
        ->duplicates()
        ->values();

    expect($duplicateNames)->toBeEmpty();
});
