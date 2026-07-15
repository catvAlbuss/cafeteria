<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mesa extends Model
{
    use BelongsToTeam;

    /**
     * `mesero` has no backing column (it's a computed accessor), so it must
     * be appended explicitly to show up in toArray()/JSON.
     */
    protected $appends = ['mesero'];

    protected $fillable = [
        'team_id',
        'numero',
        'capacidad',
        'sillas',
        'estado',
        'cliente',
        'personas',
        'user_id',
    ];

    public function cambiarEstado(string $nuevoEstado): void
    {
        $this->estado = $nuevoEstado;
        $this->save();
    }

    /**
     * Get the pedidos for this mesa.
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }

    /**
     * Get the mesero (user) assigned to this mesa.
     *
     * Named differently from the `mesero` accessor below: Eloquent's
     * toArray() merges relations on top of attributes, so a relation and
     * an accessor sharing the same key would silently overwrite the
     * accessor's string with the full related model.
     */
    public function meseroUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the assigned mesero's name for display.
     */
    public function getMeseroAttribute(): ?string
    {
        return $this->relationLoaded('meseroUser')
            ? $this->getRelation('meseroUser')?->name
            : $this->meseroUser()->value('name');
    }
}
