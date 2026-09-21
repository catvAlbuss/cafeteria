<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InsumosExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles
{
    protected $insumos;

    public function __construct($insumos)
    {
        $this->insumos = $insumos;
    }

    public function collection()
    {
        return $this->insumos;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nombre',
            'Categoría',
            'Área',
            'Unidad',
            'Stock',
            'Precio',
            'Valor del Stock',
            'Proveedor',
            'Estado',
            'Fecha de Registro',
        ];
    }

    public function map($insumo): array
    {
        $stock = (float) ($insumo->stock ?? 0);
        $precio = (float) ($insumo->precio ?? 0);

        return [
            $insumo->id,
            $insumo->nombre,
            $insumo->categoria ?: 'Sin categoría',
            ucfirst($insumo->area ?? 'Sin área'),
            $insumo->unidad ?? '',
            $stock,
            $precio,
            $stock * $precio,
            $insumo->proveedor ?: 'Sin proveedor',
            $insumo->activo ? 'Activo' : 'Inactivo',
            $insumo->created_at
                ? $insumo->created_at->format('d/m/Y H:i')
                : '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();

        /*
        |--------------------------------------------------------------------------
        | TÍTULO
        |--------------------------------------------------------------------------
        */

        $sheet->insertNewRowBefore(1, 4);

        $sheet->mergeCells('A1:K1');

        $sheet->setCellValue(
            'A1',
            'DOLCE CAFE - REPORTE DE INSUMOS'
        );

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

        $sheet->getRowDimension(1)->setRowHeight(35);

        /*
        |--------------------------------------------------------------------------
        | INFORMACIÓN DEL REPORTE
        |--------------------------------------------------------------------------
        */

        $sheet->mergeCells('A2:D2');
        $sheet->setCellValue(
            'A2',
            'Inventario general de insumos'
        );

        $sheet->mergeCells('E2:K2');
        $sheet->setCellValue(
            'E2',
            'Generado: ' . now()->format('d/m/Y H:i')
        );

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

        /*
        |--------------------------------------------------------------------------
        | RESUMEN
        |--------------------------------------------------------------------------
        */

        $cantidadInsumos = $this->insumos->count();

        $valorTotal = $this->insumos->sum(function ($insumo) {
            return (float) ($insumo->stock ?? 0)
                * (float) ($insumo->precio ?? 0);
        });

        $sheet->mergeCells('A3:D3');
        $sheet->setCellValue(
            'A3',
            'Total de insumos: ' . $cantidadInsumos
        );

        $sheet->mergeCells('E3:K3');
        $sheet->setCellValue(
            'E3',
            'Valor total del stock: S/ ' . number_format($valorTotal, 2)
        );

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
        ]);

        /*
        |--------------------------------------------------------------------------
        | ENCABEZADOS
        |--------------------------------------------------------------------------
        */

        $headerRow = 5;

        $sheet->getStyle("A{$headerRow}:K{$headerRow}")
            ->applyFromArray([
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

        $sheet->getRowDimension($headerRow)->setRowHeight(30);

        /*
        |--------------------------------------------------------------------------
        | DATOS
        |--------------------------------------------------------------------------
        */

        $dataStart = 6;
        $dataEnd = max($lastRow + 4, $dataStart);

        if ($dataEnd >= $dataStart) {
            $sheet->getStyle("A{$dataStart}:K{$dataEnd}")
                ->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'color' => [
                            'rgb' => '5A3D2B',
                        ],
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => 'E8D5C4',
                            ],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

            /*
            |--------------------------------------------------------------------------
            | FILAS ALTERNADAS
            |--------------------------------------------------------------------------
            */

            for ($row = $dataStart; $row <= $dataEnd; $row++) {
                if (($row - $dataStart) % 2 === 0) {
                    $sheet->getStyle("A{$row}:K{$row}")
                        ->getFill()
                        ->setFillType(Fill::FILL_SOLID);

                    $sheet->getStyle("A{$row}:K{$row}")
                        ->getFill()
                        ->getStartColor()
                        ->setRGB('FFF9F1');
                }
            }

            /*
            |--------------------------------------------------------------------------
            | FORMATOS NUMÉRICOS
            |--------------------------------------------------------------------------
            */

            $sheet->getStyle("F{$dataStart}:F{$dataEnd}")
                ->getNumberFormat()
                ->setFormatCode('0.00');

            $sheet->getStyle("G{$dataStart}:H{$dataEnd}")
                ->getNumberFormat()
                ->setFormatCode('"S/" #,##0.00');

            /*
            |--------------------------------------------------------------------------
            | ALINEACIÓN
            |--------------------------------------------------------------------------
            */

            $sheet->getStyle("A{$dataStart}:A{$dataEnd}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->getStyle("F{$dataStart}:H{$dataEnd}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet->getStyle("J{$dataStart}:J{$dataEnd}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        /*
        |--------------------------------------------------------------------------
        | ANCHOS DE COLUMNAS
        |--------------------------------------------------------------------------
        */

        $widths = [
            'A' => 8,
            'B' => 28,
            'C' => 20,
            'D' => 14,
            'E' => 14,
            'F' => 13,
            'G' => 15,
            'H' => 19,
            'I' => 25,
            'J' => 14,
            'K' => 20,
        ];

        foreach ($widths as $column => $width) {
            $sheet->getColumnDimension($column)
                ->setWidth($width);
        }

        /*
        |--------------------------------------------------------------------------
        | FILTROS
        |--------------------------------------------------------------------------
        */

        $sheet->setAutoFilter(
            "A{$headerRow}:K{$dataEnd}"
        );

        /*
        |--------------------------------------------------------------------------
        | CONGELAR ENCABEZADO
        |--------------------------------------------------------------------------
        */

        $sheet->freezePane('A6');

        /*
        |--------------------------------------------------------------------------
        | CONFIGURACIÓN DE IMPRESIÓN
        |--------------------------------------------------------------------------
        */

        $sheet->getPageSetup()
            ->setOrientation(
                \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
            );

        $sheet->getPageSetup()
            ->setPaperSize(
                \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4
            );

        $sheet->getPageSetup()
            ->setFitToWidth(1);

        $sheet->getPageMargins()->setTop(0.4);
        $sheet->getPageMargins()->setRight(0.3);
        $sheet->getPageMargins()->setBottom(0.4);
        $sheet->getPageMargins()->setLeft(0.3);

        return [];
    }
}