<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'user_id',
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

    /**
     * Get the user (empleado) who registered this delivery.
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
