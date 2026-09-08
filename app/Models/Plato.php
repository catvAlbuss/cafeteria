<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Plato extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'nombre',
        'categoria',
        'descripcion',
        'precio',
        'stock',
        'vendidos',
        'imagen',
        'disponible',

        'modificado',
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
