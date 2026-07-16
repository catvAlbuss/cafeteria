<?php

namespace Database\Seeders;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DemoUsersSeeder extends Seeder
{
    private const DEMO_PASSWORD = 'password';

    public function run(): void
    {
        $team = Team::where('slug', 'sede-principal')->firstOrFail();

        app()[PermissionRegistrar::class]->setPermissionsTeamId($team->id);

        $empleados = [
            ['name' => 'Administrador', 'email' => 'admin@cafeteria.test', 'usuario' => 'admin', 'pin' => '0000', 'role' => 'Gerente', 'teamRole' => TeamRole::Owner],
            ['name' => 'Mesero Demo', 'email' => 'mesero@cafeteria.test', 'usuario' => 'mesero', 'pin' => '1234', 'role' => 'Mesero', 'teamRole' => TeamRole::Member],
            ['name' => 'Ana Torres', 'email' => 'ana.mesera@cafeteria.test', 'usuario' => 'mesera.ana', 'pin' => '1235', 'role' => 'Mesero', 'teamRole' => TeamRole::Member],
            ['name' => 'Carlos Ruiz', 'email' => 'carlos.mesero@cafeteria.test', 'usuario' => 'mesero.carlos', 'pin' => '1236', 'role' => 'Mesero', 'teamRole' => TeamRole::Member],
            ['name' => 'Luis Perez', 'email' => 'luis.mesero@cafeteria.test', 'usuario' => 'mesero.luis', 'pin' => '1237', 'role' => 'Mesero', 'teamRole' => TeamRole::Member],
            ['name' => 'Cajero Demo', 'email' => 'cajero@cafeteria.test', 'usuario' => 'cajero', 'pin' => '5678', 'role' => 'Cajero', 'teamRole' => TeamRole::Member],
            ['name' => 'Cocinero Demo', 'email' => 'cocinero@cafeteria.test', 'usuario' => 'cocinero', 'pin' => '9012', 'role' => 'Cocinero', 'teamRole' => TeamRole::Member],
        ];

        foreach ($empleados as $datos) {
            $user = User::updateOrCreate(
                ['usuario' => $datos['usuario']],
                [
                    'name' => $datos['name'],
                    'email' => $datos['email'],
                    'password' => self::DEMO_PASSWORD,
                    'pin' => $datos['pin'],
                    'is_active' => true,
                    'current_team_id' => $team->id,
                ],
            );

            $team->members()->syncWithoutDetaching([$user->id => ['role' => $datos['teamRole']->value]]);
            $user->switchTeam($team);
            $user->assignRole($datos['role']);
        }

        $this->command?->table(
            ['Rol', 'Correo', 'Contrasena', 'PIN'],
            collect($empleados)->map(fn ($empleado) => [$empleado['role'], $empleado['email'], self::DEMO_PASSWORD, $empleado['pin']])->all(),
        );
    }
}
