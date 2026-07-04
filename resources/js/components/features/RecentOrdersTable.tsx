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
        switch(status) {
            case 'Entregado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Preparando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'En camino': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pedidos recientes</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Pedido</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Productos</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{order.id}</td>
                                <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{order.customer}</td>
                                <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">{order.products}</td>
                                <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">S/ {order.total.toFixed(2)}</td>
                                <td className="py-3 px-2 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{order.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}