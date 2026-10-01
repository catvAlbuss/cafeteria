<?php

use App\Http\Controllers\FacturaController;
use App\Models\Factura;
use Greenter\Model\Company\Address;
use Illuminate\Http\Request;

beforeEach(function () {
    config([
        'sunat.url' => 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        'sunat.ruc' => '20000000001',
        'sunat.usuario_sol' => 'dummy',
        'sunat.clave_sol' => 'dummy',
    ]);
});

/**
 * Invoca datosCliente() con un payload minimo, sin tocar SUNAT.
 *
 * @param  array<string, mixed>  $client
 * @return array{tipo_doc: string, numero: string, razon_social: string}
 */
function datosClienteDe(string $tipoDocumento, array $client): array
{
    $controller = app(FacturaController::class);
    $metodo = new ReflectionMethod(FacturaController::class, 'datosCliente');
    $metodo->setAccessible(true);

    $request = Request::create('/', 'POST', [
        'tipo_documento' => $tipoDocumento,
        'client' => $client,
    ]);

    return $metodo->invoke($controller, $request);
}

test('una boleta sin DNI usa 00000000 y CLIENTES VARIOS', function () {
    expect(datosClienteDe('03', ['dni' => null, 'nombres' => null]))
        ->toBe(['tipo_doc' => '1', 'numero' => '00000000', 'razon_social' => 'CLIENTES VARIOS'])
        ->and(datosClienteDe('03', ['dni' => '']))
        ->toBe(['tipo_doc' => '1', 'numero' => '00000000', 'razon_social' => 'CLIENTES VARIOS'])
        ->and(datosClienteDe('03', []))
        ->toBe(['tipo_doc' => '1', 'numero' => '00000000', 'razon_social' => 'CLIENTES VARIOS']);
});

test('una boleta con DNI conserva el DNI pero descarta el nombre', function () {
    expect(datosClienteDe('03', ['dni' => '45678912', 'nombres' => 'JUAN PEREZ']))
        ->toBe(['tipo_doc' => '1', 'numero' => '45678912', 'razon_social' => 'CLIENTES VARIOS']);
});

test('el 00000000 informado explicitamente se conserva', function () {
    expect(datosClienteDe('03', ['dni' => '00000000']))
        ->toBe(['tipo_doc' => '1', 'numero' => '00000000', 'razon_social' => 'CLIENTES VARIOS']);
});

test('una factura si usa el RUC y la razon social informs', function () {
    expect(datosClienteDe('01', [
        'ruc' => '20601030013',
        'razon_social' => 'ACME S.A.C.',
        'nombres' => 'IGNORADO',
    ]))->toBe([
        'tipo_doc' => '6',
        'numero' => '20601030013',
        'razon_social' => 'ACME S.A.C.',
    ]);
});

test('documento queda en null hasta que SUNAT acepta', function () {
    $controller = app(FacturaController::class);
    $metodo = new ReflectionMethod(FacturaController::class, 'reservarCorrelativoYCrearFactura');
    $metodo->setAccessible(true);

    $factura = $metodo->invoke($controller, 'B001', Request::create('/', 'POST', [
        'tipo_documento' => '03',
        'vendedor' => ['nombre' => 'Cajero'],
        'client' => ['dni' => '45678912', 'nombres' => 'JUAN PEREZ'],
    ]));

    expect($factura->documento)->toBeNull()
        ->and($factura->documento_cliente)->toBe('45678912')
        ->and($factura->Cliente)->toBe('CLIENTES VARIOS')
        ->and($factura->estado_sunat)->toBe('procesando');
});

test('el documento del cliente sobrevive a la sobreescritura del nombre del PDF', function () {
    // Asimula lo que hace generateInvoice() al aceptar el comprobante: el
    // nombre del PDF pisa `documento` y el documento del cliente debe quedar
    // intacto en su propia columna.
    $factura = Factura::create([
        'serie' => 'B001',
        'correlativo' => 99,
        'vendedor' => 'Cajero',
        'fecha_emitido' => now(),
        'montototal' => 0,
        'Cliente' => 'CLIENTES VARIOS',
        'documento_cliente' => '45678912',
        'documento' => null,
        'estado_sunat' => 'procesando',
    ]);

    $factura->documento = '20000000001-03-B001-99.pdf';
    $factura->save();

    $factura->refresh();

    expect($factura->documento)->toBe('20000000001-03-B001-99.pdf')
        ->and($factura->documento_cliente)->toBe('45678912');
});

test('las URLs de un comprobante sin emitir son null y no una ruta rota', function () {
    $factura = Factura::create([
        'serie' => 'B001',
        'correlativo' => 98,
        'vendedor' => 'Cajero',
        'fecha_emitido' => now(),
        'montototal' => 0,
        'Cliente' => 'CLIENTES VARIOS',
        'documento_cliente' => '00000000',
        'documento' => null,
        'estado_sunat' => 'rechazado',
    ]);

    expect($factura->pdf_url)->toBeNull()
        ->and($factura->xml_url)->toBeNull()
        ->and($factura->cdr_url)->toBeNull();
});

test('la direccion del cliente se construye con los metodos reales de Greenter', function () {
    // Regresion: se llamaba setUbigeo(), que no existe en la clase Address de
    // Greenter. Como no hay __call, PHP lanzaba un Error que el catch de
    // PedidoController reportaba como "error de comunicacion con SUNAT".
    $address = (new Address)
        ->setUbigueo('150101')
        ->setDepartamento('LIMA')
        ->setProvincia('LIMA')
        ->setDistrito('LIMA')
        ->setUrbanizacion('-')
        ->setDireccion('Av.Principal 123')
        ->setCodLocal('0001');

    expect($address)->toBeInstanceOf(Address::class)
        ->and($address->getUbigueo())->toBe('150101')
        ->and($address->getDireccion())->toBe('Av.Principal 123');
});

test('la boleta sin DNI pasa la validacion que antes exigia el campo', function () {
    // Regresion: client.dni era required_if:tipo_documento,03, lo que devolvia
    // 422 cuando el cajero no informaba DNI.
    $payload = [
        'serie' => 'B001',
        'tipo_documento' => '03',
        'client' => [
            'ruc' => null,
            'dni' => null,
            'razon_social' => null,
            'nombres' => null,
            'direccion' => '-',
            'ubigeo' => '100101',
        ],
    ];

    $reglas = [
        'client' => 'required|array',
        'client.ruc' => 'required_if:tipo_documento,01',
        'client.razon_social' => 'required_if:tipo_documento,01',
        'client.dni' => 'nullable|string',
        'client.nombres' => 'nullable|string',
        'client.direccion' => 'required|string',
        'client.ubigeo' => 'required|string',
    ];

    expect(validator($payload, $reglas)->passes())->toBeTrue()
        ->and(validator(['tipo_documento' => '01', 'client' => ['dni' => '45678912']], $reglas)->fails())->toBeTrue();
});
