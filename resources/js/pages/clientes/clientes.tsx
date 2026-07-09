import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Users,
    User,
    Phone,
    Mail,
    MapPin,
    ShoppingBag,
    DollarSign,
    Star,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    X,
    CheckCircle,
    XCircle,
    TrendingUp,
    Award,
    Clock,
    Calendar
} from 'lucide-react';

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
    pedidos: number;
    totalGastado: number;
    estado: 'activo' | 'vip' | 'inactivo';
    fechaRegistro: string;
    ultimaVisita: string;
}

export default function Clientes() {
    // 📋 Datos de ejemplo
    const [clientes, setClientes] = useState<Cliente[]>([
        { id: 1, nombre: 'Juan Pérez', telefono: '987 654 321', email: 'juan@email.com', direccion: 'Av. Principal 123', pedidos: 12, totalGastado: 540, estado: 'activo', fechaRegistro: '15/01/2025', ultimaVisita: '26/06/2026' },
        { id: 2, nombre: 'María López', telefono: '912 345 678', email: 'maria@email.com', direccion: 'Calle Las Flores 456', pedidos: 28, totalGastado: 1240, estado: 'vip', fechaRegistro: '02/03/2024', ultimaVisita: '25/06/2026' },
        { id: 3, nombre: 'Carlos Ruiz', telefono: '901 222 333', email: 'carlos@email.com', direccion: 'Av. Los Pinos 789', pedidos: 3, totalGastado: 85, estado: 'inactivo', fechaRegistro: '10/11/2025', ultimaVisita: '01/02/2026' },
        { id: 4, nombre: 'Ana Torres', telefono: '998 777 555', email: 'ana@email.com', direccion: 'Calle El Sol 321', pedidos: 45, totalGastado: 2150, estado: 'vip', fechaRegistro: '01/06/2023', ultimaVisita: '26/06/2026' },
        { id: 5, nombre: 'José Mamani', telefono: '956 444 222', email: 'jose@email.com', direccion: 'Av. La Cultura 654', pedidos: 8, totalGastado: 320, estado: 'activo', fechaRegistro: '20/08/2025', ultimaVisita: '24/06/2026' },
        { id: 6, nombre: 'Lucía Torres', telefono: '934 567 890', email: 'lucia@email.com', direccion: 'Calle Primavera 987', pedidos: 2, totalGastado: 45, estado: 'inactivo', fechaRegistro: '05/12/2025', ultimaVisita: '10/03/2026' },
    ]);

    // 📋 Estado del modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [esEdicion, setEsEdicion] = useState(false);

    // 📋 Estado del formulario
    const [formulario, setFormulario] = useState({
        id: 0,
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo' as 'activo' | 'vip' | 'inactivo',
    });

    // 📋 Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // 📊 Estadísticas
    const estadisticas = {
        total: clientes.length,
        activos: clientes.filter(c => c.estado === 'activo' || c.estado === 'vip').length,
        vip: clientes.filter(c => c.estado === 'vip').length,
        totalGastado: clientes.reduce((sum, c) => sum + c.totalGastado, 0),
    };

    // 📊 Clientes filtrados
    const clientesFiltrados = clientes.filter(c => {
        const busquedaOk = !busqueda ||
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.telefono.includes(busqueda) ||
            c.email.toLowerCase().includes(busqueda.toLowerCase());
        const estadoOk = !filtroEstado || c.estado === filtroEstado;
        return busquedaOk && estadoOk;
    });

    // 🎨 Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch(estado) {
            case 'activo': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo', icon: CheckCircle };
            case 'vip': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'VIP', icon: Star };
            case 'inactivo': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Inactivo', icon: XCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Desconocido', icon: XCircle };
        }
    };

    // 📊 Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // 📋 Funciones CRUD
    const abrirNuevo = () => {
        setEsEdicion(false);
        setFormulario({
            id: 0,
            nombre: '',
            telefono: '',
            email: '',
            direccion: '',
            estado: 'activo',
        });
        setModalAbierto(true);
    };

    const abrirEditar = (cliente: Cliente) => {
        setEsEdicion(true);
        setFormulario({
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
            estado: cliente.estado,
        });
        setModalAbierto(true);
    };

    const guardarCliente = () => {
        if (!formulario.nombre || !formulario.telefono) {
            alert('Complete los campos obligatorios (Nombre y Teléfono).');
            return;
        }

        if (esEdicion) {
            setClientes(clientes.map(c =>
                c.id === formulario.id ? {
                    ...c,
                    nombre: formulario.nombre,
                    telefono: formulario.telefono,
                    email: formulario.email,
                    direccion: formulario.direccion,
                    estado: formulario.estado,
                } : c
            ));
        } else {
            const nuevoCliente: Cliente = {
                id: Date.now(),
                nombre: formulario.nombre,
                telefono: formulario.telefono,
                email: formulario.email,
                direccion: formulario.direccion,
                pedidos: 0,
                totalGastado: 0,
                estado: formulario.estado,
                fechaRegistro: new Date().toLocaleDateString('es-PE'),
                ultimaVisita: new Date().toLocaleDateString('es-PE'),
            };
            setClientes([...clientes, nuevoCliente]);
        }

        setModalAbierto(false);
    };

    const eliminarCliente = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
        setClientes(clientes.filter(c => c.id !== id));
    };

    const verCliente = (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setModalVerAbierto(true);
    };

    return (
        <>
            <Head title="Clientes - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">👥 Clientes</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión y control de clientes del sistema</p>
                    </div>
                    <button
                        onClick={abrirNuevo}
                        className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cliente
                    </button>
                </div>

                {/* ===== ESTADÍSTICAS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Total clientes</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{estadisticas.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Activos</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{estadisticas.activos}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">VIP</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1">{estadisticas.vip}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Star className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Total gastado</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(estadisticas.totalGastado)}</p>
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
                                placeholder="Buscar por nombre, teléfono o email..."
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
                            <option value="activo">Activos</option>
                            <option value="vip">VIP</option>
                            <option value="inactivo">Inactivos</option>
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

                {/* ===== TABLA DE CLIENTES ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Listado de clientes</h2>
                        <span className="text-sm text-[#5A3D2B]">{clientesFiltrados.length} clientes</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Contacto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Pedidos</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Total gastado</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clientesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-10">No hay clientes</td>
                                    </tr>
                                ) : (
                                    clientesFiltrados.map((cliente) => {
                                        const estadoConfig = getEstadoConfig(cliente.estado);
                                        const EstadoIcon = estadoConfig.icon;
                                        return (
                                            <tr key={cliente.id} className="hover:bg-[#FBF3E7] transition">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-[#2D1B1A]">{cliente.nombre}</p>
                                                        <p className="text-xs text-gray-400">{cliente.fechaRegistro}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm text-[#5A3D2B] flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {cliente.telefono}
                                                        </p>
                                                        {cliente.email && (
                                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {cliente.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B]">{cliente.pedidos}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-[#2D1B1A]">{formatCurrency(cliente.totalGastado)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1 w-fit`}>
                                                        <EstadoIcon className="w-3 h-3" />
                                                        {estadoConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1.5">
                                                        <button
                                                            onClick={() => verCliente(cliente)}
                                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Ver
                                                        </button>
                                                        <button
                                                            onClick={() => abrirEditar(cliente)}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarCliente(cliente.id)}
                                                            className="bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* MODAL: Nuevo/Editar Cliente */}
                {/* ============================================================ */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">
                                    {esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
                                </h2>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Nombre completo *</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.nombre}
                                        onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Teléfono *</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.telefono}
                                        onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                                        placeholder="987 654 321"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Correo electrónico</label>
                                    <input
                                        type="email"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.email}
                                        onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                                        placeholder="cliente@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Dirección</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.direccion}
                                        onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                                        placeholder="Av. Principal 123"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Estado</label>
                                    <select
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.estado}
                                        onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as 'activo' | 'vip' | 'inactivo' })}
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="vip">VIP</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarCliente}
                                    className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: Ver Cliente */}
                {/* ============================================================ */}
                {modalVerAbierto && clienteSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">Detalle del Cliente</h2>
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[#F3E1C8] flex items-center justify-center text-3xl">
                                        {clienteSeleccionado.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#2D1B1A]">{clienteSeleccionado.nombre}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            clienteSeleccionado.estado === 'activo' ? 'bg-green-100 text-green-700' :
                                            clienteSeleccionado.estado === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {clienteSeleccionado.estado === 'activo' ? 'Activo' :
                                             clienteSeleccionado.estado === 'vip' ? 'VIP' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Teléfono</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.telefono}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Correo</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Dirección</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.direccion || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Total gastado</p>
                                        <p className="font-semibold text-[#C9A96E]">{formatCurrency(clienteSeleccionado.totalGastado)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Pedidos</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.pedidos}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Última visita</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.ultimaVisita || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400">Fecha de registro</p>
                                        <p className="font-semibold text-[#2D1B1A]">{clienteSeleccionado.fechaRegistro}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end">
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}