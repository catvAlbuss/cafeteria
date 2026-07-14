<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'codigo',
        'cliente',
        'telefono',
        'direccion',
        'productos',
        'total',
        'metodo_pago',
        'estado',
        'estado_delivery',
        'repartidor',
    ];

    protected $casts = [
        'productos' => 'array',
        'total' => 'decimal:2',
    ];
}