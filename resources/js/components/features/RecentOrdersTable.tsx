import React from 'react';

interface Order {
    id: string;
    customer: string;
    products: string;
    total: number;
    status: string;
    time: string;
}

interface RecentOrdersTableProps {
    orders: Order[];
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Entregado':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Preparando':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'En camino':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-sand text-chocolate dark:bg-roast dark:text-cocoa-soft';
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-card dark:border-sidebar-border dark:bg-roast/80">
            <h3 className="mb-4 text-lg font-semibold text-chocolate dark:text-cocoa">
                Pedidos recientes
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-sand dark:border-roast">
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Pedido
                            </th>
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Cliente
                            </th>
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Productos
                            </th>
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Total
                            </th>
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Estado
                            </th>
                            <th className="px-2 py-3 text-left text-sm font-medium text-cocoa dark:text-cocoa-soft">
                                Hora
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className="border-b border-sand hover:bg-cream-soft dark:border-roast dark:hover:bg-roast"
                            >
                                <td className="px-2 py-3 text-sm font-medium text-chocolate dark:text-cocoa">
                                    {order.id}
                                </td>
                                <td className="px-2 py-3 text-sm text-chocolate dark:text-cocoa-soft">
                                    {order.customer}
                                </td>
                                <td className="px-2 py-3 text-sm text-chocolate dark:text-cocoa-soft">
                                    {order.products}
                                </td>
                                <td className="px-2 py-3 text-sm font-medium text-chocolate dark:text-cocoa">
                                    S/ {order.total.toFixed(2)}
                                </td>
                                <td className="px-2 py-3 text-sm">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-sm text-cocoa dark:text-cocoa-soft">
                                    {order.time}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
