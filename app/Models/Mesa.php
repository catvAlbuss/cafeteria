<?php

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
    ];

    // Método para cambiar estado
    public function cambiarEstado(string $nuevoEstado): void
    {
        $this->estado = $nuevoEstado;
        $this->save();
    }
}