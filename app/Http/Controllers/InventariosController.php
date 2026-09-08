<?php

namespace App\Http\Controllers;

use App\Models\Inventarios;
use App\Models\Areas;
use App\Models\Botellas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventariosController extends Controller
{
    public function index()
    {
        $inventarios = Inventarios::with('area')
            ->orderBy('id', 'asc')
            ->get();

        $areas = Areas::all();
        $botellas = Botellas::orderBy('id', 'asc')->get();

        return Inertia::render('inventario/inventario', [
            'inventarios' => $inventarios,
            'areas' => $areas,
            'botellas' => $botellas,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'codigo'   => 'required|string',
            'nombre'   => 'required|string',
            'marca'    => 'required|string',
            'stock'    => 'required|integer|min:0',
            'areas_id' => 'required|exists:areas,id',
        ]);

        Inventarios::create([
            ...$datos,
            'cant_mant' => 0,
            'mant_1' => null,
            'mant_2' => null,
            'mant_3' => null,
            'especificaciones' => '',
        ]);

        return redirect()->route('inventarios.index');
    }

    public function show(Inventarios $inventario)
    {
        //
    }

    public function edit(Inventarios $inventario)
    {
        return response()->json($inventario);
    }

    public function update(Request $request, Inventarios $inventario)
    {
        $datos = $request->validate([
            'codigo'   => 'required|string',
            'nombre'   => 'required|string',
            'marca'    => 'required|string',
            'stock'    => 'required|integer|min:0',
            'areas_id' => 'required|exists:areas,id',
        ]);

        $inventario->update($datos);

        return redirect()->route('inventarios.index');
    }

    public function destroy(Inventarios $inventario)
    {
        $inventario->delete();

        return redirect()->route('inventarios.index');
    }
}