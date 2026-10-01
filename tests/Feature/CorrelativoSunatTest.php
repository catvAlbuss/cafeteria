<?php

use App\Http\Controllers\FacturaController;
use App\Models\Factura;
use App\Services\CorrelativoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    config([
        'sunat.url' => 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        'sunat.ruc' => '20000000001',
        'sunat.usuario_sol' => 'dummy',
        'sunat.clave_sol' => 'dummy',
    ]);
});

function reservarCorrelativo(FacturaController $controller, string $serie): Factura
{
    $method = new ReflectionMethod(FacturaController::class, 'reservarCorrelativoYCrearFactura');
    $method->setAccessible(true);

    return $method->invoke($controller, $serie, Request::create('/', 'POST', [
        'vendedor' => ['nombre' => 'Juan'],
    ]));
}

test('la primera factura de una serie arranca en el correlativo 1', function () {
    $factura = reservarCorrelativo(app(FacturaController::class), 'B001');

    expect($factura->serie)->toBe('B001')
        ->and($factura->correlativo)->toBe(1)
        ->and($factura->estado_sunat)->toBe('procesando')
        ->and($factura->exists)->toBeTrue();
});

test('el correlativo continúa desde el máximo existente cuando no hay fila de control', function () {
    Factura::create([
        'serie' => 'B001',
        'correlativo' => 5,
        'vendedor' => 'Cajero',
        'fecha_emitido' => now(),
        'montototal' => 0,
        'Cliente' => 'Venta Directa',
        'documento' => '00000000',
        'estado_sunat' => 'aceptado',
    ]);

    $factura = reservarCorrelativo(app(FacturaController::class), 'B001');

    expect($factura->correlativo)->toBe(6)
        ->and(DB::table('correlativos_control')->where('serie', 'B001')->value('ultimo_correlativo'))->toBe(6);
});

test('la siguiente factura incrementa el correlativo ya controlado', function () {
    $primera = reservarCorrelativo(app(FacturaController::class), 'B001');
    $segunda = reservarCorrelativo(app(FacturaController::class), 'B001');

    expect($primera->correlativo)->toBe(1)
        ->and($segunda->correlativo)->toBe(2);
});

test('la tabla facturas tiene las columnas del flujo SUNAT', function () {
    expect(Schema::hasColumn('facturas', 'Cliente'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'estado_sunat'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'error_sunat'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'codigo_sunat'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'team_id'))->toBeTrue();
});

test('el control de correlativos queda asociado al RUC configurado', function () {
    $factura = reservarCorrelativo(app(FacturaController::class), 'B001');

    $control = DB::table('correlativos_control')->where('serie', 'B001')->first();

    expect($control->ruc)->toBe('20000000001')
        ->and((int) $control->ultimo_correlativo)->toBe($factura->correlativo)
        ->and($control->estado)->toBe('procesando');
});

test('dos emisores distintos mantienen series independientes', function () {
    $servicio = app(CorrelativoService::class);

    expect($servicio->siguiente('B001'))->toBe(1);

    config(['sunat.ruc' => '20601030013']);

    // El RUC nuevo no debe heredar el correlativo del RUC anterior.
    expect($servicio->siguiente('B001'))->toBe(1)
        ->and(DB::table('correlativos_control')->where('ruc', '20000000001')->value('ultimo_correlativo'))->toBe(1)
        ->and(DB::table('correlativos_control')->where('ruc', '20601030013')->value('ultimo_correlativo'))->toBe(1);
});

test('registrarEstado deja documentado por que se consumio el numero', function () {
    $servicio = app(CorrelativoService::class);
    $servicio->siguiente('B001');

    $servicio->registrarEstado('B001', 'rechazado', '20000000001-03-B001-1');

    $control = DB::table('correlativos_control')->where('serie', 'B001')->first();

    expect($control->estado)->toBe('rechazado')
        ->and($control->documento)->toBe('20000000001-03-B001-1');
});

test('un correlativo rechazado no se reutiliza', function () {
    $servicio = app(CorrelativoService::class);

    $primero = $servicio->siguiente('B001');
    $servicio->registrarEstado('B001', 'rechazado', '20000000001-03-B001-'.$primero);

    // Aunque SUNAT lo rechazo, el numero queda quemado a proposito.
    expect($servicio->siguiente('B001'))->toBe($primero + 1)
        ->and($servicio->proximo('B001'))->toBe($primero + 2);
});

test('proximo consulta sin reservar', function () {
    $servicio = app(CorrelativoService::class);

    expect($servicio->proximo('B001'))->toBe(1);

    $servicio->siguiente('B001');

    expect($servicio->proximo('B001'))->toBe(2);

    // Consultar no debe quemar el numero.
    expect($servicio->proximo('B001'))->toBe(2)
        ->and($servicio->siguiente('B001'))->toBe(2);
});
