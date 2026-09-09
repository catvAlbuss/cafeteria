import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change: number;
}

export default function StatsCard({ title, value, change }: StatsCardProps) {
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
            <span className={`text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
                {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}% vs ayer
            </span>
        </div>
    );
}