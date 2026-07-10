import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
    ChevronRight
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
            case 'pendiente': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pendiente', icon: '🟠' };
            case 'preparando': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Preparando', icon: '🔵' };
            case 'listo': return { bg: 'bg-green-100', text: 'text-green-600', label: 'Listo', icon: '🟢' };
            case 'entregado': return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Entregado', icon: '⚪' };
            case 'pagado': return { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Pagado', icon: '🟣' };
            case 'cancelado': return { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelado', icon: '🔴' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Desconocido', icon: '⚪' };
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

    const cambiarEstado = (id: number, nuevoEstado: string) => {
        const pedido = pedidos.find(p => p.id === id);

        router.patch(`/pedidos/${id}`, {
            estado: nuevoEstado,
        }, {
            onSuccess: () => {
                // Actualizar estado local
                setPedidos(prev => prev.map(p =>
                    p.id === id ? { ...p, estado: nuevoEstado as Pedido['estado'] } : p
                ));

                // Si se marca como LISTO, notificar a la mesa
                if (nuevoEstado === 'listo' && pedido?.mesa_id) {
                    router.post(`/mesas/${pedido.mesa_id}/pedido-listo`, {}, {
                        onSuccess: () => {
                            
                            window.location.reload();
                        }
                    });
                }
            },
            onError: (errors) => {
                alert('Error al cambiar estado: ' + Object.values(errors).join(' '));
            }
        });
    };

    //  Pedidos pendientes para notificaciones
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente');
    const pendientes = pedidosPendientes.length;

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
            const tieneCocina = p.productos.some(prod =>
                ['Croissant', 'Sandwich', 'Waffles', 'Pan'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tieneBar = p.productos.some(prod =>
                ['Cappuccino', 'Latte', 'Frappé', 'Café', 'Matcha', 'Jugo'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tieneHorno = p.productos.some(prod =>
                ['Croissant', 'Muffin', 'Pan'].some(nombre =>
                    prod.nombre.includes(nombre)
                )
            );
            const tienePostres = p.productos.some(prod =>
                ['Cheesecake', 'Tiramisú', 'Brownie', 'Donut'].some(nombre =>
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
                                            pedidosPendientes.map((pedido) => (
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
                                                                🪑 Mesa {pedido.mesa?.numero || 'No asignada'} - {pedido.cliente}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(' · ')}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => {

                                                                const confirmar = confirm(` Tomar pedido #${pedido.numero}\n\nMesa: ${pedido.mesa?.numero || 'No asignada'}\nCliente: ${pedido.cliente}\nProductos: ${pedido.productos.length} items\n\n¿Confirmas que lo prepararás?`);
                                                                if (confirmar) {
                                                                    cambiarEstado(pedido.id, 'preparando');
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
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🍽️</div>
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
                                                    onClick={() => cambiarEstado(pedido.id, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => {
                                                        const confirmar = confirm(`✅ Marcar como listo\n\nPedido #${pedido.numero}\nMesa: ${pedido.mesa?.numero || 'No asignada'}\nCliente: ${pedido.cliente}\n\n¿Ya está listo para entregar?`);
                                                        if (confirmar) {
                                                            cambiarEstado(pedido.id, 'listo');
                                                        }
                                                    }}
                                                    className="text-green-500 hover:text-green-700 text-xs font-medium"
                                                >
                                                    ✅ Listo
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
                                                    onClick={() => cambiarEstado(pedido.id, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido.id, 'listo')}
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
                                                    onClick={() => cambiarEstado(pedido.id, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Iniciar
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido.id, 'listo')}
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
                                                    onClick={() => cambiarEstado(pedido.id, 'preparando')}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                                >
                                                    Prep.
                                                </button>
                                            )}
                                            {pedido.estado === 'preparando' && (
                                                <button
                                                    onClick={() => cambiarEstado(pedido.id, 'listo')}
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