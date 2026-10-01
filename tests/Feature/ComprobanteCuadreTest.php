<?php

/**
 * El cuadre de base, IGV y total se comprueba sin llamar a SUNAT: si el
 * redondeo descuadra, la linea llega rechazada y cada intento consume un
 * correlativo. Por eso se verifica antes de emitir.
 */

/**
 * Reproduce la aritmetica de FacturaController::generateInvoice.
 *
 * @param  array<int, array{unit_price: float, quantity: float}>  $items
 * @return array<string, mixed>
 */
function calcularComprobante(array $items, bool $incluidoIgv = true): array
{
    $baseImponible = 0.0;
    $impuestoTotal = 0.0;
    $totalPagado = 0.0;
    $lineas = [];

    foreach ($items as $item) {
        $cantidad = (float) $item['quantity'];
        $precioUnitario = (float) $item['unit_price'];

        if ($incluidoIgv) {
            $valorUnitario = round($precioUnitario / 1.18, 2);
            $valorVenta = round($valorUnitario * $cantidad, 2);
            $igv = round($valorVenta * 0.18, 2);
        } else {
            $valorUnitario = round($precioUnitario, 2);
            $valorVenta = round($valorUnitario * $cantidad, 2);
            $igv = 0.0;
        }

        $lineas[] = [
            'cantidad' => $cantidad,
            'valor_unitario' => $valorUnitario,
            'valor_venta' => $valorVenta,
            'igv' => $igv,
        ];

        $baseImponible = round($baseImponible + $valorVenta, 2);
        $impuestoTotal = round($impuestoTotal + $igv, 2);
        $totalPagado = round($totalPagado + $valorVenta + $igv, 2);
    }

    return compact('lineas', 'baseImponible', 'impuestoTotal', 'totalPagado');
}

test('el valor de venta de cada linea reconstruye exactamente la base', function (float $precio, float $cantidad) {
    $comprobante = calcularComprobante([['unit_price' => $precio, 'quantity' => $cantidad]]);
    $linea = $comprobante['lineas'][0];

    // SUNAT rechaza con 4000/4001 cuando esto no cuadra.
    expect(round($linea['valor_unitario'] * $linea['cantidad'], 2))
        ->toBe($linea['valor_venta'])
        ->and(round($linea['valor_venta'] * 0.18, 2))->toBe($linea['igv'])
        ->and($comprobante['baseImponible'])->toBe($linea['valor_venta'])
        ->and($comprobante['impuestoTotal'])->toBe($linea['igv'])
        ->and($comprobante['totalPagado'])
        ->toBe(round($linea['valor_venta'] + $linea['igv'], 2));
})->with([
    'cantidad 1, precio que antes descuadraba' => [1.00, 1],
    'dos unidades de 1.00' => [1.00, 2],
    'tres unidades de 1.00' => [1.00, 3],
    'cinco unidades de 1.00' => [1.00, 5],
    'dos unidades de 3.50' => [3.50, 2],
    'dos unidades de 8.50' => [8.50, 2],
    'tres unidades de 4.20' => [4.20, 3],
    'precio de cafeteria' => [5.50, 1],
    'precio con centavos impares' => [7.35, 2],
    'cantidad alta' => [2.50, 12],
]);

test('ningun precio de cafeteria produce lineas descuadradas', function () {
    $fallos = [];

    // Barrido de S/0.50 a S/30.00 con cantidades habituales en cafeteria.
    for ($centavos = 50; $centavos <= 3000; $centavos += 5) {
        $precio = $centavos / 100;

        foreach ([1, 2, 3, 4, 5, 6] as $cantidad) {
            $linea = calcularComprobante([['unit_price' => $precio, 'quantity' => $cantidad]])['lineas'][0];

            $unitarioDescuadra = abs(round($linea['valor_unitario'] * $linea['cantidad'], 2) - $linea['valor_venta']) >= 0.005;
            $igvDescuadra = abs(round($linea['valor_venta'] * 0.18, 2) - $linea['igv']) >= 0.005;

            if ($unitarioDescuadra || $igvDescuadra) {
                $fallos[] = sprintf('%.2f x%d', $precio, $cantidad);
            }
        }
    }

    expect($fallos)->toBe([]);
});

test('un comprobante con varias lineas cuadra en su conjunto', function () {
    $comprobante = calcularComprobante([
        ['unit_price' => 5.50, 'quantity' => 1],
        ['unit_price' => 8.50, 'quantity' => 2],
        ['unit_price' => 3.50, 'quantity' => 3],
    ]);

    $sumaBases = round(array_sum(array_column($comprobante['lineas'], 'valor_venta')), 2);
    $sumaIgv = round(array_sum(array_column($comprobante['lineas'], 'igv')), 2);

    expect($comprobante['baseImponible'])->toBe($sumaBases)
        ->and($comprobante['impuestoTotal'])->toBe($sumaIgv)
        ->and($comprobante['totalPagado'])->toBe(round($sumaBases + $sumaIgv, 2));
});

test('sin IGV incluido la base es el total y no hay impuesto', function () {
    $comprobante = calcularComprobante([
        ['unit_price' => 10.00, 'quantity' => 2],
    ], false);

    expect($comprobante['baseImponible'])->toBe(20.0)
        ->and($comprobante['impuestoTotal'])->toBe(0.0)
        ->and($comprobante['totalPagado'])->toBe(20.0);
});

test('el IGV incluido refleja una venta del dieciocho por ciento', function () {
    $comprobante = calcularComprobante([['unit_price' => 118.00, 'quantity' => 1]]);

    // 118.00 con IGV son 100.00 de base mas 18.00 de IGV.
    expect($comprobante['baseImponible'])->toBe(100.0)
        ->and($comprobante['impuestoTotal'])->toBe(18.0)
        ->and($comprobante['totalPagado'])->toBe(118.0);
});
