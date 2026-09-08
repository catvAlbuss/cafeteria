<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventarios extends Model
{
    use HasFactory;


    protected $table = 'inventarios';


    protected $fillable = [

        'codigo',
        'nombre',
        'marca',
        'stock',
        'areas_id',
        'cant_mant',
        'mant_1',
        'mant_2',
        'mant_3',
        'especificaciones',

    ];



    public function area()
    {
        return $this->belongsTo(Areas::class, 'areas_id');
    }

}