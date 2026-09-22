<?php

namespace Database\Factories;

use App\Models\Cliente;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'tipo_documento' => null,
            'documento' => null,
            'nombre' => fake()->name(),
            'telefono' => fake()->numerify('9########'),
            'email' => fake()->safeEmail(),
            'direccion' => fake()->address(),
            'estado' => Cliente::ESTADO_INACTIVO,
            'ultima_visita' => null,
            'pedidos_total' => 0,
            'pedidos_30d' => 0,
            'total_gastado_30d' => 0,
            'total_gastado' => 0,
        ];
    }

    /**
     * Indicate that the client is identified with a DNI.
     */
    public function conDni(?string $documento = null): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo_documento' => 'dni',
            'documento' => $documento ?? fake()->numerify('########'),
        ]);
    }

    /**
     * Indicate that the client is identified with a RUC.
     */
    public function conRuc(?string $documento = null): static
    {
        return $this->state(fn (array $attributes) => [
            'tipo_documento' => 'ruc',
            'documento' => $documento ?? fake()->numerify('###########'),
        ]);
    }

    /**
     * Indicate that the client is a VIP.
     */
    public function vip(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => Cliente::ESTADO_VIP,
        ]);
    }
}
