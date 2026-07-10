<?php

// DESPUÉS

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mesa extends Model
{
    protected $fillable = [
        'numero',
        'capacidad',
        'sillas',
        'estado',
        'cliente',
        'personas',
        'mesero',
    ];

    public function cambiarEstado(string $nuevoEstado): void
    {
        $this->estado = $nuevoEstado;
        $this->save();
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }
}