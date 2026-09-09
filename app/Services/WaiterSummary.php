<?php

namespace App\Services;

use App\Models\Mesa;
use App\Models\Pedido;
use Illuminate\Database\Eloquent\Builder;

class WaiterSummary
{
    /**
     * @return array<string, mixed>
     */
    public function forUser(int $teamId, int $userId): array
    {
        $orders = $this->ordersQuery($teamId, $userId);
        $completedOrders = (clone $orders)->whereIn('estado', ['entregado', 'pagado']);
        $recentCompletedOrders = (clone $completedOrders)
            ->where('created_at', '>=', now()->subDays(30))
            ->get(['productos']);
        [$topProducts, $topCategories] = $this->productRankings($recentCompletedOrders->pluck('productos')->all());

        $mostFrequentTable = (clone $completedOrders)
            ->whereNotNull('mesa_id')
            ->selectRaw('mesa_id, COUNT(*) as visits')
            ->groupBy('mesa_id')
            ->orderByDesc('visits')
            ->first();
        $table = $mostFrequentTable
            ? Mesa::query()->find($mostFrequentTable->mesa_id, ['id', 'numero'])
            : null;

        $topCustomer = (clone $completedOrders)
            ->whereNotNull('cliente')
            ->where('cliente', '!=', '')
            ->where('cliente', '!=', 'Anónimo')
            ->selectRaw('cliente, SUM(total) as total, COUNT(*) as orders_count')
            ->groupBy('cliente')
            ->orderByDesc('total')
            ->first();

        return [
            'salesToday' => (float) (clone $completedOrders)->whereDate('created_at', today())->sum('total'),
            'ordersToday' => (clone $orders)->whereDate('created_at', today())->where('estado', '!=', 'cancelado')->count(),
            'activeTables' => Mesa::query()->where('user_id', $userId)->whereIn('estado', ['ocupada', 'listo_cobrar'])->count(),
            'readyOrders' => (clone $orders)->where('estado', 'listo')->count(),
            'topProducts' => $topProducts,
            'topCategories' => $topCategories,
            'mostFrequentTable' => $table ? [
                'numero' => $table->numero,
                'visits' => (int) $mostFrequentTable->visits,
            ] : null,
            'topCustomer' => $topCustomer ? [
                'name' => $topCustomer->cliente,
                'total' => (float) $topCustomer->total,
                'orders' => (int) $topCustomer->orders_count,
            ] : null,
        ];
    }

    private function ordersQuery(int $teamId, int $userId): Builder
    {
        return Pedido::query()->where('team_id', $teamId)->where('user_id', $userId);
    }

    /**
     * @param  array<int, array<int, array<string, mixed>>>  $ordersProducts
     * @return array{0: array<int, array{name: string, quantity: int, total: float}>, 1: array<int, array{name: string, quantity: int, total: float}>}
     */
    private function productRankings(array $ordersProducts): array
    {
        $products = [];
        $categories = [];

        foreach ($ordersProducts as $orderProducts) {
            foreach ($orderProducts ?? [] as $product) {
                $name = (string) ($product['nombre'] ?? 'Producto');
                $category = (string) ($product['categoria'] ?? 'Sin categoría');
                $quantity = (int) ($product['cantidad'] ?? 1);
                $total = (float) ($product['subtotal'] ?? ((float) ($product['precio'] ?? 0) * $quantity));
                $products[$name] ??= ['name' => $name, 'quantity' => 0, 'total' => 0.0];
                $categories[$category] ??= ['name' => $category, 'quantity' => 0, 'total' => 0.0];
                $products[$name]['quantity'] += $quantity;
                $products[$name]['total'] += $total;
                $categories[$category]['quantity'] += $quantity;
                $categories[$category]['total'] += $total;
            }
        }

        $sort = fn (array $items): array => collect($items)->sortByDesc('quantity')->take(5)->values()->all();

        return [$sort($products), $sort($categories)];
    }
}
