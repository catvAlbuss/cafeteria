<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaCredito extends Model
{
    protected $table = 'notas_credito';

    protected $fillable = [
        'factura_id',
        'serie',
        'correlativo',
        'tipo_documento',
        'motivo_codigo',
        'motivo_descripcion',
        'monto',
        'cliente',
        'cliente_documento',
        'estado_sunat',
        'codigo_sunat',
        'error_sunat',
        'documento',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class, 'factura_id', 'idfactura');
    }
}