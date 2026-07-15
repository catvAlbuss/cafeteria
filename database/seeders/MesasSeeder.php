<?php

namespace Database\Seeders;

use App\Models\Mesa;
use App\Models\Team;
use Illuminate\Database\Seeder;

class MesasSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::where('slug', 'sede-principal')->firstOrFail();

        $mesas = [
            ['numero' => '01', 'capacidad' => 2],
            ['numero' => '02', 'capacidad' => 2],
            ['numero' => '03', 'capacidad' => 4],
            ['numero' => '04', 'capacidad' => 4],
            ['numero' => '05', 'capacidad' => 4],
            ['numero' => '06', 'capacidad' => 6],
            ['numero' => '07', 'capacidad' => 6],
            ['numero' => '08', 'capacidad' => 8],
            ['numero' => '09', 'capacidad' => 4],
            ['numero' => '10', 'capacidad' => 2],
            ['numero' => '11', 'capacidad' => 6],
            ['numero' => '12', 'capacidad' => 8],
        ];

        foreach ($mesas as $mesa) {
            Mesa::withoutGlobalScopes()->updateOrCreate(
                ['numero' => $mesa['numero']],
                [
                    'team_id' => $team->id,
                    'capacidad' => $mesa['capacidad'],
                    'sillas' => $mesa['capacidad'],
                    'estado' => 'libre',
                    'cliente' => null,
                    'personas' => null,
                    'user_id' => null,
                ],
            );
        }
    }
}
