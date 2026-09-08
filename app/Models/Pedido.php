<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    protected $fillable = [
        'numero',
        'mesa_id',
        'mesa',        
        'cliente',
        'tipo',        
        'productos',
        'total',
        'estado',
        'observaciones',
        'hora_pedido',
        'hora_entrega',
        'caja_id',
        'metodo_pago',
        // 🚚 Campos de delivery
        'codigo',
        'telefono',
        'direccion',
        'repartidor',
        'estado_delivery',
    ];

    protected $casts = [
        'productos' => 'array',
        'hora_pedido' => 'datetime',
        'hora_entrega' => 'datetime',
    ];

    // Relación con mesa
    public function mesa()
    {
        return $this->belongsTo(Mesa::class);
    }

    // Relación con caja
    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    // Generar número de pedido automático
    public static function generarNumero()
    {
        $ultimo = self::orderBy('id', 'desc')->first();
        $numero = $ultimo ? intval(substr($ultimo->numero, 1)) + 1 : 1;
        return '#' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }
}