// resources/js/Pages/inventario/produccion.tsx

import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import {
    Search,
    Clock,
    CheckCircle,
    XCircle,
    Bike,
    Radio,
    Timer,
    AlertTriangle,
    CalendarDays,
    Trophy,
    Utensils,
} from 'lucide-react';
import {
    agruparPedidosPorArea,
    getEstadisticasPorArea,
    getAreaConfig,
} from '@/utils/clasificarPedidos';

interface Pedido {
    id: number;
    numero: string;
    mesa_id?: number | null;
    mesa?: { id?: number; numero: string } | null;
    cliente: string;
    productos: Array<{
        nombre: string;
        cantidad: number;
        precio: number;
        subtotal: number;
    }>;
    total: number;
    estado: string;
    observaciones?: string | null;
    modificado?: boolean;
    hora_pedido?: string;
    hora_entrega?: string | null;
    created_at?: string;
    tipo_origen?: 'mesa' | 'delivery';
    tomado?: boolean;
    area?: string;
}

interface ResumenProduccion {
    platosHoy: number;
    porArea: Record<'cocina' | 'bar' | 'horno' | 'postres', number>;
    productosMasPedidos: Array<{ nombre: string; cantidad: number }>;
    stockEscaso: Array<{
        id: number;
        nombre: string;
        stock: number;
        stock_minimo: number;
        unidad: string;
    }>;
    porVencer: Array<{
        id: number;
        nombre: string;
        fecha_vencimiento: string;
        dias: number;
    }>;
    totalInsumos: number;
}

export default function Produccion() {
    const { pedidos: pedidosIniciales, areaActiva } = usePage()
        .props as unknown as {
        pedidos: Pedido[];
        areaActiva: 'cocina' | 'bar';
    };

    const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales || []);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const areasVisibles =
        areaActiva === 'bar' ? ['bar'] : ['cocina', 'horno', 'postres'];

    useEffect(() => {
        setPedidos(pedidosIniciales || []);
    }, [pedidosIniciales]);

    // Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    label: 'Pendiente',
                    icon: Clock,
                };
            case 'preparando':
                return {
                    bg: 'bg-orange-100',
                    text: 'text-orange-700',
                    label: 'En cocina',
                    icon: Clock,
                };
            case 'listo':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-600',
                    label: 'Listo',
                    icon: CheckCircle,
                };
            case 'entregado':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    label: 'Entregado',
                    icon: CheckCircle,
                };
            case 'cancelado':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    label: 'Cancelado',
                    icon: XCircle,
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    label: 'Desconocido',
                    icon: XCircle,
                };
        }
    };

    // Filtrar pedidos
    const pedidosFiltrados = pedidos.filter((p) => {
        const coincideBusqueda =
            p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.mesa && p.mesa.numero.includes(busqueda));
        if (filtroEstado === 'todas') return coincideBusqueda;
        return coincideBusqueda && p.estado === filtroEstado;
    });

    // Agrupar por área
    const pedidosAgrupados = agruparPedidosPorArea(pedidosFiltrados);
    const estadisticas = getEstadisticasPorArea(pedidosFiltrados);

// ============================================================
    // CAMBIAR ESTADO 
    // ============================================================
    const cambiarEstado = (pedido: any, nuevoEstado: Pedido['estado']) => {
        if (!pedido || !pedido.id) {
            console.error('❌ Pedido sin ID:', pedido);
            alert('Error: Pedido sin identificar');
            return;
        }

        router.patch(
            `/pedidos/${pedido.id}`,
            { estado: nuevoEstado },
            {
                onSuccess: () => {
                    if (nuevoEstado === 'listo') {
                        setPedidos((prev) =>
                            prev.filter((p) => p.id !== pedido.id),
                        );
                    } else {
                        setPedidos((prev) =>
                            prev.map((p) =>
                                p.id === pedido.id
                                    ? { ...p, estado: nuevoEstado }
                                    : p,
                            ),
                        );
                    }

                },
                onError: (errors) => {
                    alert(
                        'Error al cambiar estado: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };

    // Tiempo real: nuevos pedidos y cambios de estado desde cualquier terminal
    useSedeChannel('produccion', {
        'pedido.creado': (payload: any) => {
            if (!areasVisibles.includes(payload.area)) {
                return;
            }

            setPedidos((prev) =>
                prev.some((p) => p.id === payload.id)
                    ? prev
                    : [
                          ...prev,
                          {
                              ...payload,
                              tipo_origen:
                                  payload.tipo === 'delivery'
                                      ? 'delivery'
                                      : 'mesa',
                          },
                      ],
            );
        },
        'pedido.actualizado': (payload: any) => {
            setPedidos((prev) => {
                if (!areasVisibles.includes(payload.area)) {
                    return prev.filter((p) => p.id !== payload.id);
                }

                if (
                    ['listo', 'entregado', 'pagado', 'cancelado'].includes(
                        payload.estado,
                    )
                ) {
                    return prev.filter((p) => p.id !== payload.id);
                }
                return prev.map((p) =>
                    p.id === payload.id ? { ...p, estado: payload.estado } : p,
                );
            });
        },
    });

    // Función para contar pedidos por estado
    const contarPorEstado = (estado: string) => {
        return pedidos.filter((pedido) => pedido.estado === estado).length;
    };

    return (
        <>
            <Head title={areaActiva === 'bar' ? 'Bar' : 'Cocina'} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto bg-neutral-50 p-4">
                <section className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="search"
                                placeholder="Buscar pedido, cliente o mesa"
                                className="min-h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-4 pl-12 text-sm font-semibold text-neutral-900 outline-none transition placeholder:font-medium placeholder:text-neutral-400 focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('todas')}
                                className={`min-h-12 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${filtroEstado === 'todas' ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
                            >
                                Todas ({pedidos.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('pendiente')}
                                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${filtroEstado === 'pendiente' ? 'border-orange-500 bg-orange-500 text-white shadow-sm' : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                            >
                                <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                                Pendientes ({contarPorEstado('pendiente')})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('preparando')}
                                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98] ${filtroEstado === 'preparando' ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                            >
                                <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                                En preparación ({contarPorEstado('preparando')})
                            </button>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                        <div>
                            <h1 className="text-base font-black text-neutral-950">Cola de pedidos</h1>
                            <p className="mt-0.5 text-sm font-medium text-neutral-500">Ordenados por hora de llegada</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                                En vivo
                            </span>
                            <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-black text-neutral-700">{pedidosFiltrados.length}</span>
                        </div>
                    </header>

                    <div className={`grid grid-cols-1 gap-4 p-4 ${areasVisibles.length > 1 ? 'xl:grid-cols-3' : ''}`}>
                        {areasVisibles.map((area) => (
                            <AreaCard
                                key={area}
                                area={area}
                                pedidos={pedidosAgrupados[area] || []}
                                estadisticas={estadisticas[area] || { total: 0, pendientes: 0, preparando: 0, listos: 0 }}
                                cambiarEstado={cambiarEstado}
                                expandido={areasVisibles.length === 1}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

Produccion.layout = (props: { areaActiva?: 'cocina' | 'bar' }) => {
    const area = props.areaActiva === 'bar' ? 'bar' : 'cocina';
    const title = area === 'bar' ? 'Bar' : 'Cocina';

    return {
        breadcrumbs: [
            {
                title,
                href: `/produccion?area=${area}`,
            },
        ],
    };
};

function ResumenOperativo({
    area,
    pedidosUrgentes,
    resumen,
}: {
    area: 'cocina' | 'bar';
    pedidosUrgentes: number;
    resumen: ResumenProduccion;
}) {
    const areas = area === 'bar'
        ? [{ key: 'bar', label: 'Bar' }]
        : [
              { key: 'cocina', label: 'Cocina' },
              { key: 'horno', label: 'Horno' },
              { key: 'postres', label: 'Postres' },
          ];

    return (
        <section className="space-y-3" aria-label="Resumen operativo">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
                <div className="col-span-2 flex min-h-20 items-center justify-between rounded-xl bg-neutral-950 px-4 py-3 text-white">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                            <Radio className="h-4 w-4" /> En vivo
                        </p>
                        <p className="mt-1 text-sm font-black">Pedidos por Reverb</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black">{pedidosUrgentes}</p>
                        <p className="text-[11px] text-white/65">urgentes</p>
                    </div>
                </div>

                <div className="flex min-h-20 items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <Utensils className="h-6 w-6 text-orange-600" />
                    <div>
                        <p className="text-2xl font-black text-orange-700">{resumen.platosHoy}</p>
                        <p className="text-[11px] font-bold text-orange-700/70">platos hoy</p>
                    </div>
                </div>

                {areas.map(({ key, label }) => (
                    <div key={key} className="min-h-20 rounded-xl border border-blue-100 bg-white px-4 py-3">
                        <p className="text-2xl font-black text-blue-700">{resumen.porArea[key as keyof ResumenProduccion['porArea']] ?? 0}</p>
                        <p className="text-xs font-bold text-neutral-600">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <article className="rounded-xl border border-red-200 bg-white p-3 shadow-sm">
                    <h2 className="flex items-center gap-2 text-sm font-black text-red-700">
                        <AlertTriangle className="h-4 w-4" /> Stock escaso
                        <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs">{resumen.stockEscaso.length}</span>
                    </h2>
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                        {resumen.stockEscaso.length === 0 ? (
                            <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">Stock dentro de los mínimos.</p>
                        ) : resumen.stockEscaso.map((insumo) => (
                            <div key={insumo.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs">
                                <span className="font-bold text-neutral-900">{insumo.nombre}</span>
                                <span className="font-black text-red-700">{insumo.stock} {insumo.unidad}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
                    <h2 className="flex items-center gap-2 text-sm font-black text-amber-700">
                        <CalendarDays className="h-4 w-4" /> Por vencer en 3 días
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs">{resumen.porVencer.length}</span>
                    </h2>
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                        {resumen.porVencer.length === 0 ? (
                            <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">Sin vencimientos próximos registrados.</p>
                        ) : resumen.porVencer.map((insumo) => (
                            <div key={insumo.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                                <span className="font-bold text-neutral-900">{insumo.nombre}</span>
                                <span className="font-black text-amber-700">{insumo.dias === 0 ? 'vence hoy' : `${insumo.dias} días`}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
                    <h2 className="flex items-center gap-2 text-sm font-black text-violet-700">
                        <Trophy className="h-4 w-4" /> Más pedidos · 30 días
                    </h2>
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                        {resumen.productosMasPedidos.length === 0 ? (
                            <p className="rounded-lg bg-neutral-50 p-2 text-xs font-semibold text-neutral-600">Aún no hay ventas terminadas.</p>
                        ) : resumen.productosMasPedidos.map((producto, index) => (
                            <div key={producto.nombre} className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-200 font-black text-violet-800">{index + 1}</span>
                                <span className="min-w-0 flex-1 truncate font-bold text-neutral-900">{producto.nombre}</span>
                                <span className="font-black text-violet-700">{producto.cantidad}</span>
                            </div>
                        ))}
                    </div>
                </article>
            </div>
        </section>
    );
}
// ============================================================
// COMPONENTE: Área Card
// ============================================================
function AreaCard({
    area,
    pedidos,
    estadisticas,
    cambiarEstado,
    expandido = false,
}: {
    area: string;
    pedidos: Pedido[];
    estadisticas: any;
    cambiarEstado: (pedido: Pedido, estado: any) => void;
    expandido?: boolean;
}) {
    const config = getAreaConfig(area);
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    label: 'Pendiente',
                };
            case 'preparando':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    label: 'Preparando',
                };
            case 'listo':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-600',
                    label: 'Listo',
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    label: estado,
                };
        }
    };

    return (
        <div className={`overflow-hidden rounded-xl ${expandido ? '' : 'border border-neutral-200 bg-neutral-50'}`}>
            {!expandido && (
                <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
                    <div>
                        <h2 className="text-base font-black text-neutral-950">{config.icono} {config.nombre}</h2>
                        <p className="text-sm font-medium text-neutral-500">
                            {area === 'cocina'
                                ? 'Preparación de alimentos'
                                : area === 'horno'
                                  ? 'Panadería y pastelería'
                                  : 'Preparación y decoración'}
                        </p>
                    </div>
                    <div className="flex gap-2 text-sm font-bold">
                        <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-orange-700">{estadisticas?.pendientes || 0} pendientes</span>
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">{estadisticas?.preparando || 0} preparando</span>
                    </div>
                </div>
            )}

            {/* Lista de pedidos */}
            <div
                className={`max-h-[70vh] overflow-y-auto ${expandido ? 'grid min-h-64 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'min-h-56 space-y-3 p-3'}`}
            >
                {pedidos.length === 0 ? (
                    <div className={`flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center ${expandido ? 'md:col-span-2 xl:col-span-3' : ''}`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
                            <Radio className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="mt-4 text-base font-black text-neutral-800">Esperando nuevos pedidos</p>
                        <p className="mt-1 max-w-sm text-sm font-medium text-neutral-500">Las comandas aparecerán aquí automáticamente cuando el mozo las envíe.</p>
                    </div>
                ) : (
                    pedidos.map((pedido) => {
                        const estado = getEstadoConfig(pedido.estado);
                        const creado = pedido.created_at
                            ? new Date(pedido.created_at).getTime()
                            : Date.now();
                        const minutos = Math.max(
                            0,
                            Math.floor((Date.now() - creado) / 60_000),
                        );
                        return (
                            <div
                                key={pedido.id}
                                className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                                    pedido.estado === 'preparando'
                                        ? 'border-blue-300 ring-2 ring-blue-100'
                                        : pedido.estado === 'listo'
                                          ? 'border-emerald-300 ring-2 ring-emerald-100'
                                          : pedido.estado === 'pendiente'
                                            ? 'border-orange-300 ring-2 ring-orange-100'
                                            : 'border-neutral-200'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-black/5 pb-3">
                                    <div>
                                        <h4 className="text-base font-black text-neutral-950">
                                            #{pedido.numero}
                                        </h4>
                                        <p className="mt-1 text-sm font-semibold text-neutral-600">
                                            {pedido.tipo_origen === 'delivery'
                                                ? 'Delivery'
                                                : `Mesa ${pedido.mesa?.numero || '-'}`}{' '}
                                            · {pedido.cliente}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${estado.bg} ${estado.text}`}
                                        >
                                            {estado.label}
                                        </span>
                                        <p
                                            className={`mt-2 text-sm font-bold ${minutos >= 10 ? 'text-red-600' : 'text-neutral-500'}`}
                                        >
                                            {minutos} min
                                        </p>
                                    </div>
                                </div>
                                <ul className="my-3 space-y-2">
                                    {pedido.productos.map((producto, index) => (
                                        <li
                                            key={`${pedido.id}-${index}`}
                                            className="flex items-center gap-3 text-sm text-neutral-800"
                                        >
                                            <span className="min-w-10 rounded-lg bg-neutral-100 px-2 py-1.5 text-center font-black text-neutral-900">
                                                {producto.cantidad}x
                                            </span>
                                            <span className="font-bold">
                                                {producto.nombre}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {pedido.observaciones && (
                                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                                        Nota: {pedido.observaciones}
                                    </div>
                                )}

                                <div className="mt-auto grid grid-cols-1 gap-2">
                                    {pedido.estado === 'pendiente' && (
                                        <button
                                            onClick={() =>
                                                cambiarEstado(
                                                    pedido,
                                                    'preparando',
                                                )
                                            }
                                            className="min-h-14 touch-manipulation rounded-xl bg-blue-600 px-5 py-3 text-base font-black text-white transition active:scale-[0.98] hover:bg-blue-700"
                                        >
                                            Empezar preparación
                                        </button>
                                    )}
                                    {pedido.estado === 'preparando' && (
                                        <button
                                            onClick={() =>
                                                cambiarEstado(pedido, 'listo')
                                            }
                                            className="min-h-14 touch-manipulation rounded-xl bg-emerald-600 px-5 py-3 text-base font-black text-white transition active:scale-[0.98] hover:bg-emerald-700"
                                        >
                                            Marcar como listo
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
