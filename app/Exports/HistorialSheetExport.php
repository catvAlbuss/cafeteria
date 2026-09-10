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

class HistorialSheetExport implements FromCollection, WithColumnWidths, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected Collection $registros) {}

    public function collection(): Collection
    {
        return $this->registros;
    }

    public function title(): string
    {
        return 'Historial de Caja';
    }

    public function headings(): array
    {
        return ['Caja', 'Empleado', 'Turno', 'Monto Inicial', 'Monto Final', 'Estado', 'Fecha Apertura'];
    }

    public function map($registro): array
    {
        return [
            $registro->caja,
            $registro->empleado,
            $registro->turno,
            round((float) ($registro->monto_inicial ?? 0), 2),
            $registro->monto_final !== null ? round((float) $registro->monto_final, 2) : 'No cerrada',
            $registro->estado,
            $registro->fecha_apertura,
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 14, 'B' => 22, 'C' => 14, 'D' => 16, 'E' => 16, 'F' => 12, 'G' => 22];
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
