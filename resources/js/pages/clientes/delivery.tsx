import { Head, router, usePage } from '@inertiajs/react';
import {
    Bike,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    Phone,
    User,
    DollarSign,
    Search,
    Plus,
    Trash2,
    X,
    Banknote,
    CreditCard,
    Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import ModalDelivery from '@/components/modals/ModalNuevoDelivery';

interface DeliveryPedido {
    id: number;
    codigo: string;
    cliente: string;
    telefono: string;
    direccion: string;
    productos: string;
    total: number;
    estado_delivery:
        | 'pendiente'
        | 'preparando'
        | 'listo_para_entregar'
        | 'en_ruta'
        | 'entregado'
        | 'cancelado';
    estado_pago: string;
    repartidor?: string | null;
    horaPedido: string;
    horaEntrega?: string | null;
}

interface ItemNuevo {
    nombre: string;
    cantidad: number;
    precio: number;
}

interface Plato {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
    imagen: string | null;
}

// Helper tipado para recargar sin pelear con conflictos de tipos de Inertia
function reloadParcial(only: string[]) {
    router.reload({ only, preserveScroll: true } as Parameters<
        typeof router.reload
    >[0]);
}

// ============================================================
// MODAL: Asignar repartidor y enviar
// ============================================================
function ModalAsignarRepartidor({
    isOpen,
    pedido,
    onClose,
}: {
    isOpen: boolean;
    pedido: DeliveryPedido | null;
    onClose: () => void;
}) {
    const [nombre, setNombre] = useState('');
    const [enviando, setEnviando] = useState(false);

    if (!isOpen || !pedido) {
        return null;
    }

    const confirmar = () => {
        if (!nombre.trim()) {
            alert('Ingresa el nombre del repartidor');

            return;
        }

        setEnviando(true);
        router.patch(`/delivery/${pedido.id}/enviar`, { repartidor: nombre }, {
            preserveScroll: true,
            onSuccess: () => {
                setEnviando(false);
                setNombre('');
                onClose();
                reloadParcial(['pedidos']);
            },
            onError: () => setEnviando(false),
        } as Parameters<typeof router.patch>[2]);
    };
    const enviarACocina = (id: number) => {
        router.patch(
            `/delivery/${id}/cocina`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => reloadParcial(['pedidos']),
            },
        );
    };
    const marcarEnRuta = (id: number) => {
        if (!confirm('¿Confirmas que el repartidor está en camino?')) {
            return;
        }

        router.patch(
            `/delivery/${id}/en-ruta`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => reloadParcial(['pedidos']),
                onError: (errors) => {
                    alert(
                        'Error al marcar en ruta: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl">
                <h3 className="mb-3 font-semibold text-chocolate">
                    Asignar repartidor — {pedido.codigo}
                </h3>
                <input
                    autoFocus
                    placeholder="Nombre del repartidor"
                    className="w-full rounded-xl border border-wheat px-3 py-2 text-sm text-chocolate outline-none focus:ring-2 focus:ring-gold"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-2 border-wheat py-2 text-sm font-medium text-cocoa hover:border-gold hover:bg-sand/40"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 rounded-xl bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                        {enviando ? '...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODAL: Cobrar y marcar entregado
// ============================================================
function ModalCobroDelivery({
    isOpen,
    pedido,
    onClose,
}: {
    isOpen: boolean;
    pedido: DeliveryPedido | null;
    onClose: () => void;
}) {
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [enviando, setEnviando] = useState(false);

    if (!isOpen || !pedido) {
        return null;
    }

    const confirmar = () => {
        setEnviando(true);
        router.patch(
            `/delivery/${pedido.id}/entregar`,
            { metodo_pago: metodoPago },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEnviando(false);
                    onClose();
                    reloadParcial(['pedidos']);
                },
                onError: () => setEnviando(false),
            } as Parameters<typeof router.patch>[2],
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl">
                <h3 className="mb-1 font-semibold text-chocolate">
                    Cobrar y entregar — {pedido.codigo}
                </h3>
                <p className="mb-4 text-sm text-cocoa">
                    Total:{' '}
                    <span className="font-bold text-gold">
                        S/ {pedido.total.toFixed(2)}
                    </span>
                </p>

                <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                        { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                        { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                        { key: 'yape', label: 'Yape/Plin', icon: Smartphone },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setMetodoPago(key)}
                            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                                metodoPago === key
                                    ? 'bg-gold text-ink shadow-md'
                                    : 'bg-sand text-cocoa hover:bg-wheat'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-2 border-wheat py-2 text-sm font-medium text-cocoa hover:border-gold hover:bg-sand/40"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {enviando ? '...' : 'Confirmar cobro'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function Delivery() {
    const { pedidos: pedidosData = [], platos: platosData = [] } = usePage<{
        pedidos?: DeliveryPedido[];
        platos?: Plato[];
    }>().props;
    const pedidos = pedidosData;

    const platos = platosData;

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalNuevo, setModalNuevo] = useState(false);
    const [modalRepartidor, setModalRepartidor] = useState(false);
    const [modalCobro, setModalCobro] = useState(false);
    const [pedidoActivo, setPedidoActivo] = useState<DeliveryPedido | null>(
        null,
    );

    const estadisticas = {
        pendientes: pedidos.filter((p) => p.estado_delivery === 'pendiente')
            .length,
        enRuta: pedidos.filter((p) => p.estado_delivery === 'en_ruta').length,
        entregados: pedidos.filter((p) => p.estado_delivery === 'entregado')
            .length,
        ingresos: pedidos
            .filter((p) => p.estado_delivery === 'entregado')
            .reduce((sum, p) => sum + p.total, 0),
    };

    const pedidosFiltrados = pedidos.filter((p) => {
        const busquedaOk =
            !busqueda ||
            p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente.toLowerCase().includes(busqueda.toLowerCase());
        const estadoOk = !filtroEstado || p.estado_delivery === filtroEstado;

        return busquedaOk && estadoOk;
    });

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
                    label: 'Preparando',
                    icon: Clock,
                };
            case 'listo_para_entregar':
                return {
                    bg: 'bg-purple-100',
                    text: 'text-purple-700',
                    label: 'Listo para entregar',
                    icon: CheckCircle,
                };
            case 'en_ruta':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    label: 'En ruta',
                    icon: Bike,
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
                    bg: 'bg-sand',
                    text: 'text-chocolate',
                    label: 'Desconocido',
                    icon: XCircle,
                };
        }
    };

    const formatCurrency = (amount: number): string =>
        `S/ ${amount.toFixed(2)}`;

    const abrirAsignar = (p: DeliveryPedido) => {
        setPedidoActivo(p);
        setModalRepartidor(true);
    };
    const abrirCobro = (p: DeliveryPedido) => {
        setPedidoActivo(p);
        setModalCobro(true);
    };

    const cancelarPedido = (p: DeliveryPedido) => {
        if (!confirm(`¿Cancelar el pedido ${p.codigo}?`)) {
            return;
        }

        router.patch(`/delivery/${p.id}/cancelar`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
        } as Parameters<typeof router.patch>[2]);
    };

    const eliminarPedido = (p: DeliveryPedido) => {
        if (!confirm('¿Eliminar este pedido permanentemente?')) {
            return;
        }

        router.delete(`/delivery/${p.id}`, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
        } as Parameters<typeof router.delete>[1]);
    };
    const enviarACocina = (id: number) => {
        router.patch(
            `/delivery/${id}/cocina`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => reloadParcial(['pedidos']),
                onError: (error) => {
                    alert('Error al enviar el pedido a cocina');
                },
            },
        );
    };
    const marcarEnRuta = (id: number) => {
        if (!confirm('¿Confirmas que el repartidor está en camino?')) {
            return;
        }

        router.patch(
            `/delivery/${id}/en-ruta`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => reloadParcial(['pedidos']),
                onError: (errors) => {
                    alert(
                        'Error al marcar en ruta: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };

    return (
        <>
            <Head title="Delivery - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-chocolate">
                            {' '}
                            Deliverys
                        </h1>
                        <p className="mt-1 text-sm text-cocoa">
                            Gestión y seguimiento de pedidos a domicilio
                        </p>
                    </div>
                    <button
                        onClick={() => setModalNuevo(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Delivery
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Pendientes
                                </p>
                                <p className="mt-1 text-3xl font-bold text-yellow-600">
                                    {estadisticas.pendientes}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    En ruta
                                </p>
                                <p className="mt-1 text-3xl font-bold text-blue-600">
                                    {estadisticas.enRuta}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Bike className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Entregados
                                </p>
                                <p className="mt-1 text-3xl font-bold text-green-600">
                                    {estadisticas.entregados}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-roast p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/60">
                                    Ingresos (cobrados)
                                </p>
                                <p className="mt-1 text-3xl font-bold">
                                    {formatCurrency(estadisticas.ingresos)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <DollarSign className="h-6 w-6 text-gold" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                            <input
                                type="text"
                                placeholder="Buscar pedido o cliente..."
                                className="w-full rounded-xl border border-wheat py-2 pr-4 pl-10 text-sm text-chocolate outline-none focus:ring-2 focus:ring-gold"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="rounded-xl border border-wheat p-2 text-sm text-chocolate outline-none focus:ring-2 focus:ring-gold"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="en_ruta">En ruta</option>
                            <option value="entregado">Entregados</option>
                            <option value="cancelado">Cancelados</option>
                        </select>
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setFiltroEstado('');
                            }}
                            className="rounded-xl bg-roast py-2 text-sm font-semibold text-white transition hover:bg-ink"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-chocolate">
                            {' '}
                            Pedidos de hoy
                        </h2>
                        <span className="text-sm text-cocoa">
                            {pedidosFiltrados.length} pedidos
                        </span>
                    </div>

                    <div className="space-y-3">
                        {pedidosFiltrados.length === 0 ? (
                            <div className="py-8 text-center text-cocoa-soft">
                                No hay pedidos
                            </div>
                        ) : (
                            pedidosFiltrados.map((pedido) => {
                                const estadoConfig = getEstadoConfig(
                                    pedido.estado_delivery,
                                );
                                const EstadoIcon = estadoConfig.icon;

                                return (
                                    <div
                                        key={pedido.id}
                                        className="rounded-2xl border border-sand p-4 transition hover:shadow-md"
                                    >
                                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="font-bold text-black">
                                                        {pedido.codigo}
                                                    </h3>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1`}
                                                    >
                                                        <EstadoIcon className="h-3 w-3" />
                                                        {estadoConfig.label}
                                                    </span>
                                                    {pedido.estado_pago ===
                                                        'pagado' && (
                                                        <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-cinnamon">
                                                            Cobrado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-black">
                                                    {pedido.cliente}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-cocoa-soft">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />{' '}
                                                        {pedido.telefono}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />{' '}
                                                        {pedido.direccion}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />{' '}
                                                        {pedido.horaPedido}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-black text-cocoa">
                                                    {pedido.productos}
                                                </p>
                                                {pedido.repartidor && (
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-cocoa-soft">
                                                        <User className="h-3 w-3" />{' '}
                                                        Repartidor:{' '}
                                                        {pedido.repartidor}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex min-w-[140px] flex-col items-end justify-between gap-2">
                                                <p className="text-xl font-bold text-gold">
                                                    {formatCurrency(
                                                        pedido.total,
                                                    )}
                                                </p>
                                                <div className="flex flex-wrap justify-end gap-1.5">
                                                    {pedido.estado_delivery ===
                                                        'pendiente' && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    enviarACocina(
                                                                        pedido.id,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-200"
                                                            >
                                                                Enviar a cocina
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    cancelarPedido(
                                                                        pedido,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </>
                                                    )}

                                                    {pedido.estado_delivery ===
                                                        'listo_para_entregar' && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    marcarEnRuta(
                                                                        pedido.id,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                                            >
                                                                Entregar
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    abrirCobro(
                                                                        pedido,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200"
                                                            >
                                                                Cobrar
                                                            </button>
                                                        </>
                                                    )}

                                                    {pedido.estado_delivery ===
                                                        'en_ruta' && (
                                                        <button
                                                            onClick={() =>
                                                                abrirCobro(
                                                                    pedido,
                                                                )
                                                            }
                                                            className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200"
                                                        >
                                                            Cobrar y entregar
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            eliminarPedido(
                                                                pedido,
                                                            )
                                                        }
                                                        className="rounded-lg bg-sand px-2.5 py-1 text-xs font-semibold text-cocoa transition hover:bg-wheat"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <ModalDelivery
                    isOpen={modalNuevo}
                    onClose={() => setModalNuevo(false)}
                    onSuccess={() => {
                        setModalNuevo(false);
                        reloadParcial(['pedidos']);
                    }}
                />
                <ModalCobroDelivery
                    isOpen={modalCobro}
                    pedido={pedidoActivo}
                    onClose={() => {
                        setModalCobro(false);
                        setPedidoActivo(null);
                    }}
                />
            </div>
        </>
    );
}
