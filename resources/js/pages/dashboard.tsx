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
} from 'lucide-react';

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

const formatCurrency = (amount: number): string => {
    return `S/ ${amount.toLocaleString('es-PE')}`;
};

const formatNumber = (num: number): string => {
    return num.toLocaleString('es-PE');
};

export default function Dashboard() {
    const { productionArea, productionSummary, cashierSummary, waiterSummary } = usePage().props as unknown as {
        productionArea: 'cocina' | 'bar' | null;
        productionSummary: ProductionSummary | null;
        cashierSummary: CashierSummary | null;
        waiterSummary: WaiterSummary | null;
    };

    if (productionArea && productionSummary) {
        return <ProductionHome area={productionArea} summary={productionSummary} />;
    }

    if (cashierSummary) {
        return <CashierHome summary={cashierSummary} />;
    }

    if (waiterSummary) {
        return <WaiterHome summary={waiterSummary} />;
    }

    //   Datos
    const stats = {
        ventasHoy: 4820,
        ventasCambio: 12,
        clientes: 128,
        clientesCambio: 8,
        mesasActivas: 18,
        mesasTotal: 24,
        deliverys: 36,
        deliverysCambio: 5,
    };

    // 📋 Navegación rápida
    const navegarA = (ruta: string) => {
        router.visit(ruta);
    };

    return (
        <>
            <Head title="Dashboard - Dolce Cafe" />
            
            <div className="space-y-10 p-6 bg-[#FBF3E7]">
                D

                {/* ============================================================ */}
                {/* ACCESOS RÁPIDOS */}
                {/* ============================================================ */}
                <section>
                    <div className="mb-5 flex items-center gap-2.5">
                        <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
                        <h2 className="text-xl font-bold text-[#3B2A1E]">Accesos rápidos</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Caja */}
                        <button
                            onClick={() => navegarA('/caja')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-orange-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                                <Wallet className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Caja</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Apertura de caja, ingresos y egresos.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-orange-400 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        {/* Ventas */}
                        <button
                            onClick={() => navegarA('/ventas')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-green-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
                                <ShoppingCart className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Ventas</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Gestiona tus ventas, tickets y clientes.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-green-500 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        {/* Mesas */}
                        <button
                            onClick={() => navegarA('/mesas')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-purple-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                                <Armchair className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Mesas</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Administración de mesas y ocupación.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-purple-400 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        {/* Platos */}
                        <button
                            onClick={() => navegarA('/platos')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-amber-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                                <ChefHat className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Platos</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Gestiona tu menú, platos y categorías.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        {/* Reportes */}
                        <button
                            onClick={() => navegarA('/reportes')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-blue-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                                <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Reportes</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Visualiza reportes e indicadores de tu negocio.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        {/* Deliverys */}
                        <button
                            onClick={() => navegarA('/delivery')}
                            className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-left hover:border-rose-200 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                                <Bike className="h-6 w-6 text-rose-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#3B2A1E]">Deliverys</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Gestiona tus pedidos de delivery.</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                    </div>
                </section>

                {/* ============================================================ */}
                {/* RESUMEN DEL SISTEMA */}
                {/* ============================================================ */}
                <section>
                    <div className="mb-5 flex items-end justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[#3B2A1E]">Resumen general</h2>
                            <p className="text-gray-400 text-sm mt-0.5">Estado actual del restaurante</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        
                        {/* Ventas */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-600 text-[11px] font-semibold px-2 py-0.5">
                                    <TrendingUp className="h-3 w-3" />
                                    +{stats.ventasCambio}%
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Ventas hoy</p>
                            <h3 className="text-2xl font-extrabold text-[#3B2A1E] mt-0.5">{formatCurrency(stats.ventasHoy)}</h3>
                        </div>

                        {/* Clientes */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold px-2 py-0.5">
                                    <TrendingUp className="h-3 w-3" />
                                    +{stats.clientesCambio}%
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Clientes</p>
                            <h3 className="text-2xl font-extrabold text-[#3B2A1E] mt-0.5">{stats.clientes}</h3>
                        </div>

                        {/* Mesas */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <Armchair className="h-5 w-5 text-orange-600" />
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-600 text-[11px] font-semibold px-2 py-0.5">
                                    {stats.mesasActivas}/{stats.mesasTotal}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Mesas activas</p>
                            <h3 className="text-2xl font-extrabold text-[#3B2A1E] mt-0.5">{stats.mesasActivas}</h3>
                        </div>

                        {/* Deliverys */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                                    <Bike className="h-5 w-5 text-rose-600" />
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-semibold px-2 py-0.5">
                                    <TrendingUp className="h-3 w-3" />
                                    +{stats.deliverysCambio}%
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Deliverys</p>
                            <h3 className="text-2xl font-extrabold text-[#3B2A1E] mt-0.5">{stats.deliverys}</h3>
                        </div>

                    </div>
                </section>

                {/* ============================================================ */}
                {/* PIE DE PÁGINA */}
                {/* ============================================================ */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 p-9 lg:p-11 shadow-lg">
                    
                    <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"></div>

                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-7">
                        <div>
                            <h2 className="font-serif text-3xl font-bold text-white">Dolce Cafe</h2>
                            <p className="mt-3 text-orange-100 text-base leading-7 max-w-2xl">
                                Bienvenido al sistema administrativo. Desde aquí podrás gestionar todos los módulos del restaurante de forma rápida, moderna y segura.
                            </p>
                        </div>
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                            <Coffee className="h-11 w-11 text-white" />
                        </div>
                    </div>

                </section>

            </div>
        </>
    );
}

function WaiterHome({ summary }: { summary: WaiterSummary }) {
    return (
        <>
            <Head title="Inicio del Mozo" />
            <main className="min-h-full space-y-5 bg-[#FBF7F0] p-4 md:p-6">
                <section className="flex flex-col gap-4 rounded-2xl bg-neutral-950 p-5 text-white md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-bold text-orange-300">Panel personal del mozo</p>
                        <h1 className="mt-1 text-2xl font-black">Tu servicio de hoy</h1>
                        <p className="mt-1 text-sm font-medium text-white/60">Pedidos, mesas y preferencias de tus clientes.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => router.visit('/mesas')} className="rounded-xl bg-white/10 px-5 py-3 font-black hover:bg-white/20">Ver mesas</button>
                        <button type="button" onClick={() => router.visit('/ventas')} className="rounded-xl bg-orange-500 px-5 py-3 font-black hover:bg-orange-600">Nuevo pedido</button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <CashierMetric icon={DollarSign} label="Tus ventas hoy" value={formatCurrency(summary.salesToday)} color="bg-emerald-50 text-emerald-700" />
                    <CashierMetric icon={Receipt} label="Pedidos enviados" value={formatNumber(summary.ordersToday)} color="bg-blue-50 text-blue-700" />
                    <CashierMetric icon={Armchair} label="Mesas activas" value={formatNumber(summary.activeTables)} color="bg-violet-50 text-violet-700" />
                    <CashierMetric icon={Coffee} label="Listos para servir" value={formatNumber(summary.readyOrders)} color="bg-orange-50 text-orange-700" />
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <WaiterRanking title="Productos más vendidos · 30 días" items={summary.topProducts} />
                    <WaiterRanking title="Categorías preferidas · 30 días" items={summary.topCategories} />
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <article className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
                        <Armchair className="h-6 w-6 text-violet-600" />
                        <p className="mt-3 text-sm font-bold text-neutral-500">Mesa más recurrente</p>
                        <p className="mt-1 text-2xl font-black text-neutral-950">{summary.mostFrequentTable ? `Mesa ${summary.mostFrequentTable.numero}` : 'Sin información'}</p>
                        <p className="mt-1 text-sm font-semibold text-violet-700">{summary.mostFrequentTable ? `${summary.mostFrequentTable.visits} pedidos atendidos` : 'Aún no hay pedidos terminados'}</p>
                    </article>
                    <article className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
                        <Users className="h-6 w-6 text-emerald-600" />
                        <p className="mt-3 text-sm font-bold text-neutral-500">Cliente de mayor consumo</p>
                        <p className="mt-1 text-2xl font-black text-neutral-950">{summary.topCustomer?.name ?? 'Sin información'}</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-700">{summary.topCustomer ? `${formatCurrency(summary.topCustomer.total)} en ${summary.topCustomer.orders} pedidos` : 'Registra el nombre del cliente para medirlo'}</p>
                    </article>
                </section>
            </main>
        </>
    );
}

function WaiterRanking({ title, items }: { title: string; items: Array<{ name: string; quantity: number; total: number }> }) {
    return (
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-neutral-950"><Trophy className="h-5 w-5 text-amber-500" /> {title}</h2>
            <div className="mt-4 space-y-2">
                {items.length === 0 ? <p className="rounded-lg bg-neutral-50 p-4 text-sm font-semibold text-neutral-500">Aún no hay ventas terminadas.</p> : items.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-800">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-bold text-neutral-900">{item.name}</span>
                        <span className="text-right text-sm font-black text-neutral-700">{item.quantity} u.<br /><span className="text-xs text-emerald-700">{formatCurrency(item.total)}</span></span>
                    </div>
                ))}
            </div>
        </article>
    );
}

function ProductionHome({ area, summary }: { area: 'cocina' | 'bar'; summary: ProductionSummary }) {
    const title = area === 'bar' ? 'Bar' : 'Cocina';
    const areas = area === 'bar'
        ? [{ key: 'bar' as const, label: 'Bar' }]
        : [
              { key: 'cocina' as const, label: 'Cocina' },
              { key: 'horno' as const, label: 'Horno' },
              { key: 'postres' as const, label: 'Postres' },
          ];

    return (
        <>
            <Head title={`Inicio ${title}`} />
            <main className="min-h-full space-y-4 bg-[#FBF7F0] p-4 md:p-6">
                <section className="flex flex-col gap-4 rounded-2xl bg-neutral-950 p-5 text-white md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
                            <Radio className="h-4 w-4" /> Panel operativo
                        </p>
                        <h1 className="mt-1 text-2xl font-black">Buen turno, equipo de {title}</h1>
                        <p className="mt-1 text-sm text-white/65">Resumen de producción e inventario de la sede actual.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit(`/produccion?area=${area}`)}
                        className="min-h-14 touch-manipulation rounded-xl bg-orange-500 px-6 text-base font-black text-white active:scale-[0.98] hover:bg-orange-600"
                    >
                        Ver comandas
                    </button>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                        <Utensils className="h-7 w-7 text-orange-600" />
                        <div>
                            <p className="text-3xl font-black text-orange-700">{summary.platosHoy}</p>
                            <p className="text-xs font-bold text-neutral-500">platos hoy</p>
                        </div>
                    </div>
                    {areas.map(({ key, label }) => (
                        <div key={key} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                            <p className="text-3xl font-black text-blue-700">{summary.porArea[key] ?? 0}</p>
                            <p className="text-xs font-bold text-neutral-500">{label}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-black text-neutral-950">
                                <Package className="h-5 w-5 text-orange-600" /> Inventario disponible
                            </h2>
                            <p className="text-xs font-medium text-neutral-500">Consulta de materia prima asignada a tu estación.</p>
                        </div>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                            {summary.inventario.length} insumos
                        </span>
                    </div>

                    {summary.inventario.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                            <Package className="mx-auto h-7 w-7 text-neutral-400" />
                            <p className="mt-2 text-sm font-bold text-neutral-700">Administración aún no asignó insumos.</p>
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {summary.inventario.map((insumo) => {
                                const isLow = insumo.stock <= insumo.stock_minimo;
                                const percentage = insumo.stock_minimo > 0
                                    ? Math.min(100, (insumo.stock / Math.max(insumo.stock_minimo * 2, 1)) * 100)
                                    : 100;

                                return (
                                    <article
                                        key={insumo.id}
                                        className={`rounded-xl border p-4 ${isLow ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-black text-neutral-950">{insumo.nombre}</h3>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isLow ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                {isLow ? 'Escaso' : 'Disponible'}
                                            </span>
                                        </div>
                                        <p className={`mt-3 text-2xl font-black ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
                                            {insumo.stock} <span className="text-sm">{insumo.unidad}</span>
                                        </p>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                            <div
                                                className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-[11px] font-semibold text-neutral-500">Mínimo: {insumo.stock_minimo} {insumo.unidad}</p>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <SummaryList
                        title="Stock escaso"
                        icon={<AlertTriangle className="h-5 w-5" />}
                        color="red"
                        empty="Stock dentro de los mínimos."
                        items={summary.stockEscaso.map((item) => ({
                            id: item.id,
                            name: item.nombre,
                            value: `${item.stock} ${item.unidad}`,
                        }))}
                    />
                    <SummaryList
                        title="Por vencer en 3 días"
                        icon={<CalendarDays className="h-5 w-5" />}
                        color="amber"
                        empty="Sin vencimientos próximos registrados."
                        items={summary.porVencer.map((item) => ({
                            id: item.id,
                            name: item.nombre,
                            value: item.dias === 0 ? 'Vence hoy' : `${item.dias} días`,
                        }))}
                    />
                    <SummaryList
                        title="Más pedidos · 30 días"
                        icon={<Trophy className="h-5 w-5" />}
                        color="violet"
                        empty="Aún no hay ventas terminadas."
                        items={summary.productosMasPedidos.map((item) => ({
                            id: item.nombre,
                            name: item.nombre,
                            value: `${item.cantidad}`,
                        }))}
                    />
                </section>
            </main>
        </>
    );
}

function CashierHome({ summary }: { summary: CashierSummary }) {
    const shortcuts = [
        { title: 'Ventas', description: 'Registrar pedidos', href: '/ventas', icon: ShoppingCart, color: 'bg-blue-50 text-blue-700' },
        { title: 'Caja', description: 'Cobrar pedidos', href: '/caja', icon: Wallet, color: 'bg-emerald-50 text-emerald-700' },
        { title: 'Turno de caja', description: 'Apertura, movimientos y cierre', href: '/contador', icon: Calculator, color: 'bg-amber-50 text-amber-700' },
        { title: 'Mesas', description: 'Revisar cuentas', href: '/mesas', icon: Armchair, color: 'bg-violet-50 text-violet-700' },
    ];

    return (
        <>
            <Head title="Inicio de Caja" />
            <main className="min-h-full space-y-5 bg-neutral-50 p-4 md:p-6">
                <section className="flex flex-col gap-4 rounded-2xl bg-neutral-950 p-5 text-white md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-bold text-emerald-300">Panel de caja</p>
                        <h1 className="mt-1 text-2xl font-black">Resumen del turno</h1>
                        <p className="mt-1 text-sm font-medium text-white/60">Ventas, cobros pendientes y estado de mesas.</p>
                    </div>
                    <div className={`rounded-xl px-4 py-3 ${summary.openRegister ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <p className={`text-sm font-black ${summary.openRegister ? 'text-emerald-200' : 'text-red-200'}`}>
                            {summary.openRegister ? `${summary.openRegister.caja} abierta` : 'Caja sin abrir'}
                        </p>
                        <p className="mt-0.5 text-sm text-white/60">
                            {summary.openRegister ? `Turno ${summary.openRegister.turno}` : 'Abre el turno de caja para iniciar la sede'}
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <CashierMetric icon={DollarSign} label="Ventas de hoy" value={formatCurrency(summary.salesToday)} color="text-emerald-700 bg-emerald-50" />
                    <CashierMetric icon={Receipt} label="Transacciones" value={formatNumber(summary.transactionsToday)} color="text-blue-700 bg-blue-50" />
                    <CashierMetric icon={Wallet} label="Listos para cobrar" value={formatNumber(summary.readyToCharge)} color="text-orange-700 bg-orange-50" />
                    <CashierMetric icon={Armchair} label="Mesas activas" value={formatNumber(summary.activeTables)} color="text-violet-700 bg-violet-50" />
                </section>

                <section>
                    <h2 className="text-base font-black text-neutral-950">Acciones del turno</h2>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {shortcuts.map(({ title, description, href, icon: Icon, color }) => (
                            <button
                                key={href}
                                type="button"
                                onClick={() => router.visit(href)}
                                className="group flex min-h-24 items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                            >
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-base font-black text-neutral-950">{title}</span>
                                    <span className="block text-sm font-medium text-neutral-500">{description}</span>
                                </span>
                                <ChevronRight className="h-5 w-5 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-orange-500" />
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}

function CashierMetric({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
    return (
        <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-4 text-sm font-bold text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-neutral-950">{value}</p>
        </article>
    );
}

function SummaryList({
    title,
    icon,
    color,
    empty,
    items,
}: {
    title: string;
    icon: React.ReactNode;
    color: 'red' | 'amber' | 'violet';
    empty: string;
    items: Array<{ id: number | string; name: string; value: string }>;
}) {
    const colors = {
        red: 'border-red-200 text-red-700 bg-red-50',
        amber: 'border-amber-200 text-amber-700 bg-amber-50',
        violet: 'border-violet-200 text-violet-700 bg-violet-50',
    };

    return (
        <article className={`rounded-xl border bg-white p-4 shadow-sm ${colors[color].split(' ')[0]}`}>
            <h2 className={`flex items-center gap-2 text-base font-black ${colors[color].split(' ')[1]}`}>
                {icon} {title}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${colors[color]}`}>{items.length}</span>
            </h2>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {items.length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{empty}</p>
                ) : items.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between rounded-lg p-3 text-sm ${colors[color].split(' ')[2]}`}>
                        <span className="font-bold text-neutral-900">{item.name}</span>
                        <span className="font-black">{item.value}</span>
                    </div>
                ))}
            </div>
        </article>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
