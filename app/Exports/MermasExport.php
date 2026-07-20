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

class MermasExport implements FromCollection, WithColumnWidths, WithEvents, WithHeadings, WithMapping, WithStyles
{
    public function __construct(protected Collection $mermas) {}

    public function collection(): Collection
    {
        return $this->mermas;
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Tipo',
            'Producto/Insumo',
            'Cantidad',
            'Motivo',
            'Costo unitario',
            'Costo total',
            'Responsable',
            'Observaciones',
        ];
    }

    public function map($merma): array
    {
        $precio = (float) ($merma->item->precio ?? 0);
        $cantidad = (float) $merma->cantidad;

        return [
            $merma->created_at->format('d/m/Y H:i'),
            $merma->item_type === 'plato' ? 'Producto' : 'Insumo',
            $merma->item->nombre ?? '-',
            $cantidad,
            $this->motivoLabel($merma->submotivo),
            round($precio, 2),
            round($cantidad * $precio, 2),
            $merma->user->name ?? '-',
            $merma->observaciones ?? '',
        ];
    }

    private function motivoLabel(?string $submotivo): string
    {
        $labels = [
            'caducado' => 'Caducado',
            'quemado' => 'Quemado / mal preparado',
            'sobreproduccion' => 'Sobreproducción',
            'devolucion' => 'Devolución de cliente',
            'rotura' => 'Rotura o derrame',
            'refrigeracion' => 'Falla de refrigeración',
            'mala_preparacion' => 'Merma de preparación',
            'otro' => 'Otro',
        ];

        return $labels[$submotivo] ?? ($submotivo ?: 'Sin especificar');
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,
            'B' => 12,
            'C' => 30,
            'D' => 12,
            'E' => 24,
            'F' => 14,
            'G' => 14,
            'H' => 20,
            'I' => 35,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2D1B1A'], // color de marca Dolce Cafe
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

                $sheet->getStyle("F2:G{$highestRow}")
                    ->getNumberFormat()
                    ->setFormatCode('"S/" #,##0.00');

                $sheet->freezePane('A2');
            },
        ];
    }
}