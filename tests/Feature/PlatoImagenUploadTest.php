<?php

use App\Models\Caja;
use App\Models\Plato;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    Storage::fake('public');

    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    Caja::create([
        'team_id' => $admin->current_team_id,
        'caja' => 'Caja 01',
        'empleado' => $admin->name,
        'turno' => 'Mañana',
        'monto_inicial' => 100,
        'estado' => 'Abierta',
    ]);
});

test('uploading a plato image stores a resized file instead of base64 in the column', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $file = UploadedFile::fake()->image('foto.jpg', 2000, 2000)->size(1800);

    $response = $this->actingAs($admin)->post('/platos', [
        'nombre' => 'Plato de prueba',
        'categoria' => 'Bebidas',
        'descripcion' => 'Prueba',
        'precio' => 10,
        'stock' => 5,
        'imagen' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $plato = Plato::withoutGlobalScopes()->where('nombre', 'Plato de prueba')->firstOrFail();

    expect($plato->imagen)
        ->toStartWith('/storage/platos/')
        ->toEndWith('.webp')
        ->and(strlen($plato->imagen))->toBeLessThan(255);

    Storage::disk('public')->assertExists(str_replace('/storage/', '', $plato->imagen));
});

test('updating a plato without a new image keeps the existing one', function () {
    $admin = User::query()->where('usuario', 'admin')->firstOrFail();
    $plato = Plato::withoutGlobalScopes()->firstOrFail();
    $imagenOriginal = $plato->imagen;

    $response = $this->actingAs($admin)->post("/platos/{$plato->id}", [
        '_method' => 'put',
        'nombre' => $plato->nombre,
        'categoria' => $plato->categoria,
        'descripcion' => $plato->descripcion,
        'precio' => $plato->precio,
        'stock' => $plato->stock,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    expect($plato->fresh()->imagen)->toBe($imagenOriginal);
});
