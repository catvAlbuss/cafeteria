<?php

use App\Models\Factura;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config([
        'sunat.url' => 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        'sunat.ruc' => '20000000001',
        'sunat.usuario_sol' => 'dummy',
        'sunat.clave_sol' => 'dummy',
    ]);

    Storage::fake();
});

function facturaConSerie(string $serie, int $correlativo, string $estado = 'aceptado'): Factura
{
    if ($estado === 'aceptado') {
        Storage::put("invoices/{$serie}-{$correlativo}.xml", '<xml/>');
    }

    return Factura::create([
        'serie' => $serie,
        'correlativo' => $correlativo,
        'vendedor' => 'Cajero',
        'fecha_emitido' => now(),
        'montototal' => 20,
        'Cliente' => 'Cliente',
        'documento' => $serie.'-'.$correlativo.'.pdf',
        'estado_sunat' => $estado,
    ]);
}

test('detecta cuando el contador quedo por debajo de los comprobantes emitidos', function () {
    facturaConSerie('B001', 5);

    DB::table('correlativos_control')->insert([
        'ruc' => '20000000001',
        'serie' => 'B001',
        'ultimo_correlativo' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('sunat:reconciliar-correlativos')
        ->assertFailed();

    $this->artisan('sunat:reconciliar-correlativos --fix')->assertFailed();

    expect((int) DB::table('correlativos_control')->where('serie', 'B001')->value('ultimo_correlativo'))->toBe(5);
});

test('detecta series de comprobantes sin fila de control', function () {
    // B001 y F001 existen en la tabla, pero sin fila en correlativos_control.
    facturaConSerie('F001', 7);

    $this->artisan('sunat:reconciliar-correlativos')->assertFailed();
});

test('detecta pedidos que apuntan a comprobantes inexistentes', function () {
    // factura_numero no es un atributo asignable en masa, por eso forceFill.
    $pedido = Pedido::create([
        'numero' => '0001',
        'estado' => 'pagado',
        'tipo_documento' => 'boleta',
        'productos' => json_encode([['id' => 1, 'nombre' => 'Cafe', 'precio' => 5, 'cantidad' => 1]]),
        'total' => 5,
        'cliente' => 'Cliente',
    ]);

    $pedido->forceFill(['factura_numero' => '20000000001-03-B001-9'])->save();

    $this->artisan('sunat:reconciliar-correlativos')->assertFailed();
});

test('detecta comprobantes aceptados cuyo XML no esta en disco', function () {
    Factura::create([
        'serie' => 'B001',
        'correlativo' => 1,
        'vendedor' => 'Cajero',
        'fecha_emitido' => now(),
        'montototal' => 20,
        'Cliente' => 'Cliente',
        'documento' => 'B001-1.pdf',
        'estado_sunat' => 'aceptado',
    ]);

    DB::table('correlativos_control')->insert([
        'ruc' => '20000000001',
        'serie' => 'B001',
        'ultimo_correlativo' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('sunat:reconciliar-correlativos')->assertFailed();
});

test('no reporta problemas cuando los contadores son correctos', function () {
    facturaConSerie('B001', 1);
    facturaConSerie('B001', 2);

    DB::table('correlativos_control')->insert([
        'ruc' => '20000000001',
        'serie' => 'B001',
        'ultimo_correlativo' => 2,
        'estado' => 'aceptado',
        'documento' => 'B001-2',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->artisan('sunat:reconciliar-correlativos')->assertSuccessful();
});
