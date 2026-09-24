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
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-card dark:border-sidebar-border dark:bg-roast/80">
            <h3 className="mb-4 text-lg font-semibold text-chocolate dark:text-cocoa">
                Más vendidos
            </h3>
            <ul className="space-y-3">
                {products.map((product, index) => (
                    <li
                        key={index}
                        className="flex items-center justify-between border-b border-sand pb-2 last:border-0 dark:border-roast"
                    >
                        <span className="text-sm font-medium text-chocolate dark:text-cocoa">
                            {product.name}
                        </span>
                        <span className="text-sm text-cocoa dark:text-cocoa-soft">
                            {product.sales} ventas
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
