<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionFacturacion extends Model
{
    protected $table = 'configuraciones_facturacion';

    protected $fillable = [
        'team_id',
        'ruc',
        'razon_social',
        'nombre_comercial',
        'direccion',
        'ubigeo',
        'departamento',
        'provincia',
        'distrito',
        'telefono',
        'email',
        'serie_factura',
        'serie_boleta',
        'certificado_path',
        'logo_path',        // <-- AGREGADO: Para el logo del PDF
        'sol_usuario',
        'sol_clave',
        'sunat_url',
        'ambiente',
    ];

    protected $casts = [
        'sol_clave' => 'encrypted', // Encripta automáticamente al guardar/leer
    ];

    /**
     * Relación con el Team (Empresa)
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}