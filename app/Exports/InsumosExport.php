<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InsumosExport implements FromCollection, WithColumnWidths, WithEvents, WithHeadings, WithMapping, WithStyles
{
    public function __construct(protected Collection $insumos) {}

    public function collection(): Collection
    {
        return $this->insumos;
    }

    public function headings(): array
    {
        return [
            'Nombre',
            'Categoría',
            'Área',
            'Unidad',
            'Stock actual',
            'Stock mínimo',
            'Precio unitario',
            'Valor total en stock',
            'Proveedor',
            'Estado',
        ];
    }

    public function map($insumo): array
    {
        $stock = (float) $insumo->stock;
        $precio = (float) $insumo->precio;

        return [
            $insumo->nombre,
            $insumo->categoria ?? '-',
            $insumo->area === 'cocina' ? 'Cocina' : 'Bar',
            $insumo->unidad,
            $stock,
            (float) $insumo->stock_minimo,
            round($precio, 2),
            round($stock * $precio, 2),
            $insumo->proveedor ?? '-',
            $insumo->activo ? 'Activo' : 'Inactivo',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28,
            'B' => 18,
            'C' => 10,
            'D' => 10,
            'E' => 14,
            'F' => 14,
            'G' => 16,
            'H' => 18,
            'I' => 20,
            'J' => 12,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2D1B1A'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                $sheet->getStyle("G2:H{$highestRow}")
                    ->getNumberFormat()
                    ->setFormatCode('"S/" #,##0.00');

                $sheet->freezePane('A2');
            },
        ];
    }
}
