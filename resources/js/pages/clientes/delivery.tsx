import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Bike,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    MapPin,
    Phone,
    User,
    DollarSign,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    TrendingUp,
    Star,
    Calendar,
    Filter,
    ArrowRight
} from 'lucide-react';

interface DeliveryPedido {
    id: number;
    codigo: string;
    cliente: string;
    telefono: string;
    direccion: string;
    productos: string;
    total: number;
    estado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
    repartidor?: string;
    horaPedido: string;
    horaEntrega?: string;
    distancia?: string;
}

export default function Delivery() {
    // 📋 Datos de ejemplo
    const [pedidos, setPedidos] = useState<DeliveryPedido[]>([
        { id: 1, codigo: 'D-001', cliente: 'Juan Pérez', telefono: '987 654 321', direccion: 'Av. Principal 123, San Isidro', productos: '2 Cappuccinos · 1 Cheesecake', total: 45, estado: 'pendiente', repartidor: 'Luis Rojas', horaPedido: '10:30 AM' },
        { id: 2, codigo: 'D-002', cliente: 'María López', telefono: '912 345 678', direccion: 'Calle Las Flores 456, Miraflores', productos: '1 Latte · 2 Croissants', total: 78, estado: 'en_ruta', repartidor: 'Pedro Ruiz', horaPedido: '11:15 AM' },
        { id: 3, codigo: 'D-003', cliente: 'Carlos Ruiz', telefono: '901 222 333', direccion: 'Av. Los Pinos 789, Surco', productos: '3 Cafés americanos', total: 60, estado: 'entregado', repartidor: 'José Flores', horaPedido: '09:00 AM', horaEntrega: '09:35 AM' },
        { id: 4, codigo: 'D-004', cliente: 'Ana Torres', telefono: '998 777 555', direccion: 'Calle El Sol 321, Barranco', productos: '2 Mochas · 1 Brownie', total: 52, estado: 'pendiente', horaPedido: '11:45 AM' },
        { id: 5, codigo: 'D-005', cliente: 'José Mamani', telefono: '956 444 222', direccion: 'Av. La Cultura 654, San Borja', productos: '1 Frappé · 2 Donuts', total: 35, estado: 'en_ruta', repartidor: 'Luis Rojas', horaPedido: '10:50 AM' },
        { id: 6, codigo: 'D-006', cliente: 'Lucía Torres', telefono: '934 567 890', direccion: 'Calle Primavera 987, La Molina', productos: '3 Smoothies · 1 Sandwich', total: 68, estado: 'entregado', repartidor: 'Pedro Ruiz', horaPedido: '08:30 AM', horaEntrega: '09:10 AM' },
        { id: 7, codigo: 'D-007', cliente: 'Miguel Ángel', telefono: '987 123 456', direccion: 'Av. Javier Prado 456, San Isidro', productos: '2 Capuccinos · 2 Croissants', total: 55, estado: 'cancelado', horaPedido: '11:00 AM' },
    ]);

    // 📋 Estado de filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // 📊 Estadísticas
    const estadisticas = {
        pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
        enRuta: pedidos.filter(p => p.estado === 'en_ruta').length,
        entregados: pedidos.filter(p => p.estado === 'entregado').length,
        ingresos: pedidos.filter(p => p.estado === 'entregado').reduce((sum, p) => sum + p.total, 0),
    };

    // 📊 Pedidos filtrados
    const pedidosFiltrados = pedidos.filter(p => {
        const busquedaOk = !busqueda ||
            p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.cliente.toLowerCase().includes(busqueda.toLowerCase());
        const estadoOk = !filtroEstado || p.estado === filtroEstado;
        return busquedaOk && estadoOk;
    });

    // 🎨 Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch(estado) {
            case 'pendiente': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente', icon: Clock };
            case 'en_ruta': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En ruta', icon: Bike };
            case 'entregado': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregado', icon: CheckCircle };
            case 'cancelado': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado', icon: XCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Desconocido', icon: XCircle };
        }
    };

    // 📊 Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // 📋 Cambiar estado
    const cambiarEstado = (id: number, nuevoEstado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado') => {
        setPedidos(pedidos.map(p =>
            p.id === id ? { ...p, estado: nuevoEstado, horaEntrega: nuevoEstado === 'entregado' ? new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : p.horaEntrega } : p
        ));
    };

    // 📋 Eliminar pedido
    const eliminarPedido = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este pedido?')) return;
        setPedidos(pedidos.filter(p => p.id !== id));
    };

    return (
        <>
            <Head title="Delivery - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">🚚 Deliverys</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión y seguimiento de pedidos a domicilio</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold">
                            <Plus className="w-4 h-4" />
                            Nuevo Delivery
                        </button>
                    </div>
                </div>

                {/* ===== ESTADÍSTICAS ===== */}
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
                                <p className="text-white/60 text-sm font-medium">Ingresos</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(estadisticas.ingresos)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== BUSCADOR Y FILTROS ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar pedido o cliente..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
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
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== LISTA DE PEDIDOS Y PANEL DERECHO ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* ===== PEDIDOS ===== */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#F3E1C8] p-5">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Pedidos de hoy</h2>
                            <span className="text-sm text-[#5A3D2B]">{pedidosFiltrados.length} pedidos</span>
                        </div>

                        <div className="space-y-3">
                            {pedidosFiltrados.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No hay pedidos</div>
                            ) : (
                                pedidosFiltrados.map((pedido) => {
                                    const estadoConfig = getEstadoConfig(pedido.estado);
                                    const EstadoIcon = estadoConfig.icon;
                                    return (
                                        <div key={pedido.id} className="border border-[#F3E1C8] rounded-2xl p-4 hover:shadow-md transition">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-[#2D1B1A]">{pedido.codigo}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1`}>
                                                            <EstadoIcon className="w-3 h-3" />
                                                            {estadoConfig.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#5A3D2B] text-sm mt-1">{pedido.cliente}</p>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {pedido.telefono}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pedido.direccion}</span>
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pedido.horaPedido}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{pedido.productos}</p>
                                                    {pedido.repartidor && (
                                                        <p className="text-xs text-gray-400 mt-1">Repartidor: {pedido.repartidor}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end justify-between gap-2 min-w-[120px]">
                                                    <p className="text-xl font-bold text-[#C9A96E]">{formatCurrency(pedido.total)}</p>
                                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                                        {pedido.estado === 'pendiente' && (
                                                            <button
                                                                onClick={() => cambiarEstado(pedido.id, 'en_ruta')}
                                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                Enviar
                                                            </button>
                                                        )}
                                                        {pedido.estado === 'en_ruta' && (
                                                            <button
                                                                onClick={() => cambiarEstado(pedido.id, 'entregado')}
                                                                className="bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                Entregar
                                                            </button>
                                                        )}
                                                        {pedido.estado === 'pendiente' && (
                                                            <button
                                                                onClick={() => cambiarEstado(pedido.id, 'cancelado')}
                                                                className="bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => eliminarPedido(pedido.id)}
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

                    {/* ===== PANEL DERECHO ===== */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] p-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">📊 Resumen del día</h2>
                        <div className="space-y-4">
                            <div className="border border-[#F3E1C8] rounded-xl p-4">
                                <p className="text-sm text-[#5A3D2B]">Tiempo promedio</p>
                                <p className="text-3xl font-bold text-[#2D1B1A]">22 min</p>
                            </div>

                            <div className="border border-[#F3E1C8] rounded-xl p-4">
                                <p className="text-sm text-[#5A3D2B] mb-3">Rendimiento repartidores</p>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#2D1B1A]">Luis Rojas</span>
                                            <span className="text-[#5A3D2B]">8 pedidos</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div className="h-2 bg-green-500 rounded-full w-4/5"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#2D1B1A]">Pedro Ruiz</span>
                                            <span className="text-[#5A3D2B]">5 pedidos</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div className="h-2 bg-blue-500 rounded-full w-3/5"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#2D1B1A]">José Flores</span>
                                            <span className="text-[#5A3D2B]">3 pedidos</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div className="h-2 bg-yellow-500 rounded-full w-2/5"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[#F3E1C8] rounded-xl p-4">
                                <p className="text-sm text-[#5A3D2B]">Satisfacción clientes</p>
                                <p className="text-3xl font-bold text-green-500">96%</p>
                            </div>

                            <button className="w-full bg-[#C9A96E] hover:bg-[#B8975D] text-white py-3 rounded-xl font-semibold transition">
                                Ver reporte completo
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}