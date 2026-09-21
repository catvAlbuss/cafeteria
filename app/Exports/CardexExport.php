<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;

class CardexExport implements
    FromCollection,
    WithEvents,
    WithColumnWidths,
    WithTitle
{
    protected Collection $movimientos;

    public function __construct($movimientos)
    {
        $this->movimientos = collect($movimientos);
    }

    /**
     * Datos que se enviarán al Excel.
     */
    public function collection()
    {
        $filas = collect();

        // =====================================================
        // TÍTULO
        // =====================================================

        $filas->push([
            'DOLCE CAFE - REPORTE DE CARDEX',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ]);

        // =====================================================
        // INFORMACIÓN DEL REPORTE
        // =====================================================

        $filas->push([
            'Historial completo de movimientos de inventario',
            '',
            '',
            '',
            'Generado:',
            now()->format('d/m/Y H:i'),
            '',
            '',
            '',
            '',
            '',
        ]);

        // =====================================================
        // RESUMEN
        // =====================================================

        $totalMovimientos = $this->movimientos->count();

        $totalEntradas = $this->movimientos
            ->where('tipo', 'entrada')
            ->sum(function ($movimiento) {
                return (float) ($movimiento->cantidad ?? 0);
            });

        $totalSalidas = $this->movimientos
            ->where('tipo', 'salida')
            ->sum(function ($movimiento) {
                return (float) ($movimiento->cantidad ?? 0);
            });

        $filas->push([
            'Total movimientos:',
            $totalMovimientos,
            '',
            'Total entradas:',
            $totalEntradas,
            '',
            'Total salidas:',
            $totalSalidas,
            '',
            '',
            '',
        ]);

        // =====================================================
        // ESPACIO
        // =====================================================

        $filas->push([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ]);

        // =====================================================
        // ENCABEZADOS
        // =====================================================

        $filas->push([
            'Fecha',
            'Tipo',
            'Producto',
            'Categoría',
            'Tipo Mov.',
            'Cantidad',
            'Stock Final',
            'Motivo',
            'Observaciones',
            'Usuario',
            'ID Movimiento',
        ]);

        // =====================================================
        // MOVIMIENTOS
        // =====================================================

        foreach ($this->movimientos as $movimiento) {

            $item = $movimiento->item;

            $tipoItem = $movimiento->item_type === 'plato'
                ? 'Plato'
                : 'Insumo';

            $tipoMovimiento = $movimiento->tipo === 'entrada'
                ? 'Entrada'
                : 'Salida';

            $filas->push([
                $movimiento->created_at
                    ? $movimiento->created_at->format('d/m/Y H:i')
                    : '',

                $tipoItem,

                $item?->nombre ?? '-',

                $item?->categoria ?? '-',

                $tipoMovimiento,

                (float) ($movimiento->cantidad ?? 0),

                (float) ($movimiento->stock_resultante ?? 0),

                $movimiento->motivo ?? '-',

                $movimiento->observaciones ?? '-',

                $movimiento->user?->name ?? 'Sistema',

                $movimiento->id,
            ]);
        }

        return $filas;
    }

    /**
     * Nombre de la hoja.
     */
    public function title(): string
    {
        return 'Cardex';
    }

    /**
     * Ancho de las columnas.
     */
    public function columnWidths(): array
    {
        return [
            'A' => 20,
            'B' => 14,
            'C' => 30,
            'D' => 20,
            'E' => 16,
            'F' => 14,
            'G' => 16,
            'H' => 18,
            'I' => 35,
            'J' => 22,
            'K' => 15,
        ];
    }

    /**
     * Estilos del Excel.
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                // =================================================
                // TÍTULO PRINCIPAL
                // =================================================

                $sheet->mergeCells('A1:K1');

                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => '2D1B1A',
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(38);

                // =================================================
                // INFORMACIÓN
                // =================================================

                $sheet->mergeCells('A2:D2');
                $sheet->mergeCells('E2:K2');

                $sheet->getStyle('A2:K2')->applyFromArray([
                    'font' => [
                        'italic' => true,
                        'size' => 10,
                        'color' => [
                            'rgb' => '5A3D2B',
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => 'FBF3E7',
                        ],
                    ],

                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('E2:K2')
                    ->getAlignment()
                    ->setHorizontal(
                        Alignment::HORIZONTAL_RIGHT
                    );

                // =================================================
                // RESUMEN
                // =================================================

                $sheet->mergeCells('A3:C3');
                $sheet->mergeCells('D3:F3');
                $sheet->mergeCells('G3:I3');
                $sheet->mergeCells('J3:K3');

                $sheet->getStyle('A3:K3')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'rgb' => '2D1B1A',
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => 'F3E1C8',
                        ],
                    ],

                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],

                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => 'E8D5C4',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension(3)->setRowHeight(25);

                // =================================================
                // ENCABEZADOS DE LA TABLA
                // =================================================

                $sheet->getStyle('A5:K5')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],

                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => '8A5A2B',
                        ],
                    ],

                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'wrapText' => true,
                    ],

                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => 'FFFFFF',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension(5)->setRowHeight(32);

                // =================================================
                // FILAS DE DATOS
                // =================================================

                $lastRow = $sheet->getHighestRow();

                if ($lastRow >= 6) {

                    $sheet->getStyle("A6:K{$lastRow}")->applyFromArray([
                        'font' => [
                            'size' => 10,
                            'color' => [
                                'rgb' => '5A3D2B',
                            ],
                        ],

                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],

                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => [
                                    'rgb' => 'E8D5C4',
                                ],
                            ],
                        ],
                    ]);

                    // =============================================
                    // FILAS ALTERNADAS
                    // =============================================

                    for ($row = 6; $row <= $lastRow; $row++) {

                        if (($row - 6) % 2 === 0) {

                            $sheet->getStyle("A{$row}:K{$row}")
                                ->getFill()
                                ->setFillType(Fill::FILL_SOLID);

                            $sheet->getStyle("A{$row}:K{$row}")
                                ->getFill()
                                ->getStartColor()
                                ->setRGB('FFF9F1');
                        }
                    }

                    // =============================================
                    // FORMATO NUMÉRICO
                    // =============================================

                    $sheet->getStyle("F6:G{$lastRow}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00');

                    // =============================================
                    // ALINEACIONES
                    // =============================================

                    $sheet->getStyle("A6:A{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet->getStyle("B6:B{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet->getStyle("E6:G{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet->getStyle("K6:K{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );
                }

                // =================================================
                // FILTRO
                // =================================================

                $sheet->setAutoFilter("A5:K{$lastRow}");

                // =================================================
                // CONGELAR ENCABEZADOS
                // =================================================

                $sheet->freezePane('A6');

                // =================================================
                // CONFIGURACIÓN DE IMPRESIÓN
                // =================================================

                $sheet->getPageSetup()->setOrientation(
                    PageSetup::ORIENTATION_LANDSCAPE
                );

                $sheet->getPageSetup()->setPaperSize(
                    PageSetup::PAPERSIZE_A4
                );

                $sheet->getPageSetup()->setFitToWidth(1);

                $sheet->getPageMargins()->setTop(0.4);
                $sheet->getPageMargins()->setRight(0.3);
                $sheet->getPageMargins()->setBottom(0.4);
                $sheet->getPageMargins()->setLeft(0.3);
            },
        ];
    }
}