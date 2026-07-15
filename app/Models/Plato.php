<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plato extends Model
{
    protected $fillable = [
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