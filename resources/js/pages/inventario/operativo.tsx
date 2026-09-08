import { Head, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Package, Search } from 'lucide-react';
import { useState } from 'react';

interface OperationalSupply {
    id: number;
    nombre: string;
    categoria: string | null;
    unidad: string;
    stock: number;
    stock_minimo: number;
    fecha_vencimiento: string | null;
}

export default function OperationalInventory() {
    const { insumos } = usePage().props as unknown as { insumos: OperationalSupply[] };
    const [search, setSearch] = useState('');
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const filteredSupplies = insumos.filter((insumo) =>
        !normalizedSearch
        || insumo.nombre.toLocaleLowerCase('es').includes(normalizedSearch)
        || insumo.categoria?.toLocaleLowerCase('es').includes(normalizedSearch),
    );
    const lowStock = insumos.filter((insumo) => insumo.stock <= insumo.stock_minimo).length;
    const expiring = insumos.filter((insumo) => {
        if (!insumo.fecha_vencimiento) {
            return false;
        }

        const days = (new Date(`${insumo.fecha_vencimiento}T00:00:00`).getTime() - Date.now()) / 86_400_000;
        return days >= 0 && days <= 3;
    }).length;

    return (
        <>
            <Head title="Mi inventario" />
            <main className="min-h-full space-y-4 bg-[#FBF7F0] p-4 md:p-6">
                <section className="rounded-2xl bg-neutral-950 p-5 text-white">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-300">
                                <Package className="h-4 w-4" /> Consulta de materia prima
                            </p>
                            <h1 className="mt-1 text-2xl font-black">Mi inventario</h1>
                            <p className="mt-1 text-sm text-white/65">Existencias asignadas a tu estación por Administración.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-white/10 px-4 py-2">
                                <p className="text-xl font-black">{insumos.length}</p>
                                <p className="text-[10px] text-white/60">insumos</p>
                            </div>
                            <div className="rounded-xl bg-red-500/20 px-4 py-2">
                                <p className="text-xl font-black text-red-200">{lowStock}</p>
                                <p className="text-[10px] text-red-100/70">escasos</p>
                            </div>
                            <div className="rounded-xl bg-amber-500/20 px-4 py-2">
                                <p className="text-xl font-black text-amber-200">{expiring}</p>
                                <p className="text-[10px] text-amber-100/70">por vencer</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar insumo o categoría..."
                            className="min-h-14 w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-12 pr-4 text-base font-semibold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>
                </section>
                {filteredSupplies.length === 0 ? (
                    <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
                        <Package className="mx-auto h-10 w-10 text-neutral-300" />
                        <h2 className="mt-3 font-black text-neutral-800">No hay insumos para mostrar</h2>
                        <p className="mt-1 text-sm text-neutral-500">Administración debe asignar los insumos correspondientes.</p>
                    </section>
                ) : (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {filteredSupplies.map((insumo) => {
                            const isLow = insumo.stock <= insumo.stock_minimo;
                            const percentage = insumo.stock_minimo > 0
                                ? Math.min(100, (insumo.stock / Math.max(insumo.stock_minimo * 2, 1)) * 100)
                                : 100;

                            return (
                                <article key={insumo.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${isLow ? 'border-red-300' : 'border-emerald-200'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h2 className="truncate text-lg font-black text-neutral-950">{insumo.nombre}</h2>
                                            <p className="text-xs font-semibold text-neutral-500">{insumo.categoria || 'Materia prima'}</p>
                                        </div>
                                        {isLow && <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />}
                                    </div>
                                    <p className={`mt-5 text-3xl font-black ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {insumo.stock} <span className="text-base">{insumo.unidad}</span>
                                    </p>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100">
                                        <div className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-neutral-500">
                                        <span>Mínimo: {insumo.stock_minimo} {insumo.unidad}</span>
                                        {insumo.fecha_vencimiento && (
                                            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {insumo.fecha_vencimiento}</span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </>
    );
}
OperationalInventory.layout = {
    breadcrumbs: [
        {
            title: 'Mi inventario',
            href: '/mi-inventario',
        },
    ],
};
