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

class MovimientosSheetExport implements FromCollection, WithColumnWidths, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected Collection $movimientos) {}

    public function collection(): Collection
    {
        return $this->movimientos;
    }

    public function title(): string
    {
        return 'Movimientos Recientes';
    }

    public function headings(): array
    {
        return ['Tipo', 'Descripción', 'Cliente', 'Monto', 'Hora'];
    }

    public function map($movimiento): array
    {
        return [
            $movimiento->tipo,
            $movimiento->descripcion,
            $movimiento->cliente ?? 'Anónimo',
            round((float) ($movimiento->monto ?? 0), 2),
            $movimiento->hora,
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 14, 'B' => 30, 'C' => 20, 'D' => 14, 'E' => 16];
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
