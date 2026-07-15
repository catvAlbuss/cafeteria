<?php

namespace App\Traits;

use App\Models\Team;
use App\Models\User;
use App\Scopes\TeamScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Trait that provides automatic team scoping for multi-tenant models.
 *
 * Automatically filters queries by the authenticated user's current team
 * and auto-assigns team_id when creating new records.
 */
trait BelongsToTeam
{
    /**
     * Boot the trait and register the global scope + creating event.
     */
    public static function bootBelongsToTeam(): void
    {
        static::addGlobalScope(new TeamScope);

        static::creating(function ($model) {
            if (Auth::check() && Auth::user()->current_team_id && empty($model->team_id)) {
                $model->team_id = Auth::user()->current_team_id;
            }
        });
    }

    /**
     * Get the team (sede) that owns this record.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }
}
