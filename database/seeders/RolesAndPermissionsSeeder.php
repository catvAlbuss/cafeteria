<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Get or create the default team (sede)
        $team = Team::firstOrCreate(
            ['slug' => 'sede-principal'],
            ['name' => 'Sede Principal', 'is_personal' => false]
        );

        // Set the team context for Spatie
        app()[PermissionRegistrar::class]->setPermissionsTeamId($team->id);

        // Define all permissions
        $permissions = [
            // Mesero
            'crear pedidos',
            'modificar pedidos',
            'asignar mesas',
            'cambiar mesas',
            'dividir cuentas',
            'imprimir precuenta',
            // Cajero
            'procesar pagos',
            'apertura caja',
            'cierre caja',
            'aplicar descuentos',
            'reimprimir tickets',
            // Cocinero
            'visualizar comandas',
            'marcar pedido listo',
            'alertar falta insumos',
            // Supervisor
            'autorizar cancelaciones',
            'modificar precios emergencia',
            'visualizar reportes diarios',
            'reabrir mesas',
            'gestionar mesas',
            // Gerente
            'gestion inventarios',
            'configuracion sistema',
            'reportes financieros',
            // Visibilidad de páginas/menú (controla qué ve cada rol en el sidebar
            // y bloquea el acceso directo por URL a las mismas páginas)
            'ver mesas',
            'ver ventas',
            'ver caja',
            'ver contador',
            'ver reportes',
            'ver platos',
            'ver covers',
            'ver produccion',
            'ver cocina',
            'ver bar',
            'ver cardex',
            'ver mermas',
            'ver clientes',
            'ver delivery',
            'ver configuracion',
            'ver insumos',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Create roles and assign permissions
        $roleMesero = Role::firstOrCreate([
            'name' => 'Mesero',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleMesero->givePermissionTo([
            'crear pedidos',
            'modificar pedidos',
            'asignar mesas',
            'cambiar mesas',
            'dividir cuentas',
            'imprimir precuenta',
            'ver mesas',
            'ver ventas',
            'ver covers',
        ]);

        $roleCajero = Role::firstOrCreate([
            'name' => 'Cajero',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleCajero->givePermissionTo([
            'procesar pagos',
            'apertura caja',
            'cierre caja',
            'aplicar descuentos',
            'reimprimir tickets',
            'ver caja',
            'ver contador',
            'ver ventas',
            'ver mesas',
        ]);

        $roleCocinero = Role::firstOrCreate([
            'name' => 'Cocinero',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleCocinero->givePermissionTo([
            'visualizar comandas',
            'marcar pedido listo',
            'alertar falta insumos',
            'ver produccion',
            'ver cocina',
            'ver insumos',
        ]);

        $roleBar = Role::firstOrCreate([
            'name' => 'Bar',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleBar->givePermissionTo([
            'visualizar comandas',
            'marcar pedido listo',
            'alertar falta insumos',
            'ver produccion',
            'ver bar',
            'ver insumos',
        ]);

        $roleSupervisor = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleSupervisor->givePermissionTo([
            'autorizar cancelaciones',
            'modificar precios emergencia',
            'visualizar reportes diarios',
            'reabrir mesas',
            'gestionar mesas',
            'ver mesas',
            'ver ventas',
            'ver caja',
            'ver contador',
            'ver reportes',
            'ver platos',
            'ver covers',
            'ver produccion',
            'ver cocina',
            'ver bar',
            'ver cardex',
            'ver mermas',
            'ver clientes',
            'ver delivery',
            'ver insumos',
        ]);
        $roleGerente = Role::firstOrCreate([
            'name' => 'Gerente',
            'guard_name' => 'web',
            'team_id' => $team->id,
        ]);
        $roleGerente->givePermissionTo(Permission::all());
    }
}
