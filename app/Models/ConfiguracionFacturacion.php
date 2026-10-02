<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'sol_usuario',
        'sol_clave',
        'sunat_url',
        'ambiente',
    ];

    protected $casts = [
        'sol_clave' => 'encrypted',
    ];
}