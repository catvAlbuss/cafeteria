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
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-card dark:border-sidebar-border dark:bg-roast/80">
            <h3 className="text-sm font-medium text-cocoa dark:text-cocoa-soft">
                {title}
            </h3>
            <p className="mt-2 text-2xl font-bold text-chocolate dark:text-cocoa">
                {value}
            </p>
            <span
                className={`text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-cocoa'}`}
            >
                {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
                vs ayer
            </span>
        </div>
    );
}
