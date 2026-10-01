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
        'documento_cliente',
        'documento',
        'estado_sunat',
        'error_sunat',
        'codigo_sunat',
        'team_id',
    ];

    protected $casts = [
        'fecha_emitido' => 'datetime',
        'montototal' => 'decimal:2',
        'correlativo' => 'integer',
    ];

    /**
     * `documento` es el nombre del PDF emitido. Es null mientras el comprobante
     * no ha sido aceptado, por eso las URLs devuelven null en vez de una ruta
     * rota.
     */
    public function getPdfUrlAttribute(): ?string
    {
        $filename = $this->nombreArchivo();

        return $filename === null ? null : url("facturacion/pdf/{$filename}");
    }

    public function getXmlUrlAttribute(): ?string
    {
        $filename = $this->nombreArchivo();

        return $filename === null ? null : url("facturacion/xml/{$filename}");
    }

    public function getCdrUrlAttribute(): ?string
    {
        $filename = $this->nombreArchivo();

        return $filename === null ? null : url("facturacion/cdr/{$filename}");
    }

    private function nombreArchivo(): ?string
    {
        if ($this->documento === null || trim($this->documento) === '') {
            return null;
        }

        return str_replace('.pdf', '', $this->documento);
    }
}
