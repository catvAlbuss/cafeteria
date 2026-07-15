<?php

namespace App\Http\Controllers;

use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class PlatoController extends Controller
{
    public function index()
    {
        $platos = Plato::query()->orderBy('nombre')->get()->values();

        return Inertia::render('restaurante/platos', [
            'platos' => $platos->values()->all(),
        ]);
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'imagen' => 'nullable|string',

        ]);

        $plato = Plato::create($validated);
        Cache::forget($this->cacheKey());

        return redirect()->back()->with('success', 'Plato creado correctamente');
    }

    public function update(Request $request, Plato $plato)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'imagen' => 'nullable|string',

        ]);

        $plato->update($validated);
        Cache::forget($this->cacheKey());

        return redirect()->back()->with('success', 'Plato actualizado correctamente');
    }

    public function destroy(Plato $plato)
    {
        $plato->delete();
        Cache::forget($this->cacheKey());

        return redirect()->back()->with('success', 'Plato eliminado correctamente');
    }

    public function toggleDisponibilidad(Request $request, $id)
    {
        try {
            $plato = Plato::findOrFail($id);
            $plato->disponible = $request->input('disponible', ! $plato->disponible);
            $plato->save();
            Cache::forget($this->cacheKey());

            return redirect()->back()->with('success', 'Disponibilidad actualizada correctamente');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al actualizar disponibilidad: '.$e->getMessage());
        }
    }

    /**
     * Cache key for the plato catalog, scoped by sede.
     */
    private function cacheKey(): string
    {
        return 'platos.catalogo.'.auth()->user()->current_team_id;
    }
}
