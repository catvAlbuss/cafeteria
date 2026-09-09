import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ModalDelivery from '@/components/modals/ModalNuevoDelivery';
import {
    Bike, Clock, CheckCircle, XCircle, MapPin, Phone, User,
    DollarSign, Search, Plus, Trash2, X, Banknote, CreditCard, Smartphone
} from 'lucide-react';

interface DeliveryPedido {
    id: number;
    codigo: string;
    cliente: string;
    telefono: string;
    direccion: string;
    productos: string;
    total: number;
    estado_delivery: 'pendiente' | 'preparando' | 'listo_para_entregar' | 'en_ruta' | 'entregado' | 'cancelado';
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
    router.reload({ only, preserveScroll: true } as Parameters<typeof router.reload>[0]);
}


// ============================================================
// MODAL: Asignar repartidor y enviar
// ============================================================
function ModalAsignarRepartidor({ isOpen, pedido, onClose }: { isOpen: boolean; pedido: DeliveryPedido | null; onClose: () => void }) {
    const [nombre, setNombre] = useState('');
    const [enviando, setEnviando] = useState(false);

    if (!isOpen || !pedido) return null;

    const confirmar = () => {
        if (!nombre.trim()) { alert('Ingresa el nombre del repartidor'); return; }
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
        router.patch(`/delivery/${id}/cocina`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
        });
    };
    const marcarEnRuta = (id: number) => {
        if (!confirm('¿Confirmas que el repartidor está en camino?')) return;
        router.patch(`/delivery/${id}/en-ruta`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
            onError: (errors) => {
                alert('Error al marcar en ruta: ' + Object.values(errors).join(' '));
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <h3 className="font-semibold text-[#2D1B1A] mb-3">Asignar repartidor — {pedido.codigo}</h3>
                <input
                    autoFocus
                    placeholder="Nombre del repartidor"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C9A96E] text-gray-900"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />
                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
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
function ModalCobroDelivery({ isOpen, pedido, onClose }: { isOpen: boolean; pedido: DeliveryPedido | null; onClose: () => void }) {
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [enviando, setEnviando] = useState(false);

    if (!isOpen || !pedido) return null;

    const confirmar = () => {
        setEnviando(true);
        router.patch(`/delivery/${pedido.id}/entregar`, { metodo_pago: metodoPago }, {
            preserveScroll: true,
            onSuccess: () => {
                setEnviando(false);
                onClose();
                reloadParcial(['pedidos']);
            },
            onError: () => setEnviando(false),
        } as Parameters<typeof router.patch>[2]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <h3 className="font-semibold text-[#2D1B1A] mb-1">Cobrar y entregar — {pedido.codigo}</h3>
                <p className="text-sm text-gray-500 mb-4">Total: <span className="font-bold text-[#C9A96E]">S/ {pedido.total.toFixed(2)}</span></p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                        { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                        { key: 'yape', label: 'Yape/Plin', icon: Smartphone },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setMetodoPago(key)}
                            className={`py-2 rounded-xl flex flex-col items-center gap-0.5 text-xs font-medium transition ${metodoPago === key ? 'bg-[#C9A96E] text-white shadow-md' : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {enviando ? '...' : '✅ Confirmar cobro'}
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
    const { pedidos: pedidosData = [], platos: platosData = [] } = usePage<{ pedidos?: DeliveryPedido[]; platos?: Plato[] }>().props;
    const pedidos = pedidosData;

    const platos = platosData;

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalNuevo, setModalNuevo] = useState(false);
    const [modalRepartidor, setModalRepartidor] = useState(false);
    const [modalCobro, setModalCobro] = useState(false);
    const [pedidoActivo, setPedidoActivo] = useState<DeliveryPedido | null>(null);

    const estadisticas = {
        pendientes: pedidos.filter(p => p.estado_delivery === 'pendiente').length,
        enRuta: pedidos.filter(p => p.estado_delivery === 'en_ruta').length,
        entregados: pedidos.filter(p => p.estado_delivery === 'entregado').length,
        ingresos: pedidos.filter(p => p.estado_delivery === 'entregado').reduce((sum, p) => sum + p.total, 0),
    };

    const pedidosFiltrados = pedidos.filter(p => {

        const busquedaOk = !busqueda ||
            p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente.toLowerCase().includes(busqueda.toLowerCase());
        const estadoOk = !filtroEstado || p.estado_delivery === filtroEstado;
        return busquedaOk && estadoOk;
    });


    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'pendiente': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente', icon: Clock };
            case 'preparando': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Preparando', icon: Clock };
            case 'listo_para_entregar': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Listo para entregar', icon: CheckCircle };
            case 'en_ruta': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En ruta', icon: Bike };
            case 'entregado': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregado', icon: CheckCircle };
            case 'cancelado': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado', icon: XCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Desconocido', icon: XCircle };
        }
    };

    const formatCurrency = (amount: number): string => `S/ ${amount.toFixed(2)}`;

    const abrirAsignar = (p: DeliveryPedido) => { setPedidoActivo(p); setModalRepartidor(true); };
    const abrirCobro = (p: DeliveryPedido) => { setPedidoActivo(p); setModalCobro(true); };

    const cancelarPedido = (p: DeliveryPedido) => {
        if (!confirm(`¿Cancelar el pedido ${p.codigo}?`)) return;
        router.patch(`/delivery/${p.id}/cancelar`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
        } as Parameters<typeof router.patch>[2]);
    };

    const eliminarPedido = (p: DeliveryPedido) => {
        if (!confirm('¿Eliminar este pedido permanentemente?')) return;
        router.delete(`/delivery/${p.id}`, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
        } as Parameters<typeof router.delete>[1]);
    };
    const enviarACocina = (id: number) => {
        router.patch(`/delivery/${id}/cocina`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
            onError: (error) => {

                alert('Error al enviar el pedido a cocina');
            }
        });
    };
    const marcarEnRuta = (id: number) => {
        if (!confirm('¿Confirmas que el repartidor está en camino?')) return;
        router.patch(`/delivery/${id}/en-ruta`, {}, {
            preserveScroll: true,
            onSuccess: () => reloadParcial(['pedidos']),
            onError: (errors) => {
                alert('Error al marcar en ruta: ' + Object.values(errors).join(' '));
            }
        });
    };

    return (
        <>
            <Head title="Delivery - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]"> Deliverys</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión y seguimiento de pedidos a domicilio</p>
                    </div>
                    <button
                        onClick={() => setModalNuevo(true)}
                        className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Delivery
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Pendientes</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1">{estadisticas.pendientes}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">En ruta</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">{estadisticas.enRuta}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Bike className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Entregados</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{estadisticas.entregados}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Ingresos (cobrados)</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(estadisticas.ingresos)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar pedido o cliente..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] outline-none text-gray-900"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] outline-none text-gray-900"
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
                            onClick={() => { setBusqueda(''); setFiltroEstado(''); }}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] p-5">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A]"> Pedidos de hoy</h2>
                        <span className="text-sm text-[#5A3D2B]">{pedidosFiltrados.length} pedidos</span>
                    </div>

                    <div className="space-y-3">
                        {pedidosFiltrados.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No hay pedidos</div>
                        ) : (
                            pedidosFiltrados.map((pedido) => {

                                const estadoConfig = getEstadoConfig(pedido.estado_delivery);
                                const EstadoIcon = estadoConfig.icon;
                                return (

                                    <div key={pedido.id} className="border border-[#F3E1C8] rounded-2xl p-4 hover:shadow-md transition">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-bold text-black">{pedido.codigo}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1`}>
                                                        <EstadoIcon className="w-3 h-3" />
                                                        {estadoConfig.label}
                                                    </span>
                                                    {pedido.estado_pago === 'pagado' && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3E1C8] text-[#8A5A2B]">
                                                            💰 Cobrado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-black text-sm mt-1">{pedido.cliente}</p>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {pedido.telefono}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pedido.direccion}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pedido.horaPedido}</span>
                                                </div>
                                                <p className="text-black text-sm text-gray-500 mt-1">{pedido.productos}</p>
                                                {pedido.repartidor && (
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                        <User className="w-3 h-3" /> Repartidor: {pedido.repartidor}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end justify-between gap-2 min-w-[140px]">
                                                <p className="text-xl font-bold text-[#C9A96E]">{formatCurrency(pedido.total)}</p>
                                                <div className="flex gap-1.5 flex-wrap justify-end">
                                                    {pedido.estado_delivery === 'pendiente' && (
                                                        <>
                                                            <button
                                                                onClick={() => enviarACocina(pedido.id)}
                                                                className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                👨‍🍳 Enviar a cocina
                                                            </button>
                                                            <button
                                                                onClick={() => cancelarPedido(pedido)}
                                                                className="bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </>
                                                    )}

                                                    {pedido.estado_delivery === 'listo_para_entregar' && (
                                                        <>
                                                            <button
                                                                onClick={() => marcarEnRuta(pedido.id)}
                                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                🚚 Entregar
                                                            </button>
                                                            <button
                                                                onClick={() => abrirCobro(pedido)}
                                                                className="bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                💰 Cobrar
                                                            </button>
                                                        </>
                                                    )}

                                                    {pedido.estado_delivery === 'en_ruta' && (
                                                        <button
                                                            onClick={() => abrirCobro(pedido)}
                                                            className="bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            💰 Cobrar y entregar
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => eliminarPedido(pedido)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
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
                    onClose={() => { setModalCobro(false); setPedidoActivo(null); }}
                />
            </div>
        </>
    );
}