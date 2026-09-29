<?php

use App\Http\Controllers\FacturaController;
use App\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

function reservarCorrelativo(FacturaController $controller, string $serie): Factura
{
    $method = new ReflectionMethod(FacturaController::class, 'reservarCorrelativoYCrearFactura');
    $method->setAccessible(true);

    return $method->invoke($controller, $serie, Request::create('/', 'POST', [
        'vendedor' => ['nombre' => 'Juan'],
    ]));
}

test('la primera factura de una serie arranca en el correlativo 1', function () {
    $factura = reservarCorrelativo(new FacturaController, 'B001');

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

    $factura = reservarCorrelativo(new FacturaController, 'B001');

    expect($factura->correlativo)->toBe(6)
        ->and(DB::table('correlativos_control')->where('serie', 'B001')->value('ultimo_correlativo'))->toBe(6);
});

test('la siguiente factura incrementa el correlativo ya controlado', function () {
    $primera = reservarCorrelativo(new FacturaController, 'B001');
    $segunda = reservarCorrelativo(new FacturaController, 'B001');

    expect($primera->correlativo)->toBe(1)
        ->and($segunda->correlativo)->toBe(2);
});

test('la tabla facturas tiene las columnas del flujo SUNAT', function () {
    expect(Schema::hasColumn('facturas', 'Cliente'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'estado_sunat'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'error_sunat'))->toBeTrue()
        ->and(Schema::hasColumn('facturas', 'codigo_sunat'))->toBeTrue();
});
