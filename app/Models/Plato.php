<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;

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
}
