<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ContadorExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        protected Collection $ingresos,
        protected Collection $historial,
        protected Collection $movimientos
    ) {}

    public function sheets(): array
    {
        return [
            new IngresosSheetExport($this->ingresos),
            new HistorialSheetExport($this->historial),
            new MovimientosSheetExport($this->movimientos),
        ];
    }
}