<?php

use App\Models\Cover;
use App\Models\Mesa;
use App\Models\Plato;
use App\Models\Team;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('demo seeders are repeatable and create valid test data', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    $team = Team::query()->where('slug', 'sede-principal')->firstOrFail();
    $users = User::query()->where('current_team_id', $team->id)->get();

    expect($users)->toHaveCount(7)
        ->and($users->pluck('email')->unique())->toHaveCount(7)
        ->and($users->pluck('usuario')->unique())->toHaveCount(7)
        ->and($users->pluck('pin')->unique())->toHaveCount(7)
        ->and($users->filter(fn (User $user): bool => $user->hasRole('Mesero')))->toHaveCount(4)
        ->and($team->members()->count())->toBe(7)
        ->and(Mesa::withoutGlobalScopes()->where('team_id', $team->id)->count())->toBe(12)
        ->and(Plato::withoutGlobalScopes()->where('team_id', $team->id)->count())->toBe(12)
        ->and(Cover::withoutGlobalScopes()->where('team_id', $team->id)->count())->toBe(6);

    $users->each(function (User $user): void {
        expect(filter_var($user->email, FILTER_VALIDATE_EMAIL))->not->toBeFalse();
    });
});
