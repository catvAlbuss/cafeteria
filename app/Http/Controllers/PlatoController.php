<?php

namespace App\Http\Controllers;

use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
            'imagen' => 'nullable|image|max:2048',

        ]);

        if ($request->hasFile('imagen')) {
            $validated['imagen'] = $this->storeImagen($request->file('imagen'));
        } else {
            unset($validated['imagen']);
        }

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
            'imagen' => 'nullable|image|max:3072',

        ]);

        if ($request->hasFile('imagen')) {
            $validated['imagen'] = $this->storeImagen($request->file('imagen'), $plato->imagen);
        } else {
            unset($validated['imagen']);
        }

        $plato->update($validated);
        Cache::forget($this->cacheKey());

        return redirect()->back()->with('success', 'Plato actualizado correctamente');
    }

    public function destroy(Plato $plato)
    {
        $this->deleteImagen($plato->imagen);
        $plato->delete();
        Cache::forget($this->cacheKey());

        return redirect()->back()->with('success', 'Plato eliminado correctamente');
    }

    /**
     * Redimensiona (max 480px de lado) y guarda la imagen subida en el disco
     * público, devolviendo la ruta pública a guardar en la columna 'imagen'.
     * Antes esto llegaba como base64 dentro del JSON y se intentaba meter en
     * un VARCHAR(255), lo que fallaba o truncaba datos con cualquier imagen real.
     */
    private function storeImagen(UploadedFile $file, ?string $anterior = null): string
    {
        $this->deleteImagen($anterior);

        [$width, $height] = getimagesize($file->getRealPath()) ?: [0, 0];
        $maxSide = 480;
        $scale = $width && $height ? min(1, $maxSide / max($width, $height)) : 1;

        $source = match ($file->getMimeType()) {
            'image/png' => imagecreatefrompng($file->getRealPath()),
            'image/gif' => imagecreatefromgif($file->getRealPath()),
            'image/webp' => imagecreatefromwebp($file->getRealPath()),
            default => imagecreatefromjpeg($file->getRealPath()),
        };

        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($source);

        $filename = 'platos/'.Str::uuid().'.webp';
        $tmpPath = tempnam(sys_get_temp_dir(), 'plato').'.webp';
        imagewebp($resized, $tmpPath, 82);
        imagedestroy($resized);

        Storage::disk('public')->put($filename, file_get_contents($tmpPath));
        unlink($tmpPath);

        return Storage::url($filename);
    }

    private function deleteImagen(?string $path): void
    {
        if (! $path || ! str_starts_with($path, '/storage/')) {
            return;
        }

        $relative = Str::after($path, '/storage/');
        Storage::disk('public')->delete($relative);
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
