<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    use HasFactory;

    protected $fillable = [
        'caja',
        'empleado',
        'turno',
        'monto_inicial',
        'fecha_apertura',
        'monto_final',
        'ventas_dia',
        'observaciones',
        'fecha_cierre',
        'estado',
        'total_ventas_caja',
        'total_deliverys',
        'total_pedidos_mesa',
        'total_pedidos',
        'detalle_pedidos',
    ];

    protected $casts = [
        'detalle_pedidos' => 'array',
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }
}