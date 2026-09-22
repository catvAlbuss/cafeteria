<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ReporteExport implements FromCollection, WithHeadings, WithEvents
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection(): Collection
    {
        return collect($this->data['ventasDiarias'] ?? [])
            ->map(function ($venta) {
                return [
                    $venta['fecha'] ?? '',
                    $venta['tickets'] ?? 0,
                    $venta['ventas'] ?? 0,
                    $venta['gastos'] ?? 0,
                    $venta['ganancia'] ?? 0,
                ];
            });
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Tickets',
            'Ventas',
            'Gastos',
            'Ganancia',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                // ==========================================
                // PALETA DE MARRONES CLAROS
                // ==========================================

                $marron = '6B4F3A';
                $marronMedio = '8B6B52';
                $marronClaro = 'B9A18E';
                $crema = 'F8F3EE';
                $cremaSuave = 'FCF9F6';
                $borde = 'DCCFC3';
                $blanco = 'FFFFFF';

                // ==========================================
                // DATOS
                // ==========================================

                $ventasDiarias = collect(
                    $this->data['ventasDiarias'] ?? []
                );

                $totalVentas = (float) $ventasDiarias->sum(function ($venta) {
                    return (float) ($venta['ventas'] ?? 0);
                });

                $totalTickets = (int) $ventasDiarias->sum(function ($venta) {
                    return (int) ($venta['tickets'] ?? 0);
                });

                $totalGastos = (float) $ventasDiarias->sum(function ($venta) {
                    return (float) ($venta['gastos'] ?? 0);
                });

                $totalGanancia = (float) $ventasDiarias->sum(function ($venta) {
                    return (float) ($venta['ganancia'] ?? 0);
                });

                // ==========================================
                // FECHAS
                // ==========================================

                $fechaInicio = $this->data['fechaInicio']
                    ?? $this->data['fecha_inicio']
                    ?? null;

                $fechaFin = $this->data['fechaFin']
                    ?? $this->data['fecha_fin']
                    ?? null;

                if (!$fechaInicio && $ventasDiarias->isNotEmpty()) {
                    $fechaInicio = $ventasDiarias->first()['fecha'] ?? '';
                }

                if (!$fechaFin && $ventasDiarias->isNotEmpty()) {
                    $fechaFin = $ventasDiarias->last()['fecha'] ?? '';
                }

                // ==========================================
                // ESPACIO SUPERIOR
                // ==========================================

                $sheet->insertNewRowBefore(1, 8);

                // ==========================================
                // TITULO PRINCIPAL
                // ==========================================

                $sheet->mergeCells('A1:E1');

                $sheet->setCellValue(
                    'A1',
                    'Reporte de Ventas'
                );

                $sheet->getStyle('A1:E1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 22,
                        'color' => [
                            'rgb' => $blanco,
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $marron,
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(40);

                // ==========================================
                // FECHA
                // ==========================================

                $sheet->mergeCells('A2:E2');

                $sheet->setCellValue(
                    'A2',
                    'Del ' . $fechaInicio . ' al ' . $fechaFin
                );

                $sheet->getStyle('A2:E2')->applyFromArray([
                    'font' => [
                        'size' => 11,
                        'color' => [
                            'rgb' => $marronMedio,
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(2)->setRowHeight(22);

                $sheet->mergeCells('A3:E3');

                // ==========================================
                // RESUMEN
                // ==========================================

                $sheet->mergeCells('A4:B4');

                $sheet->setCellValue('A4', 'Ventas');
                $sheet->setCellValue('C4', 'Tickets');
                $sheet->setCellValue('D4', 'Gastos');
                $sheet->setCellValue('E4', 'Ganancia');

                $sheet->setCellValue(
                    'A5',
                    'S/ ' . number_format($totalVentas, 2)
                );

                $sheet->setCellValue(
                    'C5',
                    $totalTickets
                );

                $sheet->setCellValue(
                    'D5',
                    'S/ ' . number_format($totalGastos, 2)
                );

                $sheet->setCellValue(
                    'E5',
                    'S/ ' . number_format($totalGanancia, 2)
                );

                // ==========================================
                // BORDES DEL RESUMEN
                // ==========================================

                $sheet->getStyle('A4:E5')->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $borde,
                            ],
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // ==========================================
                // ENCABEZADOS DEL RESUMEN
                // ==========================================

                $sheet->getStyle('A4:E4')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => [
                            'rgb' => $blanco,
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $marronMedio,
                        ],
                    ],
                ]);

                // ==========================================
                // VALORES DEL RESUMEN
                // ==========================================

                $sheet->getStyle('A5:E5')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => [
                            'rgb' => $marron,
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $blanco,
                        ],
                    ],
                ]);

                // ==========================================
                // TITULO VENTAS DIARIAS
                // ==========================================

                $sheet->mergeCells('A7:E7');

                $sheet->setCellValue(
                    'A7',
                    'Ventas diarias'
                );

                $sheet->getStyle('A7:E7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => [
                            'rgb' => $marron,
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(7)->setRowHeight(30);

                // ==========================================
                // ENCABEZADO VENTAS DIARIAS
                // ==========================================

                $sheet->fromArray([[
                    'Fecha',
                    'Tickets',
                    'Ventas',
                    'Gastos',
                    'Ganancia',
                ]], null, 'A8');

                $sheet->getStyle('A8:E8')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'rgb' => $blanco,
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $marronMedio,
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],

                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $marronMedio,
                            ],
                        ],
                    ],
                ]);

                // ==========================================
                // DATOS VENTAS DIARIAS
                // ==========================================

                $fila = 9;

                foreach ($ventasDiarias as $venta) {

                    $sheet->setCellValue(
                        "A{$fila}",
                        $venta['fecha'] ?? ''
                    );

                    $sheet->setCellValue(
                        "B{$fila}",
                        (int) ($venta['tickets'] ?? 0)
                    );

                    $sheet->setCellValue(
                        "C{$fila}",
                        (float) ($venta['ventas'] ?? 0)
                    );

                    $sheet->setCellValue(
                        "D{$fila}",
                        (float) ($venta['gastos'] ?? 0)
                    );

                    $sheet->setCellValue(
                        "E{$fila}",
                        (float) ($venta['ganancia'] ?? 0)
                    );

                    // ======================================
                    // FILAS ALTERNADAS
                    // ======================================

                    if ($fila % 2 === 1) {

                        $sheet->getStyle(
                            "A{$fila}:E{$fila}"
                        )->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => [
                                    'rgb' => $crema,
                                ],
                            ],
                        ]);
                    }

                    $sheet->getStyle(
                        "A{$fila}:E{$fila}"
                    )->applyFromArray([
                        'font' => [
                            'size' => 10,
                            'color' => [
                                'rgb' => $marron,
                            ],
                        ],

                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => [
                                    'rgb' => $borde,
                                ],
                            ],
                        ],

                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);

                    $sheet->getStyle("B{$fila}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet->getStyle("C{$fila}:E{$fila}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_RIGHT
                        );

                    $sheet->getStyle("C{$fila}:E{$fila}")
                        ->getNumberFormat()
                        ->setFormatCode(
                            '"S/ " #,##0.00'
                        );

                    $fila++;
                }

                // ==========================================
                // METODOS DE PAGO
                // ==========================================

                $metodosPago = $this->data['metodosPago']
                    ?? $this->data['metodos_pago']
                    ?? [];

                if (!empty($metodosPago)) {

                    $fila += 2;

                    // ======================================
                    // TITULO
                    // ======================================

                    $sheet->mergeCells(
                        "A{$fila}:E{$fila}"
                    );

                    $sheet->setCellValue(
                        "A{$fila}",
                        'Métodos de pago'
                    );

                    $sheet->getStyle(
                        "A{$fila}:E{$fila}"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 16,
                            'color' => [
                                'rgb' => $marron,
                            ],
                        ],

                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_LEFT,
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);

                    $fila++;

                    // ======================================
                    // ENCABEZADO
                    // ======================================

                    $sheet->fromArray([[
                        'Método',
                        'Cantidad',
                        'Total',
                        'Porcentaje',
                        '',
                    ]], null, "A{$fila}");

                    $sheet->getStyle(
                        "A{$fila}:D{$fila}"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 11,
                            'color' => [
                                'rgb' => $blanco,
                            ],
                        ],

                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => [
                                'rgb' => $marronMedio,
                            ],
                        ],

                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],

                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => [
                                    'rgb' => $marronMedio,
                                ],
                            ],
                        ],
                    ]);

                    $fila++;

                    // ======================================
                    // DATOS METODOS DE PAGO
                    // ======================================

                    foreach ($metodosPago as $metodo) {

                        $nombre = $metodo['metodo']
                            ?? $metodo['metodo_pago']
                            ?? $metodo['nombre']
                            ?? '';

                        $cantidad = $metodo['cantidad']
                            ?? $metodo['count']
                            ?? 0;

                        $total = $metodo['total']
                            ?? $metodo['ventas']
                            ?? 0;

                        $porcentaje =
                            $metodo['porcentaje'] ?? 0;

                        $sheet->setCellValue(
                            "A{$fila}",
                            $nombre
                        );

                        $sheet->setCellValue(
                            "B{$fila}",
                            $cantidad
                        );

                        $sheet->setCellValue(
                            "C{$fila}",
                            (float) $total
                        );

                        $sheet->setCellValue(
                            "D{$fila}",
                            is_numeric($porcentaje)
                                ? $porcentaje . '%'
                                : $porcentaje
                        );

                        // ==================================
                        // FILAS ALTERNADAS
                        // ==================================

                        if ($fila % 2 === 1) {

                            $sheet->getStyle(
                                "A{$fila}:D{$fila}"
                            )->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => [
                                        'rgb' => $crema,
                                    ],
                                ],
                            ]);
                        }

                        $sheet->getStyle(
                            "A{$fila}:D{$fila}"
                        )->applyFromArray([
                            'font' => [
                                'size' => 10,
                                'color' => [
                                    'rgb' => $marron,
                                ],
                            ],

                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => [
                                        'rgb' => $borde,
                                    ],
                                ],
                            ],

                            'alignment' => [
                                'vertical' => Alignment::VERTICAL_CENTER,
                            ],
                        ]);

                        $sheet->getStyle(
                            "B{$fila}:D{$fila}"
                        )->getAlignment()
                            ->setHorizontal(
                                Alignment::HORIZONTAL_RIGHT
                            );

                        $sheet->getStyle(
                            "C{$fila}"
                        )->getNumberFormat()
                            ->setFormatCode(
                                '"S/ " #,##0.00'
                            );

                        $fila++;
                    }
                }

                // ==========================================
                // ANCHO DE COLUMNAS
                // ==========================================

                $sheet->getColumnDimension('A')->setWidth(25);
                $sheet->getColumnDimension('B')->setWidth(18);
                $sheet->getColumnDimension('C')->setWidth(22);
                $sheet->getColumnDimension('D')->setWidth(22);
                $sheet->getColumnDimension('E')->setWidth(22);

                // ==========================================
                // ALTO DE FILAS
                // ==========================================

                $ultimaFila = $sheet->getHighestRow();

                for ($i = 8; $i <= $ultimaFila; $i++) {
                    $sheet->getRowDimension($i)->setRowHeight(23);
                }

                // ==========================================
                // CONGELAR ENCABEZADO
                // ==========================================

                $sheet->freezePane('A9');

                // ==========================================
                // CONFIGURACION DE IMPRESION
                // ==========================================

                $sheet->getPageSetup()->setOrientation(
                    \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
                );

                $sheet->getPageSetup()->setPaperSize(
                    \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4
                );

                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(0);

                $sheet->getPageMargins()->setTop(0.5);
                $sheet->getPageMargins()->setBottom(0.5);
                $sheet->getPageMargins()->setLeft(0.3);
                $sheet->getPageMargins()->setRight(0.3);
            },
        ];
    }
}
