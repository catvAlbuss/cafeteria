import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Users,
    Coffee,
    Armchair,
    Search,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    Minus,
    LayoutDashboard,
    ShoppingCart,
    DollarSign,
    BarChart3,
    Package,
    Menu,
    ClipboardList,
    Truck,
    CreditCard,
    Settings,
    UserCog,
    Bell,
    HelpCircle,
    FileText,
    Calendar,
    MapPin,
    Star,
    Tag,
    Gift,
    AlertCircle,
    UtensilsCrossed
} from 'lucide-react';

interface Mesa {
    id: number;
    numero: string;
    capacidad: number;
    sillas: number;
    estado: 'libre' | 'pendiente' | 'ocupada' | 'reserva' | 'listo_cobrar';
    cliente?: string;
    personas?: number;
}

interface Cliente {
    id: number;
    nombre: string;
    mesa: string;
    personas: number;
    estado: 'ocupada' | 'pendiente' | 'reserva' | 'libre';
    telefono?: string;
}

export default function MesasDistribucion() {
    //  Recibir mesas desde el controlador
    const { mesas: mesasIniciales } = usePage<{ mesas?: Mesa[] }>().props;

    //  Estado - usar datos del controlador
    const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales || []);

    // Clientes activos (simulados - luego se conectará con BD)
    const [clientes, setClientes] = useState<Cliente[]>([
        { id: 1, nombre: 'María López', mesa: '01', personas: 2, estado: 'ocupada' },
        { id: 2, nombre: 'Carlos Ruiz', mesa: '02', personas: 4, estado: 'ocupada' },
        { id: 3, nombre: 'Disponible', mesa: '03', personas: 6, estado: 'libre' },
        { id: 4, nombre: 'José Pérez', mesa: '04', personas: 5, estado: 'reserva' }
    ]);

    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');

    // Configuración de colores por estado
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'libre': return { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600', label: '🟢 Libre' };
            case 'pendiente': return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-600', label: '🟡 Pendiente' };
            case 'ocupada': return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', label: '🟠 Ocupada' };
            case 'reserva': return { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600', label: '🔵 Reserva' };
            case 'listo_cobrar': return { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600', label: '🟣 Cobrar' };
            default: return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', label: 'Estado' };
        }
    };

    // Renderizar sillas alrededor de la mesa
    const renderSillas = (cantidad: number, estado: string) => {
        const sillas = [];
        const filas = Math.ceil(cantidad / 4);
        const cols = Math.min(cantidad, 4);

        for (let i = 0; i < filas; i++) {
            const sillasEnFila = i === filas - 1 ? cantidad - (i * 4) : cols;
            for (let j = 0; j < sillasEnFila; j++) {
                sillas.push(
                    <Armchair
                        key={`${i}-${j}`}
                        className={`w-4 h-4 ${estado === 'ocupada' ? 'text-orange-400' :
                            estado === 'pendiente' ? 'text-yellow-400' :
                                estado === 'reserva' ? 'text-blue-400' :
                                    estado === 'listo_cobrar' ? 'text-purple-400' :
                                        'text-green-400'
                            }`}
                    />
                );
            }
        }
        return sillas;
    };

    // Filtrar clientes
    const clientesFiltrados = clientes.filter(c => {
        const coincideBusqueda = c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
            c.mesa.includes(busquedaCliente);
        if (filtroEstado === 'todas') return coincideBusqueda;
        return coincideBusqueda && c.estado === filtroEstado;
    });

    //  Cambiar estado de una mesa (conectado al controlador)
    const cambiarEstado = (id: number, nuevoEstado: string) => {
        router.patch(`/mesas/${id}`, {
            estado: nuevoEstado,
        }, {
            onSuccess: () => {
                // Actualizar el estado local
                setMesas(mesas.map(mesa =>
                    mesa.id === id ? { ...mesa, estado: nuevoEstado as Mesa['estado'] } : mesa
                ));
            },
            onError: (errors) => {
                alert('Error al cambiar estado: ' + Object.values(errors).join(' '));
            }
        });
    };

    //  Crear nueva mesa
    const crearMesa = () => {
        const numero = prompt('Ingrese el número de mesa:');
        if (!numero) return;

        const capacidad = prompt('Ingrese la capacidad (personas):');
        if (!capacidad) return;

        router.post('/mesas', {
            numero: numero,
            capacidad: parseInt(capacidad),
            sillas: parseInt(capacidad),
        }, {
            onSuccess: () => {
                router.reload();
            },
            onError: (errors) => {
                alert('Error al crear mesa: ' + Object.values(errors).join(' '));
            }
        });
    };

    return (
        <>
            <Head title="Distribución de Mesas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 bg-[#FBF7F0]">

                {/* TÍTULO + LEYENDA + BOTÓN NUEVA MESA */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2D1B1A]"> Gestión de Mesas</h1>
                        <p className="text-[#5A3D2B] text-sm font-medium">Administración del restaurante</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/*  Botón Nueva Mesa */}
                        <button
                            onClick={crearMesa}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Mesa
                        </button>
                        {/* Leyenda de colores */}
                        <div className="flex flex-wrap items-center gap-3 p-2 bg-white/80 rounded-xl border border-[#8D6B53]/20">
                            <span className="text-xs font-medium text-[#5A3D2B]">Estados:</span>
                            <span className="flex items-center gap-1 text-xs text-gray-700">
                                <span className="w-3 h-3 rounded-full bg-green-400"></span> Libre
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-700">
                                <span className="w-3 h-3 rounded-full bg-yellow-400"></span> Pendiente
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-700">
                                <span className="w-3 h-3 rounded-full bg-orange-400"></span> Ocupada
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-700">
                                <span className="w-3 h-3 rounded-full bg-blue-400"></span> Reserva
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-700">
                                <span className="w-3 h-3 rounded-full bg-purple-400"></span> Cobrar
                            </span>
                        </div>
                    </div>
                </div>

                {/* Layout de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ============================================================ */}
                    {/* COLUMNA IZQUIERDA: Clientes y buscador */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-[#8D6B53]/20 p-4 shadow-sm">

                        {/* Filtros rápidos */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setFiltroEstado('todas')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filtroEstado === 'todas' ? 'bg-[#2D1B1A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFiltroEstado('libre')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filtroEstado === 'libre' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                                Libres
                            </button>
                            <button
                                onClick={() => setFiltroEstado('reserva')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filtroEstado === 'reserva' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                                Reserv.
                            </button>
                            <button
                                onClick={() => setFiltroEstado('ocupada')}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filtroEstado === 'ocupada' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                            >
                                Ocup.
                            </button>
                        </div>

                        {/* Buscador de clientes */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full p-2 pl-9 rounded-lg border border-[#8D6B53]/20 text-sm text-[#1A1A1A] placeholder-gray-500 bg-[#FBF7F0] focus:ring-1 focus:ring-[#C9A96E] outline-none"
                                value={busquedaCliente}
                                onChange={(e) => setBusquedaCliente(e.target.value)}
                            />
                        </div>

                        {/* Lista de clientes */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {clientesFiltrados.map((cliente) => {
                                const config = getEstadoConfig(cliente.estado);
                                return (
                                    <div
                                        key={cliente.id}
                                        className={`p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-sm transition cursor-pointer`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-[#2D1B1A] text-sm">{cliente.nombre}</p>
                                                <p className="text-xs text-[#8D6B53]">Mesa {cliente.mesa}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">📋 {cliente.personas} pers.</span>
                                                <span className={`text-xs font-medium ${config.text}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {clientesFiltrados.length === 0 && (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    No se encontraron clientes
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* COLUMNA DERECHA: Distribución de mesas */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-2">
                        <h2 className="text-sm font-semibold text-[#5A3D2B] mb-3"> Distribución de Mesas - Estado en tiempo real</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {mesas.map((mesa) => {
                                const config = getEstadoConfig(mesa.estado);
                                return (
                                    <div
                                        key={mesa.id}
                                        className={`p-3 rounded-xl border-2 ${config.border} ${config.bg} shadow-sm hover:shadow-md transition-all duration-300`}
                                    >
                                        {/* Número de mesa */}
                                        <div className="text-center mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 ${config.border} border text-gray-700`}>
                                                Mesa #{mesa.numero}
                                            </span>
                                        </div>

                                        {/* Dibujo de la mesa */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex gap-0.5 mb-1 flex-wrap justify-center">
                                                {renderSillas(Math.min(mesa.sillas, 4), mesa.estado)}
                                            </div>

                                            <div className={`w-12 h-8 rounded-md ${config.bg} border-2 ${config.border} flex items-center justify-center`}>
                                                <span className={`text-xs font-bold ${config.text}`}>
                                                    {mesa.capacidad}
                                                </span>
                                            </div>

                                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                                                {renderSillas(Math.max(0, mesa.sillas - 4), mesa.estado)}
                                            </div>
                                        </div>

                                        {/* Estado */}
                                        <div className="text-center mt-1">
                                            <p className={`text-xs font-medium ${config.text}`}>{config.label}</p>
                                            <p className="text-xs text-gray-400">{mesa.capacidad} personas</p>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <button
                                                onClick={() => cambiarEstado(mesa.id, 'libre')}
                                                className="flex-1 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-[10px] font-medium transition"
                                            >
                                                Libre
                                            </button>
                                            <button
                                                onClick={() => cambiarEstado(mesa.id, 'ocupada')}
                                                className="flex-1 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-medium transition"
                                            >
                                                Ocupar
                                            </button>
                                            <button
                                                onClick={() => cambiarEstado(mesa.id, 'pendiente')}
                                                className="flex-1 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[10px] font-medium transition"
                                            >
                                                Espera
                                            </button>
                                            <button
                                                onClick={() => cambiarEstado(mesa.id, 'listo_cobrar')}
                                                className="flex-1 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-medium transition"
                                            >
                                                Cobrar
                                            </button>
                                        </div>

                                        {/*  Botón Tomar Pedido (solo cuando está ocupada) */}
                                        {mesa.estado === 'ocupada' && (
                                            <button
                                                onClick={() => {
                                                    window.location.href = `/ventas?mesa=${mesa.numero}`;
                                                }}
                                                className="w-full mt-2 py-1.5 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                                            >
                                                🍽️ Tomar Pedido
                                            </button>
                                        )}

                                        {/*  Botón Cobrar (solo cuando está listo_cobrar) */}
                                        {mesa.estado === 'listo_cobrar' && (
                                            <button
                                                onClick={() => {
                                                    window.location.href = `/caja?mesa=${mesa.numero}`;
                                                }}
                                                className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 animate-pulse"
                                            >
                                                💰 Cobrar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}