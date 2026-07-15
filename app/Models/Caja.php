<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    use BelongsToTeam, HasFactory;

    /**
     * `empleado` has no backing column (it's a computed accessor), so it
     * must be appended explicitly to show up in toArray()/JSON.
     */
    protected $appends = ['empleado'];

    protected $fillable = [
        'team_id',
        'user_id',
        'caja',
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

    /**
     * Get the pedidos for this caja.
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }

    /**
     * Get the user (empleado) who operates this caja.
     *
     * Named differently from the `empleado` accessor below: Eloquent's
     * toArray() merges relations on top of attributes, so a relation and
     * an accessor sharing the same key would silently overwrite the
     * accessor's string with the full related model.
     */
    public function empleadoUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the assigned empleado's name for display.
     */
    public function getEmpleadoAttribute(): ?string
    {
        return $this->relationLoaded('empleadoUser')
            ? $this->getRelation('empleadoUser')?->name
            : $this->empleadoUser()->value('name');
    }
}
