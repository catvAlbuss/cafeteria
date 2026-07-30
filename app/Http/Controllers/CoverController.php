<?php

namespace App\Http\Controllers;

use App\Models\Cover;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CoverController extends Controller
{
    public function index()
    {
        $covers = Cover::query()
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn (Cover $cover) => [
                'id' => $cover->id,
                'titulo' => $cover->titulo,
                'descripcion' => $cover->descripcion,
                'tipo' => $cover->tipo,
                'estado' => $cover->estado,
                'imagen' => $cover->imagen,
                'fechaInicio' => $cover->fecha_inicio?->format('d/m/Y'),
                'fechaFin' => $cover->fecha_fin?->format('d/m/Y'),
                'clicks' => $cover->clicks,
                'categoria' => $cover->categoria,
            ])
            ->values()
            ->all();

        return Inertia::render('restaurante/covers', [
            'covers' => $covers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:promocion,evento,festividad,temporada',
            'fechaInicio' => 'required|date',
            'fechaFin' => 'required|date|after_or_equal:fechaInicio',
            'imagen' => 'nullable|string',
        ]);

        // ✅ Procesar Base64 a archivo físico
        $imagenPath = $this->guardarImagenBase64($validated['imagen'] ?? null)
                      ?? '/images/default-cover.jpg';

        $cover = Cover::create([
            'titulo' => $validated['titulo'],
            'descripcion' => $validated['descripcion'] ?? null,
            'tipo' => $validated['tipo'],
            'estado' => 'programado',
            'imagen' => $imagenPath,
            'fecha_inicio' => $validated['fechaInicio'],
            'fecha_fin' => $validated['fechaFin'],
            'clicks' => 0,
        ]);

        return redirect()->back()->with('success', 'Cover creado correctamente');
    }

    public function update(Request $request, $id)
    {
        try {
            \Log::info('=== UPDATE COVER ===');
            \Log::info('ID recibido: '.$id);

            $validated = $request->validate([
                'titulo' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'tipo' => 'required|in:promocion,evento,festividad,temporada',
                'fechaInicio' => 'required|date',
                'fechaFin' => 'required|date|after_or_equal:fechaInicio',
                'imagen' => 'nullable|string',
            ]);

            $cover = Cover::query()->find($id);

            if (! $cover) {
                return redirect()->back()->with('error', 'Cover no encontrado');
            }

            // ✅ Si viene una nueva imagen Base64 la procesa, si no, mantiene la anterior
            $imagenGuardar = $cover->imagen;
            if (! empty($validated['imagen'])) {
                if (str_contains($validated['imagen'], ';base64,')) {
                    // Si es Base64, la convierte a archivo físico
                    $imagenGuardar = $this->guardarImagenBase64($validated['imagen']);
                } else {
                    // Si ya es una URL existente
                    $imagenGuardar = $validated['imagen'];
                }
            }

            $cover->update([
                'titulo' => $validated['titulo'],
                'descripcion' => $validated['descripcion'] ?? null,
                'tipo' => $validated['tipo'],
                'imagen' => $imagenGuardar,
                'fecha_inicio' => $validated['fechaInicio'],
                'fecha_fin' => $validated['fechaFin'],
            ]);

            return redirect()->back()->with('success', 'Cover actualizado correctamente');

        } catch (\Exception $e) {
            \Log::error('ERROR EN UPDATE: '.$e->getMessage());

            return redirect()->back()->with('error', 'Error: '.$e->getMessage());
        }
    }

    public function destroy($id)
    {
        $cover = Cover::findOrFail($id);

        // Opcional: Eliminar archivo del storage si existe en el disco local
        if ($cover->imagen && str_contains($cover->imagen, '/storage/covers/')) {
            $path = str_replace('/storage/', '', $cover->imagen);
            Storage::disk('public')->delete($path);
        }

        $cover->delete();

        return redirect()->back()->with('success', 'Cover eliminado correctamente');
    }

    public function cambiarEstado(Request $request, $id)
    {
        $validated = $request->validate([
            'estado' => 'required|in:activo,programado,pausado,finalizado',
        ]);

        $cover = Cover::findOrFail($id);
        $cover->estado = $validated['estado'];
        $cover->save();

        return redirect()->back()->with('success', 'Estado actualizado correctamente');
    }

    /**
     * Convierte una cadena Base64 en un archivo de imagen en storage/app/public/covers
     */
    private function guardarImagenBase64(?string $base64): ?string
    {
        if (! $base64 || ! str_contains($base64, ';base64,')) {
            return $base64;
        }

        try {
            // Extraer formato y datos de la cadena Base64
            @[$type, $file_data] = explode(';', $base64);
            @[, $file_data] = explode(',', $file_data);

            $extension = 'jpg';
            if (str_contains($type, 'png')) {
                $extension = 'png';
            }
            if (str_contains($type, 'webp')) {
                $extension = 'webp';
            }

            // Generar nombre único
            $imageName = 'cover_'.time().'_'.Str::random(8).'.'.$extension;

            // Guardar en el disco 'public' dentro de la carpeta 'covers'
            Storage::disk('public')->put('covers/'.$imageName, base64_decode($file_data));

            // Retorna la URL relativa para guardar en BD
            return Storage::url('covers/'.$imageName);
        } catch (\Exception $e) {
            \Log::error('Error al guardar imagen Base64: '.$e->getMessage());

            return null;
        }
    }
}
