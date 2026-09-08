<?php

namespace App\Services;

use Illuminate\Support\Str;

class ProductionAreaClassifier
{
    /**
     * @var array<string, array<int, string>>
     */
    private const KEYWORDS = [
        'bar' => ['bebida', 'café', 'cafe', 'jugo', 'licor', 'coctel', 'infusión', 'té', 'cerveza', 'vino', 'refresco', 'cappuccino', 'latte', 'chocolate caliente', 'frappé', 'frappe', 'limonada', 'agua', 'gaseosa', 'smoothie', 'batido', 'espresso', 'americano'],
        'horno' => ['pan', 'pastel', 'pizza', 'horneado', 'croissant', 'muffin', 'bagel', 'galleta', 'tarta', 'quiche', 'focaccia', 'brioche'],
        'postres' => ['postre', 'helado', 'torta', 'dulce', 'flan', 'cheesecake', 'brownie', 'tiramisú', 'tirami', 'alfajor', 'donut', 'mousse', 'crepe', 'tres leches', 'pie'],
        'cocina' => ['plato', 'entrada', 'sopa', 'comida', 'principal', 'carne', 'pescado', 'pollo', 'hamburguesa', 'sandwich', 'sándwich', 'lomo', 'arroz', 'pasta', 'ensalada'],
    ];

    /**
     * @param  array<int, array<string, mixed>>  $products
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function group(array $products, string $fallbackArea = 'cocina'): array
    {
        return collect($products)
            ->groupBy(fn (array $product): string => $this->detect($product, $fallbackArea))
            ->map(fn ($areaProducts): array => $areaProducts->values()->all())
            ->all();
    }

    /** @param array<string, mixed> $product */
    public function detect(array $product, string $fallbackArea = 'cocina'): string
    {
        $description = Str::of(($product['nombre'] ?? '').' '.($product['categoria'] ?? ''))
            ->lower()
            ->squish()
            ->toString();

        foreach (self::KEYWORDS as $area => $keywords) {
            if (Str::contains($description, $keywords)) {
                return $area;
            }
        }

        return in_array($fallbackArea, ['cocina', 'bar', 'horno', 'postres'], true)
            ? $fallbackArea
            : 'cocina';
    }
}
