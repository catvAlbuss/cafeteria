<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    protected $primaryKey = 'idfactura';
    protected $table = 'facturas';
    public $timestamps = false;
    protected $fillable = [
        'serie',
        'correlativo',
        'vendedor',
        'montototal',
        'fecha_emitido',
        'Cliente',
        'documento'
    ];

    protected $casts = [
        'fecha_emitido' => 'datetime',
        'montototal' => 'decimal:2'
    ];

    // Accessors para las URLs (adaptados a las rutas de la cafetería)
    public function getPdfUrlAttribute()
    {
        $filename = str_replace('.pdf', '', $this->documento);
        return url("facturacion/pdf/{$filename}");
    }

    public function getXmlUrlAttribute()
    {
        $filename = str_replace('.pdf', '', $this->documento);
        return url("facturacion/xml/{$filename}");
    }

    public function getCdrUrlAttribute()
    {
        $filename = str_replace('.pdf', '', $this->documento);
        return url("facturacion/cdr/{$filename}");
    }
}