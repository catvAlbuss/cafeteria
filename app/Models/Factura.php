<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Factura extends Model
{
    protected $primaryKey = 'idfactura';

    protected $table = 'facturas';

    // ✅ Eliminado $timestamps = false → Laravel manejará created_at/updated_at

    protected $fillable = [
        'team_id',          // <-- AGREGADO
        'serie',
        'correlativo',
        'vendedor',
        'montototal',
        'fecha_emitido',
        'Cliente',
        'documento',
        'estado_sunat',
        'error_sunat',
        'codigo_sunat',
    ];

    protected $casts = [
        'fecha_emitido' => 'datetime',
        'montototal' => 'decimal:2',
        'correlativo' => 'integer',
    ];

    /**
     * Relación con el Team (Empresa)
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

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