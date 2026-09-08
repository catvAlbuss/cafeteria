<?php

namespace App\Http\Controllers;

use App\Models\areas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $areas = areas::all();

        return Inertia::render('inventario/area', [
            'areas' => $areas
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:areas,nombre',
        ]);

        areas::create($validated);

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(areas $areas)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(areas $areas)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, areas $areas)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:areas,nombre,' . $areas->id,
        ]);

        $areas->update($validated);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(areas $areas)
    {
        $areas->delete();

        return redirect()->back();
    }
}