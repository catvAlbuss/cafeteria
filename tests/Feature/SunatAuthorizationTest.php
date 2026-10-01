<?php

use App\Models\Team;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function sunatActor(string $usuario): User
{
    $user = User::query()->where('usuario', $usuario)->firstOrFail();
    $team = Team::query()->findOrFail($user->current_team_id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    return $user;
}

test('un mesero no puede generar comprobantes por la ruta directa de facturacion', function () {
    test()->actingAs(sunatActor('mesero'))
        ->withHeaders(['Accept' => 'application/json'])
        ->postJson(route('factura.generar'), [
            'tipo_documento' => '01',
            'client' => ['ruc' => '20601234567', 'razon_social' => 'Cliente SAC'],
            'vendedor' => ['nombre' => 'Cafetería'],
            'items' => [],
        ])
        ->assertForbidden();
});

test('un mesero no puede emitir el comprobante de un cobro de pedido', function () {
    test()->actingAs(sunatActor('mesero'))
        ->withHeaders(['Accept' => 'application/json'])
        ->postJson(route('pedidos.emitir-comprobante'), [
            'pedido_ids' => [1],
            'tipo_documento' => '03',
            'metodo_pago' => 'efectivo',
            'authorization_pin' => '1234',
        ])
        ->assertForbidden();
});

test('un cajero supera la autorizacion y la peticion llega al dominio', function () {
    test()->actingAs(sunatActor('cajero'))
        ->withHeaders(['Accept' => 'application/json'])
        ->postJson(route('factura.generar'), [
            'tipo_documento' => '01',
            'client' => ['ruc' => '20601234567', 'razon_social' => 'Cliente SAC'],
            'vendedor' => ['nombre' => 'Cafetería'],
            'items' => [],
        ])
        ->assertStatus(422);
});

test('las rutas de emision sunat exigen el middleware sunat.auth', function () {
    $acciones = [
        'factura.generar',
        'pedidos.emitir-comprobante',
        'sunat.resumen.enviar',
        'sunat.resumen.consultar',
    ];

    foreach ($acciones as $nombre) {
        $ruta = Route::getRoutes()->getByName($nombre);

        $this->assertNotNull($ruta, "No existe la ruta {$nombre}");
        $this->assertContains(
            'sunat.auth',
            $ruta->gatherMiddleware(),
            "La ruta {$nombre} no exige el permiso procesar pagos"
        );
    }
});
