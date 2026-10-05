<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionFacturacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ConfiguracionFacturacionController extends Controller
{
    public function edit(Request $request)
    {
        $teamId = $request->user()->current_team_id;

        $config = ConfiguracionFacturacion::where('team_id', $teamId)->first();

        // Ocultamos la clave SOL por seguridad antes de enviarla al frontend
        if ($config) {
            $config->makeHidden(['sol_clave']);
        }

        return Inertia::render('settings/empresa', [
            'config' => $config,
            'equipo' => $request->user()->currentTeam,
        ]);
    }

    public function update(Request $request)
    {
        $teamId = $request->user()->current_team_id;

        $validated = $request->validate([
            'ruc' => 'required|string|size:11',
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'direccion' => 'required|string|max:255',
            'ubigeo' => 'required|string|size:6',
            'departamento' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
            'distrito' => 'required|string|max:100',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'serie_factura' => 'required|string|max:4',
            'serie_boleta' => 'required|string|max:4',
            'sol_usuario' => 'nullable|string|max:255',
            'sol_clave' => 'nullable|string|max:255',
            'sunat_url' => 'required|string|max:255',
            'ambiente' => 'required|in:beta,produccion',
            'certificado' => 'nullable|file|mimes:pem,p12,pfx,txt|max:2048',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
        ]);

        // Quitamos los archivos del array validado (los manejamos aparte)
        unset($validated['certificado'], $validated['logo']);

        $config = ConfiguracionFacturacion::where('team_id', $teamId)->first();

        // Manejar subida de Certificado
        if ($request->hasFile('certificado')) {
            $file = $request->file('certificado');
            $extension = $file->getClientOriginalExtension();
            $filename = "cert_team{$teamId}_" . time() . ".{$extension}";
            $file->storeAs('certificates', $filename, 'local'); // storage/app/certificates
            
            // Eliminar certificado anterior si existe
            if ($config && $config->certificado_path && Storage::disk('local')->exists("certificates/{$config->certificado_path}")) {
                Storage::disk('local')->delete("certificates/{$config->certificado_path}");
            }
            
            $validated['certificado_path'] = $filename;
        }

        // Manejar subida de Logo
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $extension = $file->getClientOriginalExtension();
            $filename = "logo_team{$teamId}_" . time() . ".{$extension}";
            $file->storeAs('public/logos', $filename); // storage/app/public/logos
            
            // Eliminar logo anterior si existe
            if ($config && $config->logo_path && Storage::disk('public')->exists($config->logo_path)) {
                Storage::disk('public')->delete($config->logo_path);
            }
            
            $validated['logo_path'] = "logos/{$filename}";
        }

        if ($config) {
            // Si sol_clave viene vacío, no la sobreescribimos
            if (empty($validated['sol_clave'])) {
                unset($validated['sol_clave']);
            }

            $config->update($validated);
        } else {
            $validated['team_id'] = $teamId;
            ConfiguracionFacturacion::create($validated);
        }

        return redirect()
            ->route('empresa.edit')
            ->with('success', 'Configuración guardada correctamente.');
    }
}