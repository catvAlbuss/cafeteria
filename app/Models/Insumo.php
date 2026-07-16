<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Insumo extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'nombre',
        'categoria',
        'unidad',
        'stock',
        'precio',
        'proveedor',
        'activo',
    ];

    protected $casts = [
        'stock' => 'decimal:2',
        'precio' => 'decimal:2',
        'activo' => 'boolean',
    ];

    public function recetas(): HasMany
    {
        return $this->hasMany(Receta::class);
    }

    public function movimientos()
    {
        return $this->morphMany(MovimientoInventario::class, 'item');
    }
}