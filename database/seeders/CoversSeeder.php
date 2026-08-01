<?php

namespace Database\Seeders;

use App\Models\Cover;
use App\Models\Team;
use Illuminate\Database\Seeder;

class CoversSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::where('slug', 'sede-principal')->firstOrFail();
        $covers = [
            ['titulo' => 'Happy Hour Cafe', 'descripcion' => '2x1 en bebidas seleccionadas de 5pm a 7pm.', 'tipo' => 'promocion', 'estado' => 'activo', 'fecha_inicio' => '2026-07-01', 'fecha_fin' => '2026-07-31', 'clicks' => 420, 'categoria' => 'Bebidas', 'color' => '8A5A2B'],
            ['titulo' => 'Postre de la Semana', 'descripcion' => 'Cheesecake y brownie con descuento especial.', 'tipo' => 'promocion', 'estado' => 'activo', 'fecha_inicio' => '2026-07-10', 'fecha_fin' => '2026-07-20', 'clicks' => 260, 'categoria' => 'Postres', 'color' => 'B45309'],
            ['titulo' => 'Brunch Familiar', 'descripcion' => 'Combos para mesas familiares durante el fin de semana.', 'tipo' => 'evento', 'estado' => 'programado', 'fecha_inicio' => '2026-08-01', 'fecha_fin' => '2026-08-31', 'clicks' => 155, 'categoria' => 'Familiar', 'color' => '047857'],
            ['titulo' => 'Temporada de Invierno', 'descripcion' => 'Bebidas calientes y panes artesanales.', 'tipo' => 'temporada', 'estado' => 'activo', 'fecha_inicio' => '2026-06-01', 'fecha_fin' => '2026-08-31', 'clicks' => 312, 'categoria' => 'Temporada', 'color' => '1D4ED8'],
            ['titulo' => 'Fiestas Patrias', 'descripcion' => 'Menu especial de celebracion para grupos.', 'tipo' => 'festividad', 'estado' => 'programado', 'fecha_inicio' => '2026-07-25', 'fecha_fin' => '2026-07-29', 'clicks' => 198, 'categoria' => 'Festivo', 'color' => 'DC2626'],
            ['titulo' => 'Cafe para Llevar', 'descripcion' => 'Promocion de cafe y croissant para delivery.', 'tipo' => 'promocion', 'estado' => 'pausado', 'fecha_inicio' => '2026-07-01', 'fecha_fin' => '2026-07-15', 'clicks' => 86, 'categoria' => 'Delivery', 'color' => '7C3AED'],
        ];
        foreach ($covers as $cover) {
            Cover::withoutGlobalScopes()->updateOrCreate(
                ['team_id' => $team->id, 'titulo' => $cover['titulo']],
                [
                    'descripcion' => $cover['descripcion'],
                    'tipo' => $cover['tipo'],
                    'estado' => $cover['estado'],
                    'imagen' => $this->demoSvg($cover['titulo'], $cover['color'], 'FFFFFF', 600, 300),
                    'fecha_inicio' => $cover['fecha_inicio'],
                    'fecha_fin' => $cover['fecha_fin'],
                    'clicks' => $cover['clicks'],
                    'categoria' => $cover['categoria'],
                ],
            );
        }
    }

    private function demoSvg(string $text, string $background, string $foreground, int $width, int $height): string
    {
        $label = htmlspecialchars($text, ENT_QUOTES);

        return "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{$width}\" 
        height=\"{$height}\" viewBox=\"0 0 {$width} {$height}\"><rect width=\"{$width}\" height=\"{$height}\" 
        rx=\"18\" fill=\"%23{$background}\"/><text x=\"50%25\" y=\"52%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23{$foreground}\" font-family=\"Arial\" font-size=\"28\" font-weight=\"700\">{$label}</text></svg>";
    }
}
