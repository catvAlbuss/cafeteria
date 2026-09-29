import { TrendingUp, PieChart } from 'lucide-react';
import {
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart as RePieChart,
    Pie,
    Cell,
} from 'recharts';

// ============================================================
// GRÁFICOS DEL DASHBOARD (cargados de forma diferida con recharts)
// ============================================================

const COLORS = [
    'var(--gold)',
    'var(--gold-deep)',
    'var(--gold-pale)',
    'var(--gold-light)',
];

export type DashboardResumen = {
    ventas: number;
    ventasCambio: number;
    pedidos: number;
    pedidosCambio: number;
    ticketPromedio: number;
    ticketCambio: number;
    mesasActivas: number;
    mesasTotal: number;
    ventasPorDia: { fecha: string; total: number }[];
    topProductos: {
        nombre: string;
        cantidad: number;
        total: number;
    }[];
    distribucionCategorias: { name: string; value: number }[];
    periodo: string;
};

interface DashboardChartsProps {
    datos: DashboardResumen;
    getPeriodoGrafico: () => string;
    getPeriodoSubtitulo: () => string;
    formatCurrency: (amount: number) => string;
}

export default function DashboardCharts({
    datos,
    getPeriodoGrafico,
    getPeriodoSubtitulo,
    formatCurrency,
}: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
            {/* GRÁFICO DE LÍNEA CON ÁREA (MODERNO) */}
            <div className="rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4 md:col-span-2">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div>
                        <h3 className="flex items-center gap-1.5 text-xs font-bold text-chocolate sm:gap-2 sm:text-sm">
                            <TrendingUp className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
                            Ventas por {getPeriodoGrafico()}
                        </h3>
                        <p className="text-[9px] text-cocoa sm:text-xs">
                            {getPeriodoSubtitulo()}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold sm:h-2 sm:w-2" />
                        <span className="text-[8px] text-cocoa sm:text-[10px]">
                            Ventas
                        </span>
                    </div>
                </div>

                <div className="w-full" style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={datos.ventasPorDia}>
                            <defs>
                                <linearGradient
                                    id="colorVentas"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--gold)"
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--gold)"
                                        stopOpacity={0.02}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="4 4"
                                stroke="var(--sand)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="fecha"
                                tick={{
                                    fontSize: 9,
                                    fill: 'var(--cocoa-soft)',
                                }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{
                                    fontSize: 9,
                                    fill: 'var(--cocoa-soft)',
                                }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `S/${value}`}
                                width={40}
                            />
                            <Tooltip
                                formatter={(value: any) => {
                                    if (typeof value === 'number') {
                                        return `S/ ${value.toFixed(2)}`;
                                    }

                                    return value || '';
                                }}
                                contentStyle={{
                                    backgroundColor: 'var(--ink)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '10px',
                                    padding: '6px 10px',
                                }}
                                itemStyle={{ color: 'var(--gold)' }}
                                cursor={{
                                    stroke: 'var(--gold)',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="var(--gold)"
                                strokeWidth={2}
                                fill="url(#colorVentas)"
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="var(--gold)"
                                strokeWidth={2}
                                dot={{
                                    fill: 'var(--gold)',
                                    r: 3,
                                    strokeWidth: 0,
                                }}
                                activeDot={{
                                    r: 5,
                                    fill: 'var(--gold)',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Indicadores rápidos */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-sand pt-2 sm:mt-4 sm:grid-cols-4 sm:gap-3 sm:pt-3">
                    <div className="text-center">
                        <p className="text-[8px] font-medium text-cocoa sm:text-[10px]">
                            Total
                        </p>
                        <p className="text-xs font-bold text-chocolate sm:text-sm">
                            {formatCurrency(datos.ventas)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-medium text-cocoa sm:text-[10px]">
                            Promedio
                        </p>
                        <p className="text-xs font-bold text-gold sm:text-sm">
                            {formatCurrency(
                                datos.ventas / datos.ventasPorDia.length,
                            )}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-medium text-cocoa sm:text-[10px]">
                            Mejor {getPeriodoGrafico()}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 sm:text-sm dark:text-emerald-400">
                            {formatCurrency(
                                Math.max(
                                    ...datos.ventasPorDia.map((d) => d.total),
                                ),
                            )}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-medium text-cocoa sm:text-[10px]">
                            Peor {getPeriodoGrafico()}
                        </p>
                        <p className="text-xs font-bold text-rose-500 sm:text-sm dark:text-rose-400">
                            {formatCurrency(
                                Math.min(
                                    ...datos.ventasPorDia.map((d) => d.total),
                                ),
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* GRÁFICO CIRCULAR (ocupa 1 columna) */}
            <div className="rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold text-chocolate sm:gap-2 sm:text-sm">
                        <PieChart className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
                        Distribución
                    </h3>
                    <span className="text-[8px] text-cocoa sm:text-[10px]">
                        Por categoría
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-full" style={{ height: '150px' }}>
                        <ResponsiveContainer width="100%" height={150}>
                            <RePieChart>
                                <Pie
                                    data={datos.distribucionCategorias}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={55}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {datos.distribucionCategorias.map(
                                        (entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ),
                                    )}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{
                                        backgroundColor: 'var(--ink)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '10px',
                                        padding: '6px 10px',
                                    }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:mt-2 sm:gap-3">
                        {datos.distribucionCategorias.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1"
                            >
                                <span
                                    className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
                                    style={{
                                        backgroundColor:
                                            COLORS[index % COLORS.length],
                                    }}
                                />
                                <span className="text-[8px] font-medium text-cocoa sm:text-[10px]">
                                    {item.name}
                                </span>
                                <span className="text-[8px] font-bold text-chocolate sm:text-[10px]">
                                    {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}