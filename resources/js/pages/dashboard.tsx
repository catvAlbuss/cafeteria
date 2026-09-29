import { Head, router, usePage } from '@inertiajs/react';
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
} from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';

const DashboardCharts = lazy(
    () => import('@/components/features/DashboardCharts'),
);

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

function StatCard({
    icon: Icon,
    label,
    value,
    change,
    color,
    subtitle,
}: {
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
        <div className="group rounded-xl border border-sand bg-card p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl sm:p-4">
            <div className="flex items-start justify-between">
                <div
                    className={`rounded-xl p-2 sm:p-2.5 ${color} bg-opacity-10 transition-transform duration-300 group-hover:scale-110`}
                >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                </div>
                {change !== undefined && (
                    <div
                        className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold sm:px-2 sm:text-[10px] ${
                            isPositive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isNegative
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-cocoa-soft/10 text-cocoa-soft dark:text-cocoa'
                        }`}
                    >
                        {isPositive && (
                            <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
                        )}
                        {isNegative && (
                            <ArrowDownRight className="h-2 w-2 sm:h-3 sm:w-3" />
                        )}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="mt-2 truncate text-[10px] font-medium text-cocoa-soft sm:mt-3 sm:text-xs">
                {label}
            </p>
            <p className="mt-0.5 truncate text-sm font-extrabold text-chocolate sm:text-xl">
                {value}
            </p>
            {subtitle && (
                <p className="mt-0.5 truncate text-[8px] text-cocoa-soft sm:text-[10px]">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Dashboard() {
    const {
        auth,
        productionArea,
        productionSummary,
        cashierSummary,
        waiterSummary,
        resumen,
    } = usePage().props as unknown as {
        auth?: {
            user?: {
                name?: string;
            };
        };
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
    const nombreUsuario = auth?.user?.name?.split(' ')[0] ?? 'Admin';
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
        setFechaActual(
            new Date().toLocaleString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
            }),
        );
    }, []);

    if (productionArea && productionSummary) {
        return (
            <ProductionHome area={productionArea} summary={productionSummary} />
        );
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
            case 'hoy':
                return 'Hoy';
            case 'semana':
                return 'Esta semana';
            case 'mes':
                return 'Este mes';
            case 'año':
                return 'Este año';
            default:
                return 'Hoy';
        }
    };

    const getPeriodoGrafico = () => {
        switch (periodo) {
            case 'hoy':
                return 'día';
            case 'semana':
                return 'día';
            case 'mes':
                return 'semana';
            case 'año':
                return 'mes';
            default:
                return 'día';
        }
    };

    const getPeriodoSubtitulo = () => {
        switch (periodo) {
            case 'hoy':
                return 'Últimos 7 días';
            case 'semana':
                return 'Últimos 7 días';
            case 'mes':
                return 'Últimas 4 semanas';
            case 'año':
                return 'Últimos 12 meses';
            default:
                return 'Últimos 7 días';
        }
    };

    const accesosRapidos = [
        {
            icon: Wallet,
            title: 'Caja',
            description: 'Apertura de caja, ingresos y egresos.',
            href: '/caja',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
        },
        {
            icon: ShoppingCart,
            title: 'Ventas',
            description: 'Gestiona tus ventas, tickets y clientes.',
            href: '/ventas',
            color: 'text-green-500',
            bg: 'bg-green-500/10',
        },
        {
            icon: Armchair,
            title: 'Mesas',
            description: 'Administración de mesas y ocupación.',
            href: '/mesas',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },
        {
            icon: ChefHat,
            title: 'Platos',
            description: 'Gestiona tu menú, platos y categorías.',
            href: '/platos',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            icon: BarChart3,
            title: 'Reportes',
            description: 'Visualiza reportes e indicadores de tu negocio.',
            href: '/reportes',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            icon: Bike,
            title: 'Deliverys',
            description: 'Gestiona tus pedidos de delivery.',
            href: '/delivery',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
        },
    ];

    const totalCategorias = datos.distribucionCategorias.reduce(
        (sum, item) => sum + item.value,
        0,
    );

    return (
        <>
            <Head title="Dashboard - Dolce Cafe" />

            <div className="min-h-screen space-y-3 bg-cream p-2 sm:space-y-4 sm:p-3 md:space-y-6 md:p-4 lg:p-6">
                {/* ============================================================ */}
                {/* HERO DE BIENVENIDA (gradiente de marca) */}
                {/* ============================================================ */}
                <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-4 text-ink shadow-card sm:rounded-3xl sm:p-6 md:p-8">
                    <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-espresso/20 blur-3xl" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                        <div className="flex flex-col gap-1 lg:flex-1">
                            <p className="text-[10px] font-bold tracking-widest text-cocoa uppercase sm:text-xs dark:text-ink/70">
                                {getPeriodoTexto()} en Dolce Café
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black sm:text-2xl md:text-3xl">
                                    ¡Bienvenido, {nombreUsuario}!
                                </h1>
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-ink/30" />
                                <p className="text-[10px] font-medium text-cocoa sm:text-xs dark:text-ink/60">
                                    {fechaActual || 'Cargando...'}
                                </p>
                            </div>
                            <p className="mt-1 max-w-xl text-[10px] text-cocoa sm:text-xs md:text-sm dark:text-ink/70">
                                Aquí tienes el resumen de{' '}
                                {getPeriodoTexto().toLowerCase()} de tu negocio:
                                ventas, pedidos y actividad de las mesas.
                            </p>
                        </div>

                        {/*  FILTROS DE PERIODO (columna derecha) */}
                        <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-64 lg:grid-cols-1 lg:gap-1.5">
                            {periodos.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => {
                                        setPeriodo(p.value);
                                        router.get(
                                            '/dashboard',
                                            { periodo: p.value },
                                            { preserveState: true },
                                        );
                                    }}
                                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 sm:text-sm ${
                                        periodo === p.value
                                            ? 'border-ink/20 bg-ink text-gold-light shadow-md'
                                            : 'border-ink/10 bg-white/40 text-cocoa backdrop-blur-sm hover:bg-white/60 hover:text-ink dark:text-ink/70 dark:hover:text-ink'
                                    }`}
                                >
                                    {p.label}
                                    <span
                                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                                            periodo === p.value
                                                ? 'bg-gold'
                                                : 'bg-ink/20'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ACCESOS RÁPIDOS */}
                {/* ============================================================ */}
                <div className="mt-4">
                    <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                        <Zap className="h-3.5 w-3.5 fill-gold text-gold sm:h-4 sm:w-4" />
                        <h2 className="text-sm font-bold text-chocolate sm:text-base">
                            Accesos rápidos
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-6">
                        {accesosRapidos.map((item) => (
                            <button
                                key={item.href}
                                onClick={() => router.visit(item.href)}
                                className="group flex items-center gap-2 rounded-lg border border-sand bg-card p-2 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:rounded-xl sm:p-3"
                            >
                                <div
                                    className={`h-8 w-8 shrink-0 rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${item.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                                >
                                    <item.icon
                                        className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-xs font-bold text-chocolate sm:text-sm">
                                        {item.title}
                                    </h3>
                                    <p className="hidden truncate text-[8px] text-cocoa sm:block sm:text-xs">
                                        {item.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* ============================================================ */}
                {/* TARJETAS DE ESTADÍSTICAS */}
                {/* ============================================================ */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4">
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
                {/* GRÁFICOS - Línea + Distribución (carga diferida) */}
                {/* ============================================================ */}
                <Suspense
                    fallback={
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
                            <div className="animate-pulse rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4 md:col-span-2">
                                <div className="mb-3 flex items-center justify-between sm:mb-4">
                                    <div className="space-y-1.5">
                                        <div className="h-4 w-36 rounded-lg bg-sand sm:h-5 sm:w-44" />
                                        <div className="h-3 w-28 rounded-lg bg-wheat" />
                                    </div>
                                    <div className="h-3 w-14 rounded-lg bg-wheat" />
                                </div>
                                <div className="h-[180px] w-full rounded-xl bg-sand/60" />
                                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-sand pt-2 sm:mt-4 sm:grid-cols-4 sm:gap-3 sm:pt-3">
                                    <div className="h-9 rounded-lg bg-wheat" />
                                    <div className="h-9 rounded-lg bg-wheat" />
                                    <div className="h-9 rounded-lg bg-wheat" />
                                    <div className="h-9 rounded-lg bg-wheat" />
                                </div>
                            </div>

                            <div className="animate-pulse rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4">
                                <div className="mb-3 flex items-center justify-between sm:mb-4">
                                    <div className="h-4 w-28 rounded-lg bg-sand" />
                                    <div className="h-3 w-20 rounded-lg bg-wheat" />
                                </div>
                                <div className="h-[150px] w-full rounded-xl bg-sand/60" />
                                <div className="mt-2 flex justify-center gap-2 sm:mt-3">
                                    <div className="h-3 w-16 rounded-full bg-wheat" />
                                    <div className="h-3 w-16 rounded-full bg-wheat" />
                                    <div className="h-3 w-16 rounded-full bg-wheat" />
                                </div>
                            </div>
                        </div>
                    }
                >
                    <DashboardCharts
                        datos={datos}
                        getPeriodoGrafico={getPeriodoGrafico}
                        getPeriodoSubtitulo={getPeriodoSubtitulo}
                        formatCurrency={formatCurrency}
                    />
                </Suspense>

                {/* ============================================================ */}
                {/* TOP PRODUCTOS */}
                {/* ============================================================ */}
                <div className="rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="mb-3 flex items-center justify-between sm:mb-4">
                        <div>
                            <h3 className="flex items-center gap-1.5 text-xs font-bold text-chocolate sm:gap-2 sm:text-sm">
                                <Trophy className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
                                Top productos ({getPeriodoTexto()})
                            </h3>
                            <p className="text-[9px] text-cocoa sm:text-xs">
                                Los más vendidos
                            </p>
                        </div>
                        <span className="rounded-full border border-sand bg-cream px-1.5 py-0.5 text-[8px] font-medium text-cocoa sm:px-2 sm:text-[10px]">
                            {datos.topProductos.length} productos
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
                        {datos.topProductos.map((producto, index) => (
                            <div
                                key={index}
                                className="rounded-lg border border-sand bg-cream p-2 text-center transition-all duration-300 hover:shadow-md sm:rounded-xl sm:p-3"
                            >
                                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold sm:h-8 sm:w-8 sm:text-xs">
                                    #{index + 1}
                                </div>
                                <p className="mt-1.5 truncate text-xs font-semibold text-chocolate sm:mt-2 sm:text-sm">
                                    {producto.nombre}
                                </p>
                                <p className="text-[9px] text-cocoa sm:text-xs">
                                    {producto.cantidad} unidades
                                </p>
                                <p className="mt-0.5 text-[10px] font-bold text-gold sm:text-sm">
                                    {formatCurrency(producto.total)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============================================================ */}
                {/* INSIGHT */}
                {/* ============================================================ */}
                {datos.ventasPorDia.length > 1 && (
                    <div className="rounded-xl bg-gradient-to-r from-roast to-espresso p-3 text-white sm:rounded-2xl sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 sm:h-10 sm:w-10">
                                <TrendingUp className="h-4 w-4 text-gold sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold sm:text-sm">
                                    Análisis del período
                                </p>
                                <p className="text-[9px] break-words text-white/70 sm:text-xs">
                                    {(() => {
                                        const max = Math.max(
                                            ...datos.ventasPorDia.map(
                                                (d) => d.total,
                                            ),
                                        );
                                        const min = Math.min(
                                            ...datos.ventasPorDia.map(
                                                (d) => d.total,
                                            ),
                                        );
                                        const avg =
                                            datos.ventas /
                                            datos.ventasPorDia.length;
                                        const maxFecha =
                                            datos.ventasPorDia.find(
                                                (d) => d.total === max,
                                            )?.fecha || '';
                                        const minFecha =
                                            datos.ventasPorDia.find(
                                                (d) => d.total === min,
                                            )?.fecha || '';
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
                <div className="rounded-xl border border-sand bg-card p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 sm:h-10 sm:w-10">
                                <Coffee className="h-4 w-4 text-gold sm:h-5 sm:w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-chocolate sm:text-base">
                                    Dolce Cafe
                                </h4>
                                <p className="text-[9px] text-cocoa sm:text-xs">
                                    Sistema administrativo
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] text-cocoa sm:gap-4 sm:text-xs">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gold sm:h-3.5 sm:w-3.5" />
                                <span className="max-w-[120px] truncate sm:max-w-none">
                                    {fechaActual || 'Cargando...'}
                                </span>
                            </span>
                            <span className="hidden h-3 w-px bg-sand sm:block" />
                            <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-gold sm:h-3.5 sm:w-3.5" />
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
            <div className="space-y-3 bg-cream p-3 sm:space-y-4 sm:p-4 md:p-6">
                <section className="flex flex-col gap-3 rounded-xl bg-roast p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-5">
                    <div>
                        <p className="text-xs font-bold text-orange-300 sm:text-sm">
                            Panel personal del mozo
                        </p>
                        <h1 className="mt-1 text-lg font-black sm:text-2xl">
                            Tu servicio de hoy
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-white/60 sm:mt-1 sm:text-sm">
                            Pedidos, mesas y preferencias de tus clientes.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit('/mesas')}
                            className="rounded-lg bg-white/10 px-4 py-2 text-xs font-black hover:bg-white/20 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
                        >
                            Ver mesas
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit('/ventas')}
                            className="rounded-lg bg-gold px-4 py-2 text-xs font-black text-ink hover:bg-gold-deep sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
                        >
                            Nuevo pedido
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    <StatCard
                        icon={DollarSign}
                        label="Tus ventas hoy"
                        value={formatCurrency(summary.salesToday)}
                        color="text-emerald-600"
                    />
                    <StatCard
                        icon={Receipt}
                        label="Pedidos enviados"
                        value={formatNumber(summary.ordersToday)}
                        color="text-blue-600"
                    />
                    <StatCard
                        icon={Armchair}
                        label="Mesas activas"
                        value={formatNumber(summary.activeTables)}
                        color="text-violet-600"
                    />
                    <StatCard
                        icon={Coffee}
                        label="Listos para servir"
                        value={formatNumber(summary.readyOrders)}
                        color="text-orange-600"
                    />
                </section>

                <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-sand bg-card p-4 shadow-sm sm:rounded-2xl sm:p-6">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-chocolate sm:mb-4 sm:text-lg">
                            <Trophy className="h-4 w-4 text-gold sm:h-5 sm:w-5" />
                            Productos más vendidos
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            {summary.topProducts.map((item, index) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-cream"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="text-[10px] font-bold text-gold sm:text-xs">
                                            #{index + 1}
                                        </span>
                                        <span className="text-xs font-medium text-chocolate sm:text-sm">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-cocoa sm:text-sm">
                                        {item.quantity} u.
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-sand bg-card p-4 shadow-sm sm:rounded-2xl sm:p-6">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-chocolate sm:mb-4 sm:text-lg">
                            <Award className="h-4 w-4 text-cinnamon sm:h-5 sm:w-5" />
                            Cliente destacado
                        </h3>
                        {summary.topCustomer ? (
                            <div className="rounded-lg bg-cream p-3 text-center sm:rounded-2xl sm:p-4">
                                <p className="text-lg font-bold text-chocolate sm:text-2xl">
                                    {summary.topCustomer.name}
                                </p>
                                <p className="text-xs text-cocoa sm:text-sm">
                                    {summary.topCustomer.orders} pedidos
                                </p>
                                <p className="mt-1 text-base font-bold text-gold sm:mt-2 sm:text-xl">
                                    {formatCurrency(summary.topCustomer.total)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-cocoa sm:text-sm">
                                Sin información aún
                            </p>
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
            <main className="min-h-full space-y-3 bg-cream p-3 sm:space-y-4 sm:p-4 md:p-6">
                <section className="flex flex-col gap-3 rounded-xl bg-roast p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-5">
                    <div>
                        <p className="text-xs font-bold text-emerald-300 sm:text-sm">
                            Panel de caja
                        </p>
                        <h1 className="mt-1 text-lg font-black sm:text-2xl">
                            Resumen del turno
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-white/60 sm:mt-1 sm:text-sm">
                            Ventas, cobros pendientes y estado de mesas.
                        </p>
                    </div>
                    <div
                        className={`rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-3 ${summary.openRegister ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                    >
                        <p
                            className={`text-xs font-black sm:text-sm ${summary.openRegister ? 'text-emerald-200' : 'text-red-200'}`}
                        >
                            {summary.openRegister
                                ? `${summary.openRegister.caja} abierta`
                                : 'Caja sin abrir'}
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                    <StatCard
                        icon={DollarSign}
                        label="Ventas de hoy"
                        value={formatCurrency(summary.salesToday)}
                        color="text-emerald-600"
                    />
                    <StatCard
                        icon={Receipt}
                        label="Transacciones"
                        value={formatNumber(summary.transactionsToday)}
                        color="text-blue-600"
                    />
                    <StatCard
                        icon={Wallet}
                        label="Listos para cobrar"
                        value={formatNumber(summary.readyToCharge)}
                        color="text-orange-600"
                    />
                    <StatCard
                        icon={Armchair}
                        label="Mesas activas"
                        value={formatNumber(summary.activeTables)}
                        color="text-violet-600"
                    />
                </section>
            </main>
        </>
    );
}

// ============================================================
// PRODUCTION HOME
// ============================================================
function ProductionHome({
    area,
    summary,
}: {
    area: 'cocina' | 'bar';
    summary: ProductionSummary;
}) {
    const title = area === 'bar' ? 'Bar' : 'Cocina';

    return (
        <>
            <Head title={`Inicio ${title}`} />
            <main className="min-h-full space-y-3 bg-cream p-3 sm:space-y-4 sm:p-4 md:p-6">
                <section className="flex flex-col gap-3 rounded-xl bg-roast p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-5">
                    <div>
                        <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-emerald-300 uppercase sm:gap-2 sm:text-xs">
                            <Radio className="h-3 w-3 sm:h-4 sm:w-4" /> Panel
                            operativo
                        </p>
                        <h1 className="mt-1 text-lg font-black sm:text-2xl">
                            Buen turno, equipo de {title}
                        </h1>
                        <p className="mt-0.5 text-xs text-white/65 sm:mt-1 sm:text-sm">
                            Resumen de producción e inventario de la sede
                            actual.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit(`/produccion?area=${area}`)}
                        className="min-h-10 touch-manipulation rounded-lg bg-gold px-4 text-xs font-black text-ink hover:bg-gold-deep active:scale-[0.98] sm:min-h-14 sm:rounded-xl sm:px-6 sm:text-base"
                    >
                        Ver comandas
                    </button>
                </section>

                <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-card p-3 shadow-sm sm:gap-3 sm:rounded-xl sm:p-4">
                        <Utensils className="h-5 w-5 text-orange-600 sm:h-7 sm:w-7 dark:text-orange-400" />
                        <div>
                            <p className="text-xl font-black text-orange-700 sm:text-3xl dark:text-orange-400">
                                {summary.platosHoy}
                            </p>
                            <p className="text-[10px] font-bold text-cocoa-soft sm:text-xs">
                                platos hoy
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-blue-500/20 bg-card p-3 shadow-sm sm:rounded-xl sm:p-4">
                        <p className="text-xl font-black text-blue-700 sm:text-3xl dark:text-blue-400">
                            {summary.porArea['cocina'] ?? 0}
                        </p>
                        <p className="text-[10px] font-bold text-cocoa-soft sm:text-xs">
                            Cocina
                        </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/20 bg-card p-3 shadow-sm sm:rounded-xl sm:p-4">
                        <p className="text-xl font-black text-amber-700 sm:text-3xl dark:text-amber-400">
                            {summary.porArea['horno'] ?? 0}
                        </p>
                        <p className="text-[10px] font-bold text-cocoa-soft sm:text-xs">
                            Horno
                        </p>
                    </div>
                    <div className="rounded-lg border border-pink-500/20 bg-card p-3 shadow-sm sm:rounded-xl sm:p-4">
                        <p className="text-xl font-black text-pink-700 sm:text-3xl dark:text-pink-400">
                            {summary.porArea['postres'] ?? 0}
                        </p>
                        <p className="text-[10px] font-bold text-cocoa-soft sm:text-xs">
                            Postres
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-sand bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5">
                        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-chocolate sm:mb-3 sm:gap-2 sm:text-base">
                            <AlertTriangle className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />
                            Stock escaso
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.stockEscaso.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between rounded-lg bg-red-500/10 p-1.5 text-xs sm:p-2 sm:text-sm"
                                >
                                    <span className="font-medium text-chocolate">
                                        {item.nombre}
                                    </span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        {item.stock} {item.unidad}
                                    </span>
                                </div>
                            ))}
                            {summary.stockEscaso.length === 0 && (
                                <p className="text-xs text-cocoa sm:text-sm">
                                    Stock dentro de los mínimos.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-sand bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5">
                        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-chocolate sm:mb-3 sm:gap-2 sm:text-base">
                            <CalendarDays className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
                            Por vencer en 3 días
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.porVencer.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between rounded-lg bg-amber-500/10 p-1.5 text-xs sm:p-2 sm:text-sm"
                                >
                                    <span className="font-medium text-chocolate">
                                        {item.nombre}
                                    </span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                        {item.dias} días
                                    </span>
                                </div>
                            ))}
                            {summary.porVencer.length === 0 && (
                                <p className="text-xs text-cocoa sm:text-sm">
                                    Sin vencimientos próximos.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-sand bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5">
                        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-chocolate sm:mb-3 sm:gap-2 sm:text-base">
                            <Trophy className="h-4 w-4 text-violet-500 sm:h-5 sm:w-5" />
                            Más pedidos
                        </h3>
                        <div className="space-y-1.5 sm:space-y-2">
                            {summary.productosMasPedidos
                                .slice(0, 5)
                                .map((item) => (
                                    <div
                                        key={item.nombre}
                                        className="flex justify-between rounded-lg bg-violet-500/10 p-1.5 text-xs sm:p-2 sm:text-sm"
                                    >
                                        <span className="font-medium text-chocolate">
                                            {item.nombre}
                                        </span>
                                        <span className="font-bold text-violet-600 dark:text-violet-400">
                                            {item.cantidad}
                                        </span>
                                    </div>
                                ))}
                            {summary.productosMasPedidos.length === 0 && (
                                <p className="text-xs text-cocoa sm:text-sm">
                                    Aún no hay ventas.
                                </p>
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
    stockEscaso: Array<{
        id: number;
        nombre: string;
        stock: number;
        unidad: string;
    }>;
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
