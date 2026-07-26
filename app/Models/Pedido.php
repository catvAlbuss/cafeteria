<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pedido extends Model
{
    use BelongsToTeam;

    protected $fillable = [
        'team_id',
        'user_id',
        'numero',
        'mesa_id',
        'mesa',
        'cliente',
        'tipo',
        'productos',
        'total',
        'estado',
        'area',
        'observaciones',
        'hora_pedido',
        'hora_entrega',
        'caja_id',
        'venta_grupo', 
        'metodo_pago',

        'subtotal',
        'igv',
        // Campos de delivery
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
        'total' => 'decimal:2',
    ];

    /**
     * Get the mesa for this pedido.
     */
    public function mesa(): BelongsTo
    {
        return $this->belongsTo(Mesa::class);
    }

    /**
     * Get the caja for this pedido.
     */
    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class);
    }

    /**
     * Get the user (empleado) who created this pedido.
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Generate an automatic order number.
     */
    public static function generarNumero(): string
    {
        $lastOrder = self::withoutGlobalScopes()
            ->select(['id'])
            ->latest('id')
            ->lockForUpdate()
            ->first();
        $number = $lastOrder ? $lastOrder->id + 1 : 1;

        do {
            $orderNumber = '#'.str_pad((string) $number, 4, '0', STR_PAD_LEFT);
            $number++;
        } while (self::withoutGlobalScopes()->where('numero', $orderNumber)->exists());

        return $orderNumber;
    }
  
}
