<?php

use App\Exports\ContadorExport;
use App\Exports\HistorialSheetExport;
use App\Exports\IngresosSheetExport;
use App\Exports\MovimientosSheetExport;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;

uses(Tests\TestCase::class);

test('contador export includes its three sheets', function () {
    $export = new ContadorExport(collect(), collect(), collect());

    expect($export->sheets())->sequence(
        fn ($sheet) => $sheet->toBeInstanceOf(IngresosSheetExport::class),
        fn ($sheet) => $sheet->toBeInstanceOf(HistorialSheetExport::class),
        fn ($sheet) => $sheet->toBeInstanceOf(MovimientosSheetExport::class),
    );
});

test('income and movement rows accept the data prepared by the controller', function () {
    $ingresos = new IngresosSheetExport(collect());
    $movimientos = new MovimientosSheetExport(collect());

    expect($ingresos->map(['concepto' => 'Ventas Efectivo', 'monto' => '25.50']))
        ->toBe(['Ventas Efectivo', 25.5])
        ->and($movimientos->map((object) [
            'tipo' => 'ingreso',
            'descripcion' => 'Aporte',
            'cliente' => null,
            'monto' => '10.25',
            'hora' => '10:30 AM',
        ]))->toBe(['ingreso', 'Aporte', 'Anónimo', 10.25, '10:30 AM']);
});

test('contador workbook can be generated', function () {
    $export = new ContadorExport(
        collect([['concepto' => 'Ventas Efectivo', 'monto' => 25.5]]),
        collect(),
        collect([(object) [
            'tipo' => 'ingreso',
            'descripcion' => 'Aporte',
            'cliente' => 'Cliente',
            'monto' => 10.25,
            'hora' => '10:30 AM',
        ]]),
    );

    expect(Excel::raw($export, ExcelWriter::XLSX))->not->toBeEmpty();
});
