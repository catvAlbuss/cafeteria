import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import {
    Search,
    Coffee,
    UtensilsCrossed,
    Flame,
    Cake,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    BarChart3,
    Bell,
    Bike,
    ChevronRight,
    Radio,
    Timer,
    Wifi,
} from 'lucide-react';

interface Pedido {
    id: number;
    numero: string;
    mesa_id: number | null;
    mesa?: {
        id: number;
        numero: string;
    } | null;
    cliente: string;
    productos: Array<{
        nombre: string;
        cantidad: number;
        precio: number;
        subtotal: number;
    }>;
    total: number;
    estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'pagado' | 'cancelado';
    observaciones: string | null;
    hora_pedido: string;
    hora_entrega: string | null;
    created_at: string;
    tipo_origen?: 'mesa' | 'delivery';
    tomado?: boolean;
}

export default function Produccion() {
    //  Recibir pedidos desde el controlador
    const { pedidos: pedidosIniciales } = usePage().props as unknown as { pedidos: Pedido[] };

    //  Estado - usar datos del controlador
    const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales || []);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');

    //  Estado de notificaciones
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);

    //  Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'pendiente': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente', icon: Clock };
            case 'preparando': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En cocina', icon: Clock };
            case 'listo_para_entregar': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Listo para enviar', icon: CheckCircle };
            case 'en_ruta': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En ruta', icon: Bike };
            case 'entregado': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregado', icon: CheckCircle };
            case 'cancelado': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado', icon: XCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Desconocido', icon: XCircle };
        }
    };

    //  Filtrar pedidos
    const pedidosFiltrados = pedidos.filter(p => {
        const coincideBusqueda = p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.mesa && p.mesa.numero.includes(busqueda));
        if (filtroEstado === 'todas') return coincideBusqueda;
        return coincideBusqueda && p.estado === filtroEstado;
    });

    // Contar por estado
    const contarPorEstado = (estado: string) => {
        return pedidos.filter(p => p.estado === estado).length;
    };

    // Cambiar estado de un pedido (conectado al controlador)

    const cambiarEstado = (pedido: any, nuevoEstado: Pedido['estado']) => {
        if (!pedido || !pedido.id) {
            console.error('❌ Pedido sin ID:', pedido);
            alert('Error: Pedido sin identificar');
            return;
        }

        const esDelivery = pedido.tipo_origen === 'delivery';

        // ✅ Para delivery, si el nuevo estado es 'listo'
        if (esDelivery && nuevoEstado === 'listo') {
            router.patch(`/delivery/${pedido.id}/listo`, {}, {
                onSuccess: () => {
                    // ✅ ACTUALIZAR ESTADO LOCAL - REMOVER EL PEDIDO DE LA LISTA
                    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
                    router.reload();
                },
                onError: (errors) => {
                    console.log('❌ Error:', errors);
                    alert('Error al marcar delivery como listo: ' + Object.values(errors).join(' '));
                }
            });
            return;
        }

        // ✅ Para delivery, cambiar a 'preparando'
        if (esDelivery && nuevoEstado === 'preparando') {
            router.patch(`/delivery/${pedido.id}/cocina`, {}, {
                onSuccess: () => {
                    setPedidos(prev => prev.map(p =>
                        p.id === pedido.id ? { ...p, estado: nuevoEstado } : p
                    ));
                    router.reload();
                },
                onError: (errors) => {
                    console.log('❌ Error:', errors);
                    alert('Error al enviar delivery a cocina: ' + Object.values(errors).join(' '));
                }
            });
            return;
        }

        // ✅ Para pedidos de mesa (no delivery)
        router.patch(`/pedidos/${pedido.id}`, { estado: nuevoEstado }, {
            onSuccess: () => {
                // ✅ ACTUALIZAR ESTADO LOCAL - REMOVER SI ES 'listo'
                if (nuevoEstado === 'listo') {
                    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
                } else {
                    setPedidos(prev => prev.map(p =>
                        p.id === pedido.id ? { ...p, estado: nuevoEstado } : p
                    ));
                }
                if (nuevoEstado === 'listo' && pedido.mesa_id) {
                    router.post(`/mesas/${pedido.mesa_id}/pedido-listo`, {}, {
                        onSuccess: () => router.reload()
                    });
                }
            },
            onError: (errors) => {
                alert('Error al cambiar estado: ' + Object.values(errors).join(' '));
            }
        });
    };

    // Tiempo real: nuevos pedidos y cambios de estado desde cualquier terminal
    useSedeChannel('produccion', {
        'pedido.creado': (payload: any) => {
            setPedidos(prev => (prev.some(p => p.id === payload.id)
                ? prev
                : [...prev, { ...payload, tipo_origen: payload.tipo === 'delivery' ? 'delivery' : 'mesa' }]));
        },
        'pedido.actualizado': (payload: any) => {
            setPedidos(prev => {
                if (['listo', 'entregado', 'pagado', 'cancelado'].includes(payload.estado)) {
                    return prev.filter(p => p.id !== payload.id);
                }
                return prev.map(p => (p.id === payload.id ? { ...p, estado: payload.estado } : p));
            });
        },
    });

    const pedidosParaNotificar = pedidos
        .filter(p => ['pendiente', 'preparando'].includes(p.estado))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const pendientes = pedidosParaNotificar.length;
    const pedidosUrgentes = pedidosParaNotificar.filter(p => {
        const createdAt = new Date(p.created_at).getTime();
        return Number.isFinite(createdAt) && Date.now() - createdAt > 10 * 60 * 1000;
    }).length;
    const eventosLivePreview = [
        { label: 'pedido.creado', description: 'Ingresara directo al tablero' },
        { label: 'pedido.actualizado', description: 'Sincronizara cambios de estado' },
        { label: 'pedido.listo', description: 'Avisara a salon y caja' },
    ];

    // Cerrar panel de notificaciones
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notificaciones-container') && notificacionesAbiertas) {
                setNotificacionesAbiertas(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [notificacionesAbiertas]);

    // Obtener pedidos por área (clasificación por productos)
    const pedidosPorArea = (area: string) => {
        return pedidosFiltrados.filter(p => {

            if (p.tipo_origen === 'delivery' && !p.tomado) {
                return false;
            }


            if (p.tipo_origen === 'delivery' && p.tomado) {
                return area === 'cocina';
            }


            if (!p.productos || p.productos.length === 0) return false;

            const tieneCocina = p.productos.some(prod =>
                ['Croissant', 'Sandwich', 'Waffles', 'Pan', 'Hamburguesa', 'Pollo'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tieneBar = p.productos.some(prod =>
                ['Cappuccino', 'Latte', 'Frappé', 'Café', 'Matcha', 'Jugo', 'Chocolate', 'Té'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tieneHorno = p.productos.some(prod =>
                ['Croissant', 'Muffin', 'Pan', 'Bagel'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tienePostres = p.productos.some(prod =>
                ['Cheesecake', 'Tiramisú', 'Brownie', 'Donut', 'Torta', 'Alfajor'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );

            switch (area) {
                case 'cocina': return tieneCocina && !tieneHorno && !tienePostres;
                case 'bar': return tieneBar;
                case 'horno': return tieneHorno;
                case 'postres': return tienePostres;
                default: return true;
            }
        });
    };

    return (
        <>
            <Head title="Producción" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 bg-[#FBF7F0]">

                {/* ===== TÍTULO Y CAMPANITA ===== */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2D1B1A]"> Producción</h1>
                        <p className="text-[#5A3D2B] text-sm font-medium">Control de pedidos en cocina, bar, horno y postres</p>
                    </div>
                    <div className="flex items-center gap-4">

                        {/*  Campanita de notificaciones */}
                        <div className="relative notificaciones-container">
                            <button
                                onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition relative"
                            >
                                <Bell className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700">Notificaciones</span>
                                {pendientes > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {pendientes}
                                    </span>
                                )}
                            </button>

                            {/* Panel desplegable */}
                            {notificacionesAbiertas && (
                                <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-xl bg-white shadow-xl border border-gray-200 z-50">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                        <h3 className="font-bold text-[#2D1B1A] flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-orange-500" />
                                            Notificaciones
                                        </h3>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {pendientes} pendientes
                                        </span>
                                    </div>

                                    <div className="p-2">
                                        {pendientes === 0 ? (
                                            <div className="text-center py-8 text-gray-400 text-sm">
                                                ✅ No hay pedidos pendientes
                                            </div>
                                        ) : (
                                            pedidosParaNotificar.map((pedido) => (
                                                <div
                                                    key={pedido.id}
                                                    className={`p-3 rounded-xl transition border mb-2 last:mb-0 ${pedido.estado === 'preparando'
                                                        ? 'bg-blue-100 border-blue-400'
                                                        : 'bg-white border-gray-100 hover:bg-orange-50 hover:border-orange-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                                                                    {pedido.numero}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(pedido.hora_pedido).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-medium text-[#2D1B1A] mt-1">
                                                                {pedido.tipo_origen === 'delivery' ? '🚚 Delivery' : `🪑 Mesa ${pedido.mesa?.numero || 'No asignada'}`} - {pedido.cliente}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {pedido.productos && pedido.productos.length > 0
                                                                    ? pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')
                                                                    : 'Cargando productos...'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const ubicacion = pedido.tipo_origen === 'delivery' ? '🚚 Delivery' : `Mesa ${pedido.mesa?.numero || 'No asignada'}`;
                                                                const confirmar = confirm(` Tomar pedido #${pedido.numero}\n\n${ubicacion}\nCliente: ${pedido.cliente}\nProductos: ${pedido.productos?.length || 0} items\n\n¿Confirmas que lo prepararás?`);
                                                                if (confirmar) {
                                                                    // ✅ Marcar como tomado para que aparezca en la categoría
                                                                    setPedidos(prev => prev.map(p =>
                                                                        p.id === pedido.id ? { ...p, tomado: true } : p
                                                                    ));
                                                                }
                                                            }}
                                                            className="ml-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1"
                                                        >
                                                            ⚡ Tomar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-3 border-t border-gray-100">
                                        <button
                                            onClick={() => window.location.href = '/produccion'}
                                            className="w-full text-center text-sm text-[#C9A96E] hover:text-[#B8975D] font-medium transition flex items-center justify-center gap-1"
                                        >
                                            Ver todos los pedidos <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">🟠 Pendientes: {contarPorEstado('pendiente')}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">🔵 Preparando: {contarPorEstado('preparando')}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm">🟢 Listos: {contarPorEstado('listo')}</span>
                    </div>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-xl border border-[#8D6B53]/15 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-[#2D1B1A]">
                                    <Radio className="h-4 w-4 text-green-500" />
                                    Centro de trabajo en vivo
                                </p>
                                <p className="mt-1 text-xs text-[#8D6B53]">Diseno listo para conectar eventos de Broadcasting por sede.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Standby
                                </span>
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                    Urgentes: {pedidosUrgentes}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                            {eventosLivePreview.map(evento => (
                                <div key={evento.label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                    <p className="font-mono text-xs font-semibold text-[#2D1B1A]">{evento.label}</p>
                                    <p className="mt-1 text-[11px] text-gray-500">{evento.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#8D6B53]/15 bg-white p-4 text-center shadow-sm">
                        <div className="rounded-lg bg-orange-50 px-2 py-3">
                            <Timer className="mx-auto mb-1 h-4 w-4 text-orange-500" />
                            <p className="text-xl font-bold text-orange-700">{contarPorEstado('pendiente')}</p>
                            <p className="text-[11px] text-gray-500">Pendientes</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-2 py-3">
                            <Clock className="mx-auto mb-1 h-4 w-4 text-blue-500" />
                            <p className="text-xl font-bold text-blue-700">{contarPorEstado('preparando')}</p>
                            <p className="text-[11px] text-gray-500">Preparando</p>
                        </div>
                        <div className="rounded-lg bg-green-50 px-2 py-3">
                            <CheckCircle className="mx-auto mb-1 h-4 w-4 text-green-500" />
                            <p className="text-xl font-bold text-green-700">{contarPorEstado('listo')}</p>
                            <p className="text-[11px] text-gray-500">Listos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#8D6B53]/10">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder=" Buscar pedido, cliente o mesa..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#1A1A1A] placeholder-gray-400"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFiltroEstado('todas')}
                                className={`px-5 py-2 rounded-xl font-semibold transition ${filtroEstado === 'todas'
                                    ? 'bg-[#C9A96E] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFiltroEstado('pendiente')}
                                className={`px-5 py-2 rounded-xl font-semibold transition ${filtroEstado === 'pendiente'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    }`}
                            >
                                Pendientes
                            </button>
                            <button
                                onClick={() => setFiltroEstado('preparando')}
                                className={`px-5 py-2 rounded-xl font-semibold transition ${filtroEstado === 'preparando'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                            >
                                Preparando
                            </button>
                            <button
                                onClick={() => setFiltroEstado('listo')}
                                className={`px-5 py-2 rounded-xl font-semibold transition ${filtroEstado === 'listo'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                    }`}
                            >
                                Listos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid de áreas de producción */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* ========== COCINA ========== */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6B53]/10 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">🍳 Cocina</h2>
                                <p className="text-gray-500 text-xs">Preparación de alimentos</p>
                            </div>
                            <span className="text-xs text-[#C9A96E] font-medium">{pedidosPorArea('cocina').length} pedidos</span>
                        </div>

                        <div className="p-4 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-orange-100 rounded-xl py-2">
                                <p className="text-orange-700 font-bold">{pedidosPorArea('cocina').filter(p => p.estado === 'pendiente').length}</p>
                                <p className="text-gray-500 text-xs">Pendientes</p>
                            </div>
                            <div className="bg-blue-100 rounded-xl py-2">
                                <p className="text-blue-700 font-bold">{pedidosPorArea('cocina').filter(p => p.estado === 'preparando').length}</p>
                                <p className="text-gray-500 text-xs">Preparando</p>
                            </div>
                            <div className="bg-green-100 rounded-xl py-2">
                                <p className="text-green-600 font-bold">{pedidosPorArea('cocina').filter(p => p.estado === 'listo').length}</p>
                                <p className="text-gray-500 text-xs">Listos</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                            {pedidosPorArea('cocina').map((pedido) => {
                                const estado = getEstadoConfig(pedido.estado);
                                return (
                                    <div
                                        key={pedido.id}
                                        className={`flex items-center justify-between border-2 rounded-xl p-3 hover:shadow-sm transition ${pedido.estado === 'preparando' ? 'bg-blue-100 border-blue-600' :
                                            pedido.estado === 'listo' ? 'bg-green-100 border-green-500' :
                                                pedido.estado === 'pendiente' ? 'bg-orange-50 border-orange-300' :
                                                    'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
                                                {pedido.tipo_origen === 'delivery' ? '🚚' : '🍽️'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2D1B1A]">
                                                    {pedido.numero} - {pedido.cliente}
                                                    {pedido.tipo_origen === 'delivery' && (
                                                        <span className="text-xs font-normal text-blue-600 ml-1">🚚 Delivery</span>
                                                    )}
                                                </h4>
                                                <p className="text-gray-500 text-xs">
                                                    {pedido.tipo_origen === 'delivery'
                                                        ? '🚚 Pedido a domicilio'
                                                        : `🪑 Mesa ${pedido.mesa?.numero || '-'}`
                                                    } · {pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estado.bg} ${estado.text}`}>
                                                {estado.label}
                                            </span>
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => {
                                                        const esDelivery = pedido.tipo_origen === 'delivery';
                                                        const mensaje = esDelivery
                                                            ? `✅ Marcar como listo\n\n🚚 Delivery - ${pedido.cliente}\nProductos: ${pedido.productos?.length || 0} items\n\n¿Ya está listo para entregar?`
                                                            : `✅ Marcar como listo\n\nMesa: ${pedido.mesa?.numero || 'No asignada'}\nCliente: ${pedido.cliente}\n\n¿Ya está listo para entregar?`;

                                                        if (confirm(mensaje)) {
                                                            cambiarEstado(pedido, 'listo');
                                                        }
                                                    }}
                                                    className="text-green-500 hover:text-green-700 text-xs font-medium"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {pedidosPorArea('cocina').length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">No hay pedidos en cocina</p>
                            )}
                        </div>
                    </div>

                    {/* ========== BAR ========== */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6B53]/10 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">☕ Bar</h2>
                                <p className="text-gray-500 text-xs">Bebidas y café</p>
                            </div>
                            <span className="text-xs text-[#C9A96E] font-medium">{pedidosPorArea('bar').length} pedidos</span>
                        </div>

                        <div className="p-4 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-orange-100 rounded-xl py-2">
                                <p className="text-orange-700 font-bold">{pedidosPorArea('bar').filter(p => p.estado === 'pendiente').length}</p>
                                <p className="text-gray-500 text-xs">Pendientes</p>
                            </div>
                            <div className="bg-blue-100 rounded-xl py-2">
                                <p className="text-blue-700 font-bold">{pedidosPorArea('bar').filter(p => p.estado === 'preparando').length}</p>
                                <p className="text-gray-500 text-xs">Preparando</p>
                            </div>
                            <div className="bg-green-100 rounded-xl py-2">
                                <p className="text-green-600 font-bold">{pedidosPorArea('bar').filter(p => p.estado === 'listo').length}</p>
                                <p className="text-gray-500 text-xs">Listos</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                            {pedidosPorArea('bar').map((pedido) => {
                                const estado = getEstadoConfig(pedido.estado);
                                return (
                                    <div
                                        key={pedido.id}
                                        className={`flex items-center justify-between border-2 rounded-xl p-3 hover:shadow-sm transition ${pedido.estado === 'preparando' ? 'border-blue-600 bg-blue-50' :
                                            pedido.estado === 'listo' ? 'border-green-500 bg-green-50' :
                                                pedido.estado === 'pendiente' ? 'border-orange-300 bg-orange-50' :
                                                    'border-gray-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">☕</div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2D1B1A]">{pedido.numero} - {pedido.cliente}</h4>
                                                <p className="text-gray-500 text-xs">Mesa {pedido.mesa?.numero || '-'} · {pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estado.bg} ${estado.text}`}>
                                                {estado.label}
                                            </span>
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => {
                                                        const esDelivery = pedido.tipo_origen === 'delivery';
                                                        const mensaje = esDelivery
                                                            ? `👨‍🍳 Tomar pedido\n\n🚚 Delivery - ${pedido.cliente}\nProductos: ${pedido.productos?.length || 0} items\n\n¿Confirmas que lo prepararás?`
                                                            : `👨‍🍳 Tomar pedido\n\nMesa: ${pedido.mesa?.numero || 'No asignada'}\nCliente: ${pedido.cliente}\nProductos: ${pedido.productos?.length || 0} items\n\n¿Confirmas que lo prepararás?`;

                                                        if (confirm(mensaje)) {
                                                            cambiarEstado(pedido, 'preparando');
                                                        }
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'listo')}
                                                    className="text-green-500 hover:text-green-700 text-xs font-medium"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {pedidosPorArea('bar').length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">No hay pedidos en bar</p>
                            )}
                        </div>
                    </div>

                    {/* ========== HORNO ========== */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6B53]/10 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">🔥 Horno</h2>
                                <p className="text-gray-500 text-xs">Panadería y pastelería</p>
                            </div>
                            <span className="text-xs text-[#C9A96E] font-medium">{pedidosPorArea('horno').length} lotes</span>
                        </div>

                        <div className="p-4 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-orange-100 rounded-xl py-2">
                                <p className="text-orange-700 font-bold">{pedidosPorArea('horno').filter(p => p.estado === 'pendiente').length}</p>
                                <p className="text-gray-500 text-xs">Pendientes</p>
                            </div>
                            <div className="bg-blue-100 rounded-xl py-2">
                                <p className="text-blue-700 font-bold">{pedidosPorArea('horno').filter(p => p.estado === 'preparando').length}</p>
                                <p className="text-gray-500 text-xs">Horneando</p>
                            </div>
                            <div className="bg-green-100 rounded-xl py-2">
                                <p className="text-green-600 font-bold">{pedidosPorArea('horno').filter(p => p.estado === 'listo').length}</p>
                                <p className="text-gray-500 text-xs">Listos</p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                            {pedidosPorArea('horno').map((pedido) => {
                                const estado = getEstadoConfig(pedido.estado);
                                return (
                                    <div key={pedido.id} className="flex items-center justify-between border rounded-xl p-3 hover:shadow-sm transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">🔥</div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2D1B1A]">{pedido.numero} - {pedido.cliente}</h4>
                                                <p className="text-gray-500 text-xs">{pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estado.bg} ${estado.text}`}>
                                                {estado.label}
                                            </span>
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Iniciar
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'listo')}
                                                    className="text-green-500 hover:text-green-700 text-xs font-medium"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {pedidosPorArea('horno').length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">No hay lotes en horno</p>
                            )}
                        </div>
                    </div>

                    {/* ========== POSTRES ========== */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#8D6B53]/10 overflow-hidden xl:col-span-3">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">🍰 Postres</h2>
                                <p className="text-gray-500 text-xs">Preparación y decoración</p>
                            </div>
                            <span className="text-xs text-[#C9A96E] font-medium">{pedidosPorArea('postres').length} pedidos</span>
                        </div>

                        <div className="p-4 grid grid-cols-4 gap-2 text-center">
                            <div className="bg-orange-100 rounded-xl py-2">
                                <p className="text-orange-700 font-bold">{pedidosPorArea('postres').filter(p => p.estado === 'pendiente').length}</p>
                                <p className="text-gray-500 text-xs">Pendientes</p>
                            </div>
                            <div className="bg-blue-100 rounded-xl py-2">
                                <p className="text-blue-700 font-bold">{pedidosPorArea('postres').filter(p => p.estado === 'preparando').length}</p>
                                <p className="text-gray-500 text-xs">Decorando</p>
                            </div>
                            <div className="bg-green-100 rounded-xl py-2">
                                <p className="text-green-600 font-bold">{pedidosPorArea('postres').filter(p => p.estado === 'listo').length}</p>
                                <p className="text-gray-500 text-xs">Listos</p>
                            </div>
                            <div className="bg-purple-100 rounded-xl py-2">
                                <p className="text-purple-700 font-bold">{pedidosPorArea('postres').length}</p>
                                <p className="text-gray-500 text-xs">Total</p>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
                            {pedidosPorArea('postres').map((pedido) => {
                                const estado = getEstadoConfig(pedido.estado);
                                return (
                                    <div key={pedido.id} className="flex items-center justify-between border rounded-xl p-3 hover:shadow-sm transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl">🍰</div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#2D1B1A]">{pedido.numero} - {pedido.cliente}</h4>
                                                <p className="text-gray-500 text-xs">Mesa {pedido.mesa?.numero || '-'} · {pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${estado.bg} ${estado.text}`}>
                                                {estado.label}
                                            </span>
                                            {pedido.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido, 'listo')}
                                                    className="text-green-500 hover:text-green-700 text-xs font-medium"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {pedidosPorArea('postres').length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4 col-span-2">No hay pedidos de postres</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
