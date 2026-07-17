<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Insumo extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'nombre',
        'categoria',
        'area',
        'unidad',
        'stock',
        'stock_minimo',
        'fecha_vencimiento',
        'precio',
        'proveedor',
        'activo',
    ];

    protected $casts = [
        'stock' => 'decimal:2',
        'stock_minimo' => 'decimal:2',
        'fecha_vencimiento' => 'date',
        'precio' => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function recetas(): HasMany
    {
        return $this->hasMany(Receta::class);
    }

    public function movimientos(): MorphMany
    {
        return $this->morphMany(MovimientoInventario::class, 'item');
    }
}
