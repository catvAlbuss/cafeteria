<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IngresosSheetExport implements FromCollection, WithColumnWidths, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected Collection $ingresos) {}

    public function collection(): Collection
    {
        return $this->ingresos;
    }

    public function title(): string
    {
        return 'Ingresos del Dia';
    }

    public function headings(): array
    {
        return ['Concepto', 'Monto'];
    }

    public function map($ingreso): array
    {
        return [
            data_get($ingreso, 'concepto'),
            round((float) data_get($ingreso, 'monto', 0), 2),
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 28, 'B' => 16];
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
}
