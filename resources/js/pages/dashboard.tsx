import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Coffee,
    DollarSign,
    Users,
    Armchair,
    Bike,
    ChefHat,
    ShoppingCart,
    Wallet,
    BarChart3,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Zap,
    AlertTriangle,
    CalendarDays,
    Trophy,
    Utensils,
    Radio,
    Package,
    Calculator,
    Receipt,
    Clock,
    Calendar,
    Award,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    LayoutDashboard,
    PieChart,
} from 'lucide-react';

// ============================================================
// RECHAIRS
// ============================================================
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart as RePieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';

// ============================================================
// FORMATOS
// ============================================================
const formatCurrency = (amount: number): string => {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (num: number): string => {
    return num.toLocaleString('es-PE');
};

// ============================================================
// COMPONENTES REUTILIZABLES
// ============================================================

function StatCard({ icon: Icon, label, value, change, color, subtitle }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    change?: number;
    color: string;
    subtitle?: string;
}) {
    const isPositive = change !== undefined && change > 0;
    const isNegative = change !== undefined && change < 0;

    return (
        <div className="group bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm border border-[#F3E1C8] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className={`p-2 sm:p-2.5 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' :
                        isNegative ? 'bg-red-50 text-red-600' :
                            'bg-gray-50 text-gray-500'
                        }`}>
                        {isPositive && <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />}
                        {isNegative && <ArrowDownRight className="h-2 w-2 sm:h-3 sm:w-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="text-gray-400 text-[10px] sm:text-xs font-medium mt-2 sm:mt-3 truncate">{label}</p>
            <p className="text-sm sm:text-xl font-extrabold text-[#2D1B1A] mt-0.5 truncate">{value}</p>
            {subtitle && (
                <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Dashboard() {
    const { productionArea, productionSummary, cashierSummary, waiterSummary, resumen } = usePage().props as unknown as {
        productionArea: 'cocina' | 'bar' | null;
        productionSummary: ProductionSummary | null;
        cashierSummary: CashierSummary | null;
        waiterSummary: WaiterSummary | null;
        resumen: {
            ventas: number;
            ventasCambio: number;
            pedidos: number;
            pedidosCambio: number;
            ticketPromedio: number;
            ticketCambio: number;
            mesasActivas: number;
            mesasTotal: number;
            ventasPorDia: { fecha: string; total: number }[];
            topProductos: { nombre: string; cantidad: number; total: number }[];
            distribucionCategorias: { name: string; value: number }[];
            periodo: string;
        };
    };

    const [periodo, setPeriodo] = useState('hoy');
    useEffect(() => {
        if (resumen?.periodo) {
            setPeriodo(resumen.periodo);
        }
    }, [resumen]);
    const [fechaActual, setFechaActual] = useState('');
    const datos = resumen || {
        ventas: 0,
        ventasCambio: 0,
        pedidos: 0,
        pedidosCambio: 0,
        ticketPromedio: 0,
        ticketCambio: 0,
        mesasActivas: 0,
        mesasTotal: 24,
        ventasPorDia: [],
        topProductos: [],
        distribucionCategorias: [],
        periodo: 'hoy',
    };

    useEffect(() => {
        setFechaActual(new Date().toLocaleString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }));
    }, []);

    if (productionArea && productionSummary) {
        return <ProductionHome area={productionArea} summary={productionSummary} />;
    }

    if (cashierSummary) {
        return <CashierHome summary={cashierSummary} />;
    }

    if (waiterSummary) {
        return <WaiterHome summary={waiterSummary} />;
    }

    const periodos = [
        { value: 'hoy', label: 'Hoy' },
        { value: 'semana', label: 'Esta semana' },
        { value: 'mes', label: 'Este mes' },
        { value: 'año', label: 'Este año' },
    ];

    const getPeriodoTexto = () => {
        switch (periodo) {
            case 'hoy': return 'Hoy';
            case 'semana': return 'Esta semana';
            case 'mes': return 'Este mes';
            case 'año': return 'Este año';
            default: return 'Hoy';
        }
    };

    const getPeriodoGrafico = () => {
        switch (periodo) {
            case 'hoy': return 'día';
            case 'semana': return 'día';
            case 'mes': return 'semana';
            case 'año': return 'mes';
            default: return 'día';
        }
    };

    const getPeriodoSubtitulo = () => {
        switch (periodo) {
            case 'hoy': return 'Últimos 7 días';
            case 'semana': return 'Últimos 7 días';
            case 'mes': return 'Últimas 4 semanas';
            case 'año': return 'Últimos 12 meses';
            default: return 'Últimos 7 días';
        }
    };

    const COLORS = ['#C9A96E', '#B8975D', '#D4B896', '#E8D5A3'];

    const accesosRapidos = [
        { icon: Wallet, title: 'Caja', description: 'Apertura de caja, ingresos y egresos.', href: '/caja', color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: ShoppingCart, title: 'Ventas', description: 'Gestiona tus ventas, tickets y clientes.', href: '/ventas', color: 'text-green-500', bg: 'bg-green-50' },
        { icon: Armchair, title: 'Mesas', description: 'Administración de mesas y ocupación.', href: '/mesas', color: 'text-purple-500', bg: 'bg-purple-50' },
        { icon: ChefHat, title: 'Platos', description: 'Gestiona tu menú, platos y categorías.', href: '/platos', color: 'text-amber-500', bg: 'bg-amber-50' },
        { icon: BarChart3, title: 'Reportes', description: 'Visualiza reportes e indicadores de tu negocio.', href: '/reportes', color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Bike, title: 'Deliverys', description: 'Gestiona tus pedidos de delivery.', href: '/delivery', color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    const totalCategorias = datos.distribucionCategorias.reduce((sum, item) => sum + item.value, 0);
    return (
        <>
            <Head title="Dashboard - Dolce Cafe" />

            <div className="min-h-screen bg-[#FBF7F0] p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6">

                {/* ============================================================ */}
                {/* HEADER CON FILTROS */}
                {/* ============================================================ */}
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 sm:gap-3">
                    {/*  FILTROS A LA DERECHA */}
                    <div className="flex bg-white rounded-2xl border border-[#F3E1C8] p-1 shadow-sm flex-wrap sm:flex-nowrap ml-auto">
                        {periodos.map(p => (
                            <button
                                key={p.value}
                                onClick={() => {
                                    setPeriodo(p.value);
                                    router.get('/dashboard', { periodo: p.value }, { preserveState: true });
                                }}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all duration-200 ${periodo === p.value
                                    ? 'bg-[#C9A96E] text-white shadow-md'
                                    : 'text-[#5A3D2B] hover:bg-[#FBF7F0]'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ACCESOS RÁPIDOS */}
                {/* ============================================================ */}
               <div className="-mt-5"> 
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 fill-orange-500" />
                        <h2 className="text-sm sm:text-base font-bold text-[#2D1B1A]">Accesos rápidos</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
                        {accesosRapidos.map((item) => (
                            <button
                                key={item.href}
                                onClick={() => router.visit(item.href)}
                                className="group bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 border border-[#F3E1C8] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left flex items-center gap-2 sm:gap-3"
                            >
                                <div className={`h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg sm:rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#2D1B1A] text-xs sm:text-sm truncate">{item.title}</h3>
                                    <p className="text-[8px] sm:text-xs text-[#5A3D2B] truncate hidden sm:block">{item.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* ============================================================ */}
                {/* TARJETAS DE ESTADÍSTICAS */}
                {/* ============================================================ */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard
                        icon={DollarSign}
                        label={`Ventas (${getPeriodoTexto()})`}
                        value={formatCurrency(datos.ventas)}
                        change={datos.ventasCambio}
                        color="text-emerald-600"
                        subtitle={`${datos.pedidos} pedidos`}
                    />
                    <StatCard
                        icon={Receipt}
                        label={`Pedidos (${getPeriodoTexto()})`}
                        value={formatNumber(datos.pedidos)}
                        change={datos.pedidosCambio}
                        color="text-blue-600"
                        subtitle="Completados"
                    />
                    <StatCard
                        icon={Calculator}
                        label={`Ticket promedio (${getPeriodoTexto()})`}
                        value={formatCurrency(datos.ticketPromedio)}
                        change={datos.ticketCambio}
                        color="text-purple-600"
                        subtitle="Por pedido"
                    />
                    <StatCard
                        icon={Armchair}
                        label="Mesas activas"
                        value={`${datos.mesasActivas}/${datos.mesasTotal}`}
                        color="text-orange-600"
                        subtitle={`${datos.mesasTotal - datos.mesasActivas} libres`}
                    />
                </div>

                {/* ============================================================ */}
                {/* GRÁFICOS - Línea + Distribución */}
                {/* ============================================================ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                    {/* GRÁFICO DE LÍNEA CON ÁREA (MODERNO) */}
                    <div className="md:col-span-2 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-[#2D1B1A] flex items-center gap-1.5 sm:gap-2">
                                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#C9A96E]" />
                                    Ventas por {getPeriodoGrafico()}
                                </h3>
                                <p className="text-[9px] sm:text-xs text-[#5A3D2B]">{getPeriodoSubtitulo()}</p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#C9A96E]" />
                                <span className="text-[8px] sm:text-[10px] text-[#5A3D2B]">Ventas</span>
                            </div>
                        </div>

                        <div className="w-full" style={{ height: '180px' }}>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={datos.ventasPorDia}>
                                    <defs>
                                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#C9A96E" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#f0e8dc" vertical={false} />
                                    <XAxis
                                        dataKey="fecha"
                                        tick={{ fontSize: 9, fill: '#8D6B53' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 9, fill: '#8D6B53' }}
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
                                            backgroundColor: '#2D1B1A',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '10px',
                                            padding: '6px 10px',
                                        }}
                                        itemStyle={{ color: '#C9A96E' }}
                                        cursor={{ stroke: '#C9A96E', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#C9A96E"
                                        strokeWidth={2}
                                        fill="url(#colorVentas)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#C9A96E"
                                        strokeWidth={2}
                                        dot={{ fill: '#C9A96E', r: 3, strokeWidth: 0 }}
                                        activeDot={{ r: 5, fill: '#C9A96E', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Indicadores rápidos */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[#F3E1C8]">
                            <div className="text-center">
                                <p className="text-[8px] sm:text-[10px] text-[#5A3D2B] font-medium">Total</p>
                                <p className="text-xs sm:text-sm font-bold text-[#2D1B1A]">{formatCurrency(datos.ventas)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] sm:text-[10px] text-[#5A3D2B] font-medium">Promedio</p>
                                <p className="text-xs sm:text-sm font-bold text-[#C9A96E]">
                                    {formatCurrency(datos.ventas / datos.ventasPorDia.length)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] sm:text-[10px] text-[#5A3D2B] font-medium">Mejor {getPeriodoGrafico()}</p>
                                <p className="text-xs sm:text-sm font-bold text-emerald-600">
                                    {formatCurrency(Math.max(...datos.ventasPorDia.map(d => d.total)))}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] sm:text-[10px] text-[#5A3D2B] font-medium">Peor {getPeriodoGrafico()}</p>
                                <p className="text-xs sm:text-sm font-bold text-rose-500">
                                    {formatCurrency(Math.min(...datos.ventasPorDia.map(d => d.total)))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO CIRCULAR (ocupa 1 columna) */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-xs sm:text-sm font-bold text-[#2D1B1A] flex items-center gap-1.5 sm:gap-2">
                                <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#C9A96E]" />
                                Distribución
                            </h3>
                            <span className="text-[8px] sm:text-[10px] text-[#5A3D2B]">Por categoría</span>
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
                                            {datos.distribucionCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `${value}%`}
                                            contentStyle={{
                                                backgroundColor: '#2D1B1A',
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

                            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3 mt-1 sm:mt-2">
                                {datos.distribucionCategorias.map((item, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[8px] sm:text-[10px] font-medium text-[#5A3D2B]">{item.name}</span>
                                        <span className="text-[8px] sm:text-[10px] font-bold text-[#2D1B1A]">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* TOP PRODUCTOS */}
                {/* ============================================================ */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold text-[#2D1B1A] flex items-center gap-1.5 sm:gap-2">
                                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                                Top productos ({getPeriodoTexto()})
                            </h3>
                            <p className="text-[9px] sm:text-xs text-[#5A3D2B]">Los más vendidos</p>
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-medium text-[#5A3D2B] bg-[#FBF7F0] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#F3E1C8]">
                            {datos.topProductos.length} productos
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                        {datos.topProductos.map((producto, index) => (
                            <div key={index} className="bg-[#FBF7F0] rounded-lg sm:rounded-xl p-2 sm:p-3 text-center hover:shadow-md transition-all duration-300 border border-[#F3E1C8]">
                                <div className="flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] sm:text-xs mx-auto">
                                    #{index + 1}
                                </div>
                                <p className="font-semibold text-[#2D1B1A] text-xs sm:text-sm mt-1.5 sm:mt-2 truncate">{producto.nombre}</p>
                                <p className="text-[9px] sm:text-xs text-[#5A3D2B]">{producto.cantidad} unidades</p>
                                <p className="font-bold text-[#C9A96E] text-[10px] sm:text-sm mt-0.5">{formatCurrency(producto.total)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* INSIGHT */}
                {/* ============================================================ */}
                {datos.ventasPorDia.length > 1 && (
                    <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#C9A96E]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold">Análisis del período</p>
                                <p className="text-[9px] sm:text-xs text-white/70 break-words">
                                    {(() => {
                                        const max = Math.max(...datos.ventasPorDia.map(d => d.total));
                                        const min = Math.min(...datos.ventasPorDia.map(d => d.total));
                                        const avg = datos.ventas / datos.ventasPorDia.length;
                                        const maxFecha = datos.ventasPorDia.find(d => d.total === max)?.fecha || '';
                                        const minFecha = datos.ventasPorDia.find(d => d.total === min)?.fecha || '';
                                        const diff = ((max - min) / min) * 100;
                                        return ` Mayor venta: ${maxFecha} (${formatCurrency(max)}) | Menor: ${minFecha} (${formatCurrency(min)}) | Diferencia: ${diff.toFixed(0)}% | Promedio: ${formatCurrency(avg)}`;
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* PIE DE PÁGINA */}
                {/* ============================================================ */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                                <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-[#C9A96E]" />
                            </div>
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-[#2D1B1A]">Dolce Cafe</h4>
                                <p className="text-[9px] sm:text-xs text-[#5A3D2B]">Sistema administrativo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-xs text-[#5A3D2B] flex-wrap justify-center">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C9A96E]" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{fechaActual || 'Cargando...'}</span>
                            </span>
                            <span className="h-3 w-px bg-[#F3E1C8] hidden sm:block" />
                            <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C9A96E]" />
                                Todo en orden
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

// ============================================================
// WAITER HOME
// ============================================================
function WaiterHome({ summary }: { summary: WaiterSummary }) {
    return (
        <>
            <Head title="Inicio del Mozo" />
            <div className="space-y-3 sm:space-y-4 bg-[#FBF7F0] p-3 sm:p-4 md:p-6">
                <section className="flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-neutral-950 p-4 sm:p-5 text-white sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-orange-300">Panel personal del mozo</p>
                        <h1 className="mt-1 text-lg sm:text-2xl font-black">Tu servicio de hoy</h1>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-white/60">Pedidos, mesas y preferencias de tus clientes.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => router.visit('/mesas')} className="rounded-lg sm:rounded-xl bg-white/10 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-base font-black hover:bg-white/20">Ver mesas</button>
                        <button type="button" onClick={() => router.visit('/ventas')} className="rounded-lg sm:rounded-xl bg-orange-500 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-base font-black hover:bg-orange-600">Nuevo pedido</button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    <StatCard icon={DollarSign} label="Tus ventas hoy" value={formatCurrency(summary.salesToday)} color="text-emerald-600" />
                    <StatCard icon={Receipt} label="Pedidos enviados" value={formatNumber(summary.ordersToday)} color="text-blue-600" />
                    <StatCard icon={Armchair} label="Mesas activas" value={formatNumber(summary.activeTables)} color="text-violet-600" />
                    <StatCard icon={Coffee} label="Listos para servir" value={formatNumber(summary.readyOrders)} color="text-orange-600" />
                </section>

                <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#F3E1C8]">
                        <h3 className="text-base sm:text-lg font-bold text-[#2D1B1A] flex items-center gap-2 mb-3 sm:mb-4">
                            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                            Productos más vendidos
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            {summary.topProducts.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FBF7F0] transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="text-[10px] sm:text-xs font-bold text-[#C9A96E]">#{index + 1}</span>
                                        <span className="text-xs sm:text-sm font-medium text-[#2D1B1A]">{item.name}</span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-[#5A3D2B]">{item.quantity} u.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#F3E1C8]">
                        <h3 className="text-base sm:text-lg font-bold text-[#2D1B1A] flex items-center gap-2 mb-3 sm:mb-4">
                            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                            Cliente destacado
                        </h3>
                        {summary.topCustomer ? (
                            <div className="text-center p-3 sm:p-4 bg-[#FBF7F0] rounded-lg sm:rounded-2xl">
                                <p className="text-lg sm:text-2xl font-bold text-[#2D1B1A]">{summary.topCustomer.name}</p>
                                <p className="text-xs sm:text-sm text-[#5A3D2B]">{summary.topCustomer.orders} pedidos</p>
                                <p className="text-base sm:text-xl font-bold text-[#C9A96E] mt-1 sm:mt-2">{formatCurrency(summary.topCustomer.total)}</p>
                            </div>
                        ) : (
                            <p className="text-xs sm:text-sm text-[#5A3D2B]">Sin información aún</p>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

// ============================================================
// CASHIER HOME
// ============================================================
function CashierHome({ summary }: { summary: CashierSummary }) {
    return (
        <>
            <Head title="Inicio de Caja" />
            <main className="min-h-full space-y-3 sm:space-y-4 bg-neutral-50 p-3 sm:p-4 md:p-6">
                <section className="flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-neutral-950 p-4 sm:p-5 text-white sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-emerald-300">Panel de caja</p>
                        <h1 className="mt-1 text-lg sm:text-2xl font-black">Resumen del turno</h1>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-white/60">Ventas, cobros pendientes y estado de mesas.</p>
                    </div>
                    <div className={`rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 ${summary.openRegister ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <p className={`text-xs sm:text-sm font-black ${summary.openRegister ? 'text-emerald-200' : 'text-red-200'}`}>
                            {summary.openRegister ? `${summary.openRegister.caja} abierta` : 'Caja sin abrir'}
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    <StatCard icon={DollarSign} label="Ventas de hoy" value={formatCurrency(summary.salesToday)} color="text-emerald-600" />
                    <StatCard icon={Receipt} label="Transacciones" value={formatNumber(summary.transactionsToday)} color="text-blue-600" />
                    <StatCard icon={Wallet} label="Listos para cobrar" value={formatNumber(summary.readyToCharge)} color="text-orange-600" />
                    <StatCard icon={Armchair} label="Mesas activas" value={formatNumber(summary.activeTables)} color="text-violet-600" />
                </section>
            </main>
        </>
    );
}

// ============================================================
// PRODUCTION HOME
// ============================================================
function ProductionHome({ area, summary }: { area: 'cocina' | 'bar'; summary: ProductionSummary }) {
    const title = area === 'bar' ? 'Bar' : 'Cocina';

    return (
        <>
            <Head title={`Inicio ${title}`} />
            <main className="min-h-full space-y-3 sm:space-y-4 bg-[#FBF7F0] p-3 sm:p-4 md:p-6">
                <section className="flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-neutral-950 p-4 sm:p-5 text-white sm:items-center sm:justify-between">
                    <div>
                        <p className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-300">
                            <Radio className="h-3 w-3 sm:h-4 sm:w-4" /> Panel operativo
                        </p>
                        <h1 className="mt-1 text-lg sm:text-2xl font-black">Buen turno, equipo de {title}</h1>
                        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-white/65">Resumen de producción e inventario de la sede actual.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit(`/produccion?area=${area}`)}
                        className="min-h-10 sm:min-h-14 touch-manipulation rounded-lg sm:rounded-xl bg-orange-500 px-4 sm:px-6 text-xs sm:text-base font-black text-white active:scale-[0.98] hover:bg-orange-600"
                    >
                        Ver comandas
                    </button>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                    <div className="flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-orange-200 bg-white p-3 sm:p-4 shadow-sm">
                        <Utensils className="h-5 w-5 sm:h-7 sm:w-7 text-orange-600" />
                        <div>
                            <p className="text-xl sm:text-3xl font-black text-orange-700">{summary.platosHoy}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-neutral-500">platos hoy</p>
                        </div>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-blue-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xl sm:text-3xl font-black text-blue-700">{summary.porArea['cocina'] ?? 0}</p>
                        <p className="text-[10px] sm:text-xs font-bold text-neutral-500">Cocina</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-amber-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xl sm:text-3xl font-black text-amber-700">{summary.porArea['horno'] ?? 0}</p>
                        <p className="text-[10px] sm:text-xs font-bold text-neutral-500">Horno</p>
                    </div>
                    <div className="rounded-lg sm:rounded-xl border border-pink-100 bg-white p-3 sm:p-4 shadow-sm">
                        <p className="text-xl sm:text-3xl font-black text-pink-700">{summary.porArea['postres'] ?? 0}</p>
                        <p className="text-[10px] sm:text-xs font-bold text-neutral-500">Postres</p>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#F3E1C8]">
                        <h3 className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-black text-[#2D1B1A] mb-2 sm:mb-3">
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            Stock escaso
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.stockEscaso.map((item) => (
                                <div key={item.id} className="flex justify-between p-1.5 sm:p-2 bg-red-50 rounded-lg text-xs sm:text-sm">
                                    <span className="font-medium text-[#2D1B1A]">{item.nombre}</span>
                                    <span className="font-bold text-red-600">{item.stock} {item.unidad}</span>
                                </div>
                            ))}
                            {summary.stockEscaso.length === 0 && (
                                <p className="text-xs sm:text-sm text-[#5A3D2B]">Stock dentro de los mínimos.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#F3E1C8]">
                        <h3 className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-black text-[#2D1B1A] mb-2 sm:mb-3">
                            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                            Por vencer en 3 días
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.porVencer.map((item) => (
                                <div key={item.id} className="flex justify-between p-1.5 sm:p-2 bg-amber-50 rounded-lg text-xs sm:text-sm">
                                    <span className="font-medium text-[#2D1B1A]">{item.nombre}</span>
                                    <span className="font-bold text-amber-600">{item.dias} días</span>
                                </div>
                            ))}
                            {summary.porVencer.length === 0 && (
                                <p className="text-xs sm:text-sm text-[#5A3D2B]">Sin vencimientos próximos.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-[#F3E1C8]">
                        <h3 className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-black text-[#2D1B1A] mb-2 sm:mb-3">
                            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                            Más pedidos
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.productosMasPedidos.slice(0, 5).map((item) => (
                                <div key={item.nombre} className="flex justify-between p-1.5 sm:p-2 bg-violet-50 rounded-lg text-xs sm:text-sm">
                                    <span className="font-medium text-[#2D1B1A]">{item.nombre}</span>
                                    <span className="font-bold text-violet-600">{item.cantidad}</span>
                                </div>
                            ))}
                            {summary.productosMasPedidos.length === 0 && (
                                <p className="text-xs sm:text-sm text-[#5A3D2B]">Aún no hay ventas.</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

// ============================================================
// TIPOS
// ============================================================
interface ProductionSummary {
    platosHoy: number;
    porArea: Record<'cocina' | 'bar' | 'horno' | 'postres', number>;
    productosMasPedidos: Array<{ nombre: string; cantidad: number }>;
    stockEscaso: Array<{ id: number; nombre: string; stock: number; unidad: string }>;
    porVencer: Array<{ id: number; nombre: string; dias: number }>;
    inventario: Array<{
        id: number;
        nombre: string;
        stock: number;
        stock_minimo: number;
        unidad: string;
        fecha_vencimiento: string | null;
    }>;
}

interface CashierSummary {
    salesToday: number;
    transactionsToday: number;
    readyToCharge: number;
    activeTables: number;
    openRegister: {
        id: number;
        caja: string;
        turno: string;
        monto_inicial: number;
        fecha_apertura: string;
    } | null;
}

interface WaiterSummary {
    salesToday: number;
    ordersToday: number;
    activeTables: number;
    readyOrders: number;
    topProducts: Array<{ name: string; quantity: number; total: number }>;
    topCategories: Array<{ name: string; quantity: number; total: number }>;
    mostFrequentTable: { numero: string; visits: number } | null;
    topCustomer: { name: string; total: number; orders: number } | null;
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};