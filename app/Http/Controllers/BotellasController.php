<?php

namespace App\Http\Controllers;

use App\Models\Botellas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BotellasController extends Controller
{
    public function index()
    {
        $botellas = Botellas::orderBy('id', 'asc')->get();

        return Inertia::render('botellas/botellas', [
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
            'codigo'   => 'required|string|unique:botellas,codigo',
            'nombre'   => 'required|string',
            'marca'    => 'required|string',
            'cantidad' => 'required|integer|min:1',
        ]);

        Botellas::create($datos);

        return redirect()->route('botellas.index')
            ->with('success', 'Botella guardada correctamente.');
    }

    public function show(Botellas $botella)
    {
        return response()->json($botella);
    }

    public function edit(Botellas $botella)
    {
        return response()->json($botella);
    }

    public function update(Request $request, Botellas $botella)
    {
        $datos = $request->validate([
            'codigo'   => 'required|string|unique:botellas,codigo,' . $botella->id,
            'nombre'   => 'required|string',
            'marca'    => 'required|string',
            'cantidad' => 'required|integer|min:1',
        ]);

        $botella->update($datos);

        return redirect()->route('botellas.index')
            ->with('success', 'Botella actualizada correctamente.');
    }

    public function destroy(Botellas $botella)
    {
        $botella->delete();

        return redirect()->route('botellas.index')
            ->with('success', 'Botella eliminada.');
    }
}