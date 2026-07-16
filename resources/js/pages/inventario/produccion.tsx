// resources/js/Pages/inventario/produccion.tsx

import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import {
    Search,
    Clock,
    CheckCircle,
    XCircle,
    Bell,
    ChevronRight,
    Bike,
    Radio,
    Timer,
    Wifi,
} from 'lucide-react';
import {
    agruparPedidosPorArea,
    getEstadisticasPorArea,
    getAreaConfig,
    getAreaColor,
} from '@/utils/clasificarPedidos';
import { toast } from 'sonner';

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

export default function Produccion() {
    const { pedidos: pedidosIniciales, areaActiva } = usePage()
        .props as unknown as {
        pedidos: Pedido[];
        areaActiva: 'cocina' | 'bar';
    };

    const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales || []);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [pendientes, setPendientes] = useState(0);
    const areasVisibles =
        areaActiva === 'bar' ? ['bar'] : ['cocina', 'horno', 'postres'];

    useEffect(() => {
        setPedidos(pedidosIniciales || []);
    }, [pedidosIniciales]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            router.reload({ only: ['pedidos'] });
        }, 10_000);

        return () => window.clearInterval(interval);
    }, []);

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

    // Actualizar contador de pendientes
    useEffect(() => {
        const pendientesCount = pedidos.filter(
            (p) => p.estado === 'pendiente',
        ).length;
        setPendientes(pendientesCount);
    }, [pedidos]);

    // Cerrar panel de notificaciones
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest('.notificaciones-container') &&
                notificacionesAbiertas
            ) {
                setNotificacionesAbiertas(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [notificacionesAbiertas]);

    // ============================================================
    // CAMBIAR ESTADO - VERSIÓN ORIGINAL (FUNCIONABA)
    // ============================================================
    const cambiarEstado = (pedido: any, nuevoEstado: Pedido['estado']) => {
        if (!pedido || !pedido.id) {
            console.error('❌ Pedido sin ID:', pedido);
            alert('Error: Pedido sin identificar');
            return;
        }

        const esDelivery = pedido.tipo_origen === 'delivery';

        // Para delivery, si el nuevo estado es 'listo'
        if (esDelivery && nuevoEstado === 'listo') {
            router.patch(
                `/delivery/${pedido.id}/listo`,
                {},
                {
                    onSuccess: () => {
                        setPedidos((prev) =>
                            prev.filter((p) => p.id !== pedido.id),
                        );
                        router.reload();
                    },
                    onError: (errors) => {
                        console.log('❌ Error:', errors);
                        alert(
                            'Error al marcar delivery como listo: ' +
                                Object.values(errors).join(' '),
                        );
                    },
                },
            );
            return;
        }

        // Para delivery, cambiar a 'preparando'
        if (esDelivery && nuevoEstado === 'preparando') {
            router.patch(
                `/delivery/${pedido.id}/cocina`,
                {},
                {
                    onSuccess: () => {
                        setPedidos((prev) =>
                            prev.map((p) =>
                                p.id === pedido.id
                                    ? { ...p, estado: nuevoEstado }
                                    : p,
                            ),
                        );
                        router.reload();
                    },
                    onError: (errors) => {
                        console.log('❌ Error:', errors);
                        alert(
                            'Error al enviar delivery a cocina: ' +
                                Object.values(errors).join(' '),
                        );
                    },
                },
            );
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

                    if (nuevoEstado === 'listo' && pedido.mesa_id) {
                        router.post(
                            `/mesas/${pedido.mesa_id}/pedido-listo`,
                            {},
                            {
                                onSuccess: () => router.reload(),
                            },
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

    // ============================================================
    // TOMAR PEDIDO - NUEVA FUNCIÓN (SOLO PARA LA CAMPANITA)
    // ============================================================
    const tomarPedido = (pedido: Pedido) => {
        if (!pedido || !pedido.id) {
            toast.error('Error: Pedido sin identificar');
            return;
        }

        const confirmar = confirm(
            `📦 Tomar pedido #${pedido.numero}\n\n` +
                `Cliente: ${pedido.cliente}\n` +
                `Productos: ${pedido.productos?.length || 0} items\n\n` +
                `¿Confirmas que lo prepararás?`,
        );

        if (!confirmar) return;

        router.patch(
            `/pedidos/${pedido.id}`,
            { estado: 'preparando' },
            {
                onSuccess: () => {
                    // Actualizar estado local
                    setPedidos((prev) =>
                        prev.map((p) =>
                            p.id === pedido.id
                                ? { ...p, estado: 'preparando', tomado: true }
                                : p,
                        ),
                    );

                    toast.success(
                        `✅ Pedido #${pedido.numero} tomado - En preparación`,
                    );

                    // Cerrar notificaciones automáticamente
                    setNotificacionesAbiertas(false);
                },
                onError: (errors) => {
                    toast.error(
                        'Error al tomar pedido: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };

    // Tiempo real: nuevos pedidos y cambios de estado desde cualquier terminal
    useSedeChannel('produccion', {
        'pedido.creado': (payload: any) => {
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
        return pedidosFiltrados.filter((p) => p.estado === estado).length;
    };

    const pedidosParaNotificar = pedidos
        .filter((p) => ['pendiente', 'preparando'].includes(p.estado))
        .sort((a, b) => {
            const createdA = a.created_at
                ? new Date(a.created_at).getTime()
                : 0;
            const createdB = b.created_at
                ? new Date(b.created_at).getTime()
                : 0;
            return createdA - createdB;
        });
    const pedidosUrgentes = pedidosParaNotificar.filter((p) => {
        const createdAt = p.created_at ? new Date(p.created_at).getTime() : NaN;
        return (
            Number.isFinite(createdAt) &&
            Date.now() - createdAt > 10 * 60 * 1000
        );
    }).length;
    const eventosLivePreview = [
        { label: 'pedido.creado', description: 'Ingresara directo al tablero' },
        {
            label: 'pedido.actualizado',
            description: 'Sincronizara cambios de estado',
        },
        { label: 'pedido.listo', description: 'Avisara a salon y caja' },
    ];
    return (
        <>
            <Head title="Producción" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-[#FBF7F0] p-4">
                {/* ===== TÍTULO Y CAMPANITA ===== */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2D1B1A]">
                            {areaActiva === 'bar' ? 'Bar' : 'Cocina'}
                        </h1>
                        <p className="text-sm font-medium text-[#5A3D2B]">
                            {areaActiva === 'bar'
                                ? 'Tickets de bebidas y cafetería'
                                : 'Tickets de cocina, horno y postres'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Campanita de notificaciones */}
                        <div className="notificaciones-container relative">
                            <button
                                onClick={() =>
                                    setNotificacionesAbiertas(
                                        !notificacionesAbiertas,
                                    )
                                }
                                className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:bg-gray-50"
                            >
                                <Bell className="h-5 w-5 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    Notificaciones
                                </span>
                                {pendientes > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {pendientes}
                                    </span>
                                )}
                            </button>

                            {/* Panel desplegable */}
                            {notificacionesAbiertas && (
                                <div className="absolute right-0 z-50 mt-2 max-h-[400px] w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                                    <div className="flex items-center justify-between border-b border-gray-100 p-4">
                                        <h3 className="flex items-center gap-2 font-bold text-[#2D1B1A]">
                                            <Bell className="h-4 w-4 text-orange-500" />
                                            Notificaciones
                                        </h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                                            {pendientes} pendientes
                                        </span>
                                    </div>

                                    <div className="p-2">
                                        {pendientes === 0 ? (
                                            <div className="py-8 text-center text-sm text-gray-400">
                                                ✅ No hay pedidos pendientes
                                            </div>
                                        ) : (
                                            pedidos
                                                .filter(
                                                    (p) =>
                                                        p.estado ===
                                                        'pendiente',
                                                )
                                                .map((pedido) => (
                                                    <div
                                                        key={pedido.id}
                                                        className="mb-2 rounded-xl border border-orange-300 bg-orange-50 p-3 last:mb-0"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                                                                        {
                                                                            pedido.numero
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {pedido.hora_pedido
                                                                            ? new Date(
                                                                                  pedido.hora_pedido,
                                                                              ).toLocaleTimeString()
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-sm font-medium text-[#2D1B1A]">
                                                                    {pedido.tipo_origen ===
                                                                    'delivery'
                                                                        ? '🚚 Delivery'
                                                                        : `🪑 Mesa ${pedido.mesa?.numero || 'No asignada'}`}{' '}
                                                                    -{' '}
                                                                    {
                                                                        pedido.cliente
                                                                    }
                                                                </p>
                                                                <p className="truncate text-xs text-gray-500">
                                                                    {pedido.productos &&
                                                                    pedido
                                                                        .productos
                                                                        .length >
                                                                        0
                                                                        ? pedido.productos
                                                                              .map(
                                                                                  (
                                                                                      p,
                                                                                  ) =>
                                                                                      `${p.cantidad}x ${p.nombre}`,
                                                                              )
                                                                              .join(
                                                                                  ' · ',
                                                                              )
                                                                        : 'Cargando productos...'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    tomarPedido(
                                                                        pedido,
                                                                    )
                                                                }
                                                                className="ml-2 flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-blue-600"
                                                            >
                                                                ⚡ Tomar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 p-3">
                                        <button
                                            onClick={() =>
                                                window.location.reload()
                                            }
                                            className="flex w-full items-center justify-center gap-1 text-center text-sm font-medium text-[#C9A96E] transition hover:text-[#B8975D]"
                                        >
                                            Actualizar{' '}
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-700">
                            🟠 Pendientes:{' '}
                            {estadisticas?.cocina?.pendientes +
                                estadisticas?.bar?.pendientes +
                                estadisticas?.horno?.pendientes +
                                estadisticas?.postres?.pendientes || 0}
                        </span>
                        <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700">
                            🔵 Preparando:{' '}
                            {estadisticas?.cocina?.preparando +
                                estadisticas?.bar?.preparando +
                                estadisticas?.horno?.preparando +
                                estadisticas?.postres?.preparando || 0}
                        </span>
                        <span className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">
                            🟢 Listos:{' '}
                            {estadisticas?.cocina?.listos +
                                estadisticas?.bar?.listos +
                                estadisticas?.horno?.listos +
                                estadisticas?.postres?.listos || 0}
                        </span>
                    </div>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-xl border border-[#8D6B53]/15 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-[#2D1B1A]">
                                    <Radio className="h-4 w-4 text-green-500" />
                                    Centro de trabajo sincronizado
                                </p>
                                <p className="mt-1 text-xs text-[#8D6B53]">
                                    Los pedidos se actualizan automáticamente
                                    cada 10 segundos.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Sincronización HTTP
                                </span>
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                    Urgentes: {pedidosUrgentes}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                            {eventosLivePreview.map((evento) => (
                                <div
                                    key={evento.label}
                                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                                >
                                    <p className="font-mono text-xs font-semibold text-[#2D1B1A]">
                                        {evento.label}
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        {evento.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#8D6B53]/15 bg-white p-4 text-center shadow-sm">
                        <div className="rounded-lg bg-orange-50 px-2 py-3">
                            <Timer className="mx-auto mb-1 h-4 w-4 text-orange-500" />
                            <p className="text-xl font-bold text-orange-700">
                                {contarPorEstado('pendiente')}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Pendientes
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-2 py-3">
                            <Clock className="mx-auto mb-1 h-4 w-4 text-blue-500" />
                            <p className="text-xl font-bold text-blue-700">
                                {contarPorEstado('preparando')}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Preparando
                            </p>
                        </div>
                        <div className="rounded-lg bg-green-50 px-2 py-3">
                            <CheckCircle className="mx-auto mb-1 h-4 w-4 text-green-500" />
                            <p className="text-xl font-bold text-green-700">
                                {contarPorEstado('listo')}
                            </p>
                            <p className="text-[11px] text-gray-500">Listos</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#8D6B53]/10 bg-white p-4 shadow-sm">
                    <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <input
                                type="text"
                                placeholder="🔍 Buscar pedido, cliente o mesa..."
                                className="w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFiltroEstado('todas')}
                                className={`rounded-xl px-5 py-2 font-semibold transition ${filtroEstado === 'todas' ? 'bg-[#C9A96E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFiltroEstado('pendiente')}
                                className={`rounded-xl px-5 py-2 font-semibold transition ${filtroEstado === 'pendiente' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                            >
                                Pendientes
                            </button>
                            <button
                                onClick={() => setFiltroEstado('preparando')}
                                className={`rounded-xl px-5 py-2 font-semibold transition ${filtroEstado === 'preparando' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                                Preparando
                            </button>
                            <button
                                onClick={() => setFiltroEstado('listo')}
                                className={`rounded-xl px-5 py-2 font-semibold transition ${filtroEstado === 'listo' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                            >
                                Listos
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={`grid grid-cols-1 gap-6 ${areasVisibles.length > 1 ? 'xl:grid-cols-3' : ''}`}
                >
                    {areasVisibles.map((area) => (
                        <AreaCard
                            key={area}
                            area={area}
                            pedidos={pedidosAgrupados[area] || []}
                            estadisticas={
                                estadisticas[area] || {
                                    total: 0,
                                    pendientes: 0,
                                    preparando: 0,
                                    listos: 0,
                                }
                            }
                            cambiarEstado={cambiarEstado}
                            expandido={areasVisibles.length === 1}
                        />
                    ))}
                </div>
            </div>
        </>
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
    const colores = getAreaColor(area);
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
        <div className="overflow-hidden rounded-2xl border border-[#8D6B53]/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">
                        {config.icono} {config.nombre}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {area === 'cocina'
                            ? 'Preparación de alimentos'
                            : area === 'bar'
                              ? 'Bebidas y café'
                              : area === 'horno'
                                ? 'Panadería y pastelería'
                                : 'Preparación y decoración'}
                    </p>
                </div>
                <span className="text-xs font-medium text-[#C9A96E]">
                    {pedidos.length} pedidos
                </span>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-2 p-4 text-center">
                <div className="rounded-xl bg-orange-100 py-2">
                    <p className="font-bold text-orange-700">
                        {estadisticas?.pendientes || 0}
                    </p>
                    <p className="text-xs text-gray-500">Pendientes</p>
                </div>
                <div className="rounded-xl bg-blue-100 py-2">
                    <p className="font-bold text-blue-700">
                        {estadisticas?.preparando || 0}
                    </p>
                    <p className="text-xs text-gray-500">Preparando</p>
                </div>
                <div className="rounded-xl bg-green-100 py-2">
                    <p className="font-bold text-green-600">
                        {estadisticas?.listos || 0}
                    </p>
                    <p className="text-xs text-gray-500">Listos</p>
                </div>
            </div>

            {/* Lista de pedidos */}
            <div
                className={`max-h-[70vh] overflow-y-auto p-4 ${expandido ? 'grid grid-cols-1 gap-3 md:grid-cols-2' : 'space-y-3'}`}
            >
                {pedidos.length === 0 ? (
                    <p
                        className={`py-4 text-center text-sm text-gray-400 ${expandido ? 'col-span-2' : ''}`}
                    >
                        No hay pedidos en {config.nombre.toLowerCase()}
                    </p>
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
                                className={`flex flex-col rounded-2xl border-2 p-4 shadow-sm transition ${
                                    pedido.estado === 'preparando'
                                        ? 'border-blue-600 bg-blue-50'
                                        : pedido.estado === 'listo'
                                          ? 'border-green-500 bg-green-50'
                                          : pedido.estado === 'pendiente'
                                            ? 'border-orange-300 bg-orange-50'
                                            : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-black/5 pb-3">
                                    <div>
                                        <h4 className="text-lg font-black text-[#2D1B1A]">
                                            #{pedido.numero}
                                        </h4>
                                        <p className="text-sm font-semibold text-gray-700">
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
                                            className={`mt-2 text-xs font-bold ${minutos >= 10 ? 'text-red-600' : 'text-gray-500'}`}
                                        >
                                            {minutos} min
                                        </p>
                                    </div>
                                </div>

                                <ul className="my-3 space-y-2">
                                    {pedido.productos.map((producto, index) => (
                                        <li
                                            key={`${pedido.id}-${index}`}
                                            className="flex gap-3 text-sm text-gray-800"
                                        >
                                            <span className="min-w-9 rounded-lg bg-white px-2 py-1 text-center font-black shadow-sm">
                                                {producto.cantidad}x
                                            </span>
                                            <span className="py-1 font-semibold">
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
                                            className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                                        >
                                            Empezar preparación
                                        </button>
                                    )}
                                    {pedido.estado === 'preparando' && (
                                        <button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `✅ Marcar pedido #${pedido.numero} como listo?`,
                                                    )
                                                ) {
                                                    cambiarEstado(
                                                        pedido,
                                                        'listo',
                                                    );
                                                }
                                            }}
                                            className="min-h-11 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
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
