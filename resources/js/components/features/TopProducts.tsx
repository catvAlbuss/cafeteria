import React from 'react';

interface Product {
    name: string;
    sales: number;
}

interface TopProductsProps {
    products: Product[];
}

export default function TopProducts({ products }: TopProductsProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Más vendidos</h3>
            <ul className="space-y-3">
                {products.map((product, index) => (
                    <li key={index} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{product.sales} ventas</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}