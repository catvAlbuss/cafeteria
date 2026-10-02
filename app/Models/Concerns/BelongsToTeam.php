<?php

namespace App\Models\Concerns;

trait BelongsToTeam
{
    protected static function bootBelongsToTeam()
    {
        // Al crear un registro, asignar team_id automáticamente
        static::creating(function ($model) {
            if (auth()->check() && ! $model->team_id) {
                $model->team_id = auth()->user()->current_team_id;
            }
        });

        // Al consultar, filtrar automáticamente por team_id
        static::addGlobalScope('team', function ($query) {
            if (auth()->check()) {
                $query->where('team_id', auth()->user()->current_team_id);
            }
        });
    }
}