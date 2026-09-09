<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\Relation;

class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

protected $fillable = [
    'team_id',
    'item_type',
    'item_id',
    'tipo',
    'cantidad',
    'stock_resultante',
    'motivo',
    'submotivo',
    'referencia_type',
    'referencia_id',
    'proveedor',
    'user_id',
    'observaciones',
];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'stock_resultante' => 'decimal:2',
    ];

    public function item(): MorphTo
    {
        return $this->morphTo();
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::bootMorphMap();
    }

    protected static function bootMorphMap(): void
    {
        Relation::morphMap([
            'plato' => Plato::class,
            'insumo' => Insumo::class,
        ]);
    }
}
