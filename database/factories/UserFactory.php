<?php

namespace Database\Factories;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'usuario' => fake()->unique()->userName(),
            'dni' => fake()->unique()->numerify('########'),
            'telefono' => fake()->numerify('9########'),
            'direccion' => fake()->address(),
            'nro_hijos' => fake()->numberBetween(0, 4),
            'afiliado' => fake()->randomElement(['ONP', 'AFP']),
            'asegurado' => fake()->randomElement(['ESSALUD', 'SIS']),
            'modalidad_trabajo' => fake()->randomElement(['part_time', 'full_time', 'online']),
            'retencion' => fake()->randomFloat(2, 0, 500),
            'ingreso_panilla' => fake()->numerify('PLL-####'),
            'fecha_nacimiento' => fake()->date('Y-m-d', '-18 years'),
            'fecha_ingreso' => fake()->date('Y-m-d'),
            'fecha_cese' => fake()->date('Y-m-d'),
            'modalidad_pago' => fake()->randomElement(['semanal', 'quincenal', 'mensual']),
            'salario' => fake()->randomFloat(2, 1000, 5000),
            'foto' => 'default.png',
            'estado' => true,
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function ($user) {
            // If the user was already assigned to a team (e.g. an employee seeded
            // directly into a sede), skip creating a personal team for them.
            if ($user->current_team_id) {
                return;
            }

            $team = Team::factory()->personal()->create([
                'name' => $user->name."'s Team",
            ]);

            $team->members()->attach($user, [
                'role' => TeamRole::Owner->value,
            ]);

            $user->switchTeam($team);
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
