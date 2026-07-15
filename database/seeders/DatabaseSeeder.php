<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            DemoUsersSeeder::class,
            PlatosSeeder::class,
            MesasSeeder::class,
            CoversSeeder::class,
        ]);

        $this->command?->info('Datos demo creados para Sede Principal.');
    }
}
