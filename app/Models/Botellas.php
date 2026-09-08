<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Botellas extends Model
{
    use HasFactory;


    protected $fillable = [

        'codigo',
        'nombre',
        'marca',
        'cantidad',

    ];

}