<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string|null $usuario
 * @property string $password
 * @property string|null $pin
 * @property bool $is_active
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property int|null $current_team_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Team|null $currentTeam
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 */
#[Fillable(['name', 'email', 'password', 'current_team_id', 'pin', 'is_active', 'usuario'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'pin'])]
class User extends Authenticatable implements PasskeyUser
{
    use HasFactory, HasRoles, HasTeams, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable {
        HasTeams::teams insteadof HasRoles;
    }

    /**
     * Dynamically bind Spatie's team scope to Fortify/Jetstream's current_team_id.
     */
    public function getTeamIdAttribute(): ?int
    {
        return $this->current_team_id;
    }

    /**
     * Verify a 4-digit PIN for quick terminal authentication.
     */
    public function verificarPin(string $pin): bool
    {
        return $this->pin === $pin;
    }

    /**
     * Scope to filter only active employees.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
