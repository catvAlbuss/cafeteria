<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;


class Cover extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'titulo',
        'descripcion',
        'tipo',
        'estado',
        'imagen',
        'fecha_inicio',
        'fecha_fin',
        'clicks',
        'categoria',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'clicks' => 'integer',
    ];
}
