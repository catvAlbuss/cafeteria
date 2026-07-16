<?php

namespace Database\Seeders;

use App\Models\Plato;
use App\Models\Team;
use Illuminate\Database\Seeder;

class PlatosSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::where('slug', 'sede-principal')->firstOrFail();

        $platos = [
            ['nombre' => 'Cafe Americano', 'categoria' => 'Bebidas', 'descripcion' => 'Cafe negro intenso para servicio rapido.', 'precio' => 7.50, 'stock' => 60, 'vendidos' => 35, 'imagen' => '/img/productos/cafe_americano.png'],
            ['nombre' => 'Cappuccino Clasico', 'categoria' => 'Bebidas', 'descripcion' => 'Espresso con leche vaporizada y espuma.', 'precio' => 10.00, 'stock' => 45, 'vendidos' => 52, 'imagen' => '/img/productos/cappuccino.png'],
            ['nombre' => 'Latte Vainilla', 'categoria' => 'Bebidas', 'descripcion' => 'Latte suave con jarabe de vainilla.', 'precio' => 12.00, 'stock' => 40, 'vendidos' => 28, 'imagen' => '/img/productos/latte.jpg'],
            ['nombre' => 'Frappuccino Mocha', 'categoria' => 'Bebidas', 'descripcion' => 'Bebida fria con cafe, chocolate y crema.', 'precio' => 15.00, 'stock' => 30, 'vendidos' => 18, 'imagen' => '/img/productos/mocha.png'],
            ['nombre' => 'Croissant Mantequilla', 'categoria' => 'Panaderia', 'descripcion' => 'Croissant hojaldrado recien horneado.', 'precio' => 8.00, 'stock' => 35, 'vendidos' => 44, 'imagen' => '/img/productos/Croissant.png'],
            ['nombre' => 'Sandwich de Pollo', 'categoria' => 'Comida', 'descripcion' => 'Pan artesanal, pollo, lechuga y salsa de casa.', 'precio' => 18.00, 'stock' => 24, 'vendidos' => 31, 'imagen' => '/img/productos/SandwichDePollo.png'],
            ['nombre' => 'Hamburguesa Cafe', 'categoria' => 'Comida', 'descripcion' => 'Hamburguesa de la casa con papas.', 'precio' => 24.00, 'stock' => 18, 'vendidos' => 21, 'imagen' => '/img/productos/placeholder.jpeg'],
            ['nombre' => 'Waffles con Fruta', 'categoria' => 'Comida', 'descripcion' => 'Waffles con miel, fresas y platano.', 'precio' => 19.00, 'stock' => 16, 'vendidos' => 16, 'imagen' => '/img/productos/placeholder.jpeg'],
            ['nombre' => 'Cheesecake de Fresa', 'categoria' => 'Postres', 'descripcion' => 'Porcion de cheesecake con salsa de fresa.', 'precio' => 13.00, 'stock' => 20, 'vendidos' => 37, 'imagen' => '/img/productos/Cheesecake.png'],
            ['nombre' => 'Brownie Chocolate', 'categoria' => 'Postres', 'descripcion' => 'Brownie humedo con chocolate bitter.', 'precio' => 9.50, 'stock' => 28, 'vendidos' => 49, 'imagen' => '/img/productos/placeholder.jpeg'],
            ['nombre' => 'Tiramisu', 'categoria' => 'Postres', 'descripcion' => 'Postre frio con cafe y mascarpone.', 'precio' => 14.00, 'stock' => 12, 'vendidos' => 14, 'imagen' => '/img/productos/CheesecakeClasica.png'],
            ['nombre' => 'Jugo de Naranja', 'categoria' => 'Bebidas', 'descripcion' => 'Jugo natural recien exprimido.', 'precio' => 9.00, 'stock' => 32, 'vendidos' => 20, 'imagen' => '/img/productos/jugoNatural.png'],
        ];

        foreach ($platos as $plato) {
            Plato::withoutGlobalScopes()->updateOrCreate(
                ['team_id' => $team->id, 'nombre' => $plato['nombre']],
                [
                    'categoria' => $plato['categoria'],
                    'descripcion' => $plato['descripcion'],
                    'precio' => $plato['precio'],
                    'stock' => $plato['stock'],
                    'vendidos' => $plato['vendidos'],
                    'imagen' => $plato['imagen'],
                    'disponible' => $plato['stock'] > 0,
                ],
            );
        }
    }
}
