import { Head, router } from '@inertiajs/react';
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
    Bean,
    Zap
} from 'lucide-react';

const formatCurrency = (amount: number): string => {
    return `S/ ${amount.toLocaleString('es-PE')}`;
};

const formatNumber = (num: number): string => {
    return num.toLocaleString('es-PE');
};

export default function Dashboard() {
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

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
});