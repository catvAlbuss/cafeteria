<?php

use App\Models\Caja;
use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\Team;
use App\Models\User;
use App\Services\ClienteService;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function clienteModuleUser(): User
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
    ]);

    return $user;
}

function crearPedidoDeCliente(
    User $user,
    int $teamId,
    string $documento,
    int $diasAtras = 0,
    float|int $total = 10,
    string $nombre = 'CLIENTES VARIOS'
): Pedido {
    $pedido = Pedido::query()->create([
        'team_id' => $teamId,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => $nombre,
        'tipo_documento' => '03',
        'documento_cliente' => $documento,
        'nombre_cliente' => $nombre,
        'productos' => [],
        'total' => $total,
        'estado' => 'pagado',
    ]);

    $pedido->created_at = now()->subDays($diasAtras);
    $pedido->save();

    return $pedido;
}

test('el servicio registra automaticamente al cliente al alcanzar el umbral por defecto', function () {
    $user = clienteModuleUser();
    $service = app(ClienteService::class);

    foreach (range(1, 5) as $i) {
        crearPedidoDeCliente($user, $user->current_team_id, '71234567');
        expect($service->sincronizarDesdeVenta($user->current_team_id, '03', '71234567', 'Juan Perez'))->toBeNull();
    }

    expect(Cliente::count())->toBe(0);

    crearPedidoDeCliente($user, $user->current_team_id, '71234567');
    $cliente = $service->sincronizarDesdeVenta($user->current_team_id, '03', '71234567', 'Juan Perez');

    expect($cliente)->not->toBeNull()
        ->and($cliente->nombre)->toBe('Juan Perez')
        ->and($cliente->documento)->toBe('71234567')
        ->and($cliente->pedidos_total)->toBe(6)
        ->and($cliente->pedidos_30d)->toBe(6)
        ->and($cliente->estado)->toBe(Cliente::ESTADO_ACTIVO);
});

test('el equipo puede configurar el umbral de registro automatico', function () {
    $user = clienteModuleUser();
    $teamId = $user->current_team_id;
    Team::find($teamId)->update(['clientes_min_compras' => 10]);

    $service = app(ClienteService::class);

    foreach (range(1, 9) as $i) {
        crearPedidoDeCliente($user, $teamId, '88888888');
        expect($service->sincronizarDesdeVenta($teamId, '03', '88888888', 'Pedro'))->toBeNull();
    }

    crearPedidoDeCliente($user, $teamId, '88888888');
    expect($service->sincronizarDesdeVenta($teamId, '03', '88888888', 'Pedro'))->not->toBeNull();
});

test('las sincronizaciones repetidas no duplican clientes', function () {
    $user = clienteModuleUser();
    $service = app(ClienteService::class);

    foreach (range(1, 8) as $i) {
        crearPedidoDeCliente($user, $user->current_team_id, '77777777');
        $service->sincronizarDesdeVenta($user->current_team_id, '03', '77777777', 'Ana');
    }

    expect(Cliente::count())->toBe(1);
});

test('el estado y las estadisticas se calculan con las compras de los ultimos 30 dias', function () {
    $user = clienteModuleUser();
    $service = app(ClienteService::class);

    foreach (range(1, 5) as $i) {
        crearPedidoDeCliente($user, $user->current_team_id, '99999999', 0, 20);
    }
    foreach (range(1, 11) as $i) {
        crearPedidoDeCliente($user, $user->current_team_id, '99999999', 60, 5);
    }

    $cliente = $service->sincronizarDesdeVenta($user->current_team_id, '03', '99999999', 'Maria');

    expect($cliente->pedidos_total)->toBe(16)
        ->and($cliente->pedidos_30d)->toBe(5)
        ->and((float) $cliente->total_gastado_30d)->toBe(100.0)
        ->and($cliente->estado)->toBe(Cliente::ESTADO_ACTIVO);

    Cliente::find($cliente->id)->update(['pedidos_30d' => 0]);
    expect(Cliente::calcularEstado(0))->toBe(Cliente::ESTADO_INACTIVO);
    expect(Cliente::calcularEstado(16))->toBe(Cliente::ESTADO_VIP);
});

test('una venta anonima, documento corto o todo ceros no crea clientes', function () {
    $user = clienteModuleUser();
    $service = app(ClienteService::class);

    crearPedidoDeCliente($user, $user->current_team_id, '00000000', 0, 10, 'CLIENTES VARIOS');
    expect($service->sincronizarDesdeVenta($user->current_team_id, '03', '00000000', 'CLIENTES VARIOS'))->toBeNull();

    crearPedidoDeCliente($user, $user->current_team_id, '123');
    expect($service->sincronizarDesdeVenta($user->current_team_id, '03', '123'))->toBeNull();

    Pedido::query()->create([
        'team_id' => $user->current_team_id,
        'user_id' => $user->id,
        'numero' => Pedido::generarNumero(),
        'cliente' => 'Empresa',
        'tipo_documento' => '01',
        'documento_cliente' => '00000000000',
        'nombre_cliente' => 'CLIENTES VARIOS',
        'productos' => [],
        'total' => 50,
        'estado' => 'pagado',
    ]);
    expect($service->sincronizarDesdeVenta($user->current_team_id, '01', '00000000000'))->toBeNull();

    expect(Cliente::count())->toBe(0);
});

test('el cliente sin nombre se registra con nombre generico y conserva el nombre real posterior', function () {
    $user = clienteModuleUser();
    $service = app(ClienteService::class);

    foreach (range(1, 6) as $i) {
        crearPedidoDeCliente($user, $user->current_team_id, '70000001');
    }

    $cliente = $service->sincronizarDesdeVenta($user->current_team_id, '03', '70000001', null);
    expect($cliente)->not->toBeNull()
        ->and($cliente->nombre)->toBe('Cliente 70000001');

    $cliente = $service->sincronizarDesdeVenta($user->current_team_id, '03', '70000001', 'Rosa Gomez');
    expect($cliente->nombre)->toBe('Rosa Gomez');

    $cliente = $service->sincronizarDesdeVenta($user->current_team_id, '03', '70000001', '   ');
    expect($cliente->nombre)->toBe('Rosa Gomez');
});

test('el endpoint de busqueda devuelve el nombre del cliente registrado', function () {
    $user = clienteModuleUser();
    Cliente::factory()->create([
        'team_id' => $user->current_team_id,
        'tipo_documento' => 'dni',
        'documento' => '71234568',
        'nombre' => 'Juan Perez',
    ]);

    $this->actingAs($user)->getJson(route('clientes.buscar', [
        'tipo_documento' => 'dni',
        'documento' => '71234568',
    ]))->assertOk()->assertJson(['nombre' => 'Juan Perez']);

    $this->actingAs($user)->getJson(route('clientes.buscar', [
        'tipo_documento' => 'dni',
        'documento' => '99999999',
    ]))->assertOk()->assertJson(['nombre' => null]);
});

test('el listado de clientes entrega estadisticas y configuracion', function () {
    $user = clienteModuleUser();
    Cliente::factory()->vip()->create(['team_id' => $user->current_team_id]);
    Cliente::factory()->create(['team_id' => $user->current_team_id]);

    $this->actingAs($user)->get(route('clientes'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('clientes/clientes')
            ->has('clientes', 2)
            ->where('estadisticas.total', 2)
            ->where('estadisticas.vip', 1)
            ->has('configuracion.minCompras'));
});

test('el crud de clientes crea, edita y elimina desde las rutas', function () {
    $user = clienteModuleUser();

    $this->actingAs($user)->post(route('clientes.store'), [
        'nombre' => 'Cliente CRUD',
        'tipo_documento' => 'dni',
        'documento' => '76543210',
        'telefono' => '987654321',
        'email' => 'crud@test.com',
        'estado' => 'activo',
    ])->assertSessionHasNoErrors();

    $cliente = Cliente::firstWhere('documento', '76543210');
    expect($cliente)->not->toBeNull();

    $this->actingAs($user)->patch(route('clientes.update', $cliente), [
        'nombre' => 'Cliente CRUD Editado',
        'tipo_documento' => 'dni',
        'documento' => '76543210',
    ])->assertSessionHasNoErrors();

    expect($cliente->refresh()->nombre)->toBe('Cliente CRUD Editado');

    $this->actingAs($user)->delete(route('clientes.destroy', $cliente));

    expect(Cliente::find($cliente->id))->toBeNull();
});

test('el crud rechaza un documento duplicado en la misma sede', function () {
    $user = clienteModuleUser();
    Cliente::factory()->create([
        'team_id' => $user->current_team_id,
        'tipo_documento' => 'dni',
        'documento' => '76543211',
    ]);

    $this->actingAs($user)->post(route('clientes.store'), [
        'nombre' => 'Duplicado',
        'tipo_documento' => 'dni',
        'documento' => '76543211',
    ])->assertSessionHasErrors('documento');
});

test('la configuracion del umbral se actualiza por equipo', function () {
    $user = clienteModuleUser();

    $this->actingAs($user)->patch(route('clientes.configuracion'), ['minCompras' => 12])
        ->assertSessionHasNoErrors();

    expect((int) Team::find($user->current_team_id)->refresh()->clientes_min_compras)->toBe(12);
});
