<?php

namespace App\Services;

use App\Models\Insumo;
use App\Models\Pedido;

class ProductionSummary
{
    /**
     * @param  array<int, string>  $areas
     * @return array<string, mixed>
     */
    public function forTeamAndAreas(int $teamId, array $areas): array
    {
        $inventoryArea = in_array('bar', $areas, true) ? 'bar' : 'cocina';
        $pedidosTerminadosHoy = Pedido::query()
            ->where('team_id', $teamId)
            ->whereIn('area', $areas)
            ->whereIn('estado', ['listo', 'entregado', 'pagado'])
            ->whereDate('created_at', today())
            ->get(['area', 'productos']);

        $cantidadPorArea = collect(['cocina', 'bar', 'horno', 'postres'])
            ->mapWithKeys(fn (string $area) => [$area => 0]);

        foreach ($pedidosTerminadosHoy as $pedido) {
            $cantidad = collect($pedido->productos ?? [])->sum(fn (array $producto) => (int) ($producto['cantidad'] ?? 1));
            $cantidadPorArea[$pedido->area] = ($cantidadPorArea[$pedido->area] ?? 0) + $cantidad;
        }

        $productosMasPedidos = [];
        $pedidosRecientes = Pedido::query()
            ->where('team_id', $teamId)
            ->whereIn('area', $areas)
            ->whereIn('estado', ['listo', 'entregado', 'pagado'])
            ->where('created_at', '>=', now()->subDays(30))
            ->get(['productos']);

        foreach ($pedidosRecientes as $pedido) {
            foreach ($pedido->productos ?? [] as $producto) {
                $nombre = (string) ($producto['nombre'] ?? 'Producto');
                $productosMasPedidos[$nombre] = ($productosMasPedidos[$nombre] ?? 0) + (int) ($producto['cantidad'] ?? 1);
            }
        }

        arsort($productosMasPedidos);

        $insumos = Insumo::query()
            ->where('team_id', $teamId)
            ->where('area', $inventoryArea)
            ->where('activo', true)
            ->get(['id', 'nombre', 'unidad', 'stock', 'stock_minimo', 'fecha_vencimiento']);

        $stockEscaso = $insumos
            ->filter(fn (Insumo $insumo) => (float) $insumo->stock <= (float) $insumo->stock_minimo)
            ->sortBy(fn (Insumo $insumo) => (float) $insumo->stock - (float) $insumo->stock_minimo)
            ->take(6)
            ->map(fn (Insumo $insumo) => [
                'id' => $insumo->id,
                'nombre' => $insumo->nombre,
                'stock' => (float) $insumo->stock,
                'stock_minimo' => (float) $insumo->stock_minimo,
                'unidad' => $insumo->unidad,
            ])->values();

        $porVencer = $insumos
            ->filter(fn (Insumo $insumo) => $insumo->fecha_vencimiento
                && $insumo->fecha_vencimiento->between(today(), today()->addDays(3)))
            ->sortBy('fecha_vencimiento')
            ->take(6)
            ->map(fn (Insumo $insumo) => [
                'id' => $insumo->id,
                'nombre' => $insumo->nombre,
                'fecha_vencimiento' => $insumo->fecha_vencimiento?->toDateString(),
                'dias' => today()->diffInDays($insumo->fecha_vencimiento, false),
            ])->values();

        return [
            'platosHoy' => $cantidadPorArea->sum(),
            'porArea' => $cantidadPorArea,
            'productosMasPedidos' => collect($productosMasPedidos)
                ->take(5)
                ->map(fn (int $cantidad, string $nombre) => compact('nombre', 'cantidad'))
                ->values(),
            'stockEscaso' => $stockEscaso,
            'porVencer' => $porVencer,
            'totalInsumos' => $insumos->count(),
            'inventario' => $insumos
                ->sortBy('nombre')
                ->map(fn (Insumo $insumo) => [
                    'id' => $insumo->id,
                    'nombre' => $insumo->nombre,
                    'stock' => (float) $insumo->stock,
                    'stock_minimo' => (float) $insumo->stock_minimo,
                    'unidad' => $insumo->unidad,
                    'fecha_vencimiento' => $insumo->fecha_vencimiento?->toDateString(),
                ])->values(),
        ];
    }
}
