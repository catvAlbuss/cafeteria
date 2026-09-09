<?php

namespace App\Http\Controllers;

use App\Events\CajaActualizada;
use App\Models\Caja;
use App\Models\MovimientoCaja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MovimientoCajaController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tipo' => ['required', 'in:ingreso,egreso,retiro,aporte'],
            'concepto' => ['required', 'string', 'max:255'],
            'monto' => ['required', 'numeric', 'gt:0'],
        ]);

        $caja = Caja::query()->where('estado', 'Abierta')->firstOrFail();

        MovimientoCaja::query()->create([
            ...$validated,
            'caja_id' => $caja->id,
            'user_id' => $request->user()->id,
        ]);

        broadcast(new CajaActualizada($caja->fresh()));

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
