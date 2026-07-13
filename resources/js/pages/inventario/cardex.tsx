import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Package,
    Plus,
    Search,
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Building2,
    User,
    X,
    Check,
    Printer,
    FileSpreadsheet,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface Movimiento {
    id: number;
    fecha: string;
    producto: string;
    categoria: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    stockFinal: number;
    proveedor: string;
    responsable: string;
}

interface ProductoCardex {
    id: number;
    nombre: string;
    categoria: string;
    stockActual: number;
}

export default function Cardex() {
    // 📊 Datos de ejemplo
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);

    const [productos] = useState<ProductoCardex[]>([
        { id: 1, nombre: 'Café Americano', categoria: 'Bebidas', stockActual: 50 },
        { id: 2, nombre: 'Café Latte', categoria: 'Bebidas', stockActual: 30 },
        { id: 3, nombre: 'Cheesecake', categoria: 'Postres', stockActual: 15 },
        { id: 4, nombre: 'Croissant', categoria: 'Panadería', stockActual: 25 },
        { id: 5, nombre: 'Sándwich de Pollo', categoria: 'Salados', stockActual: 18 },
        { id: 6, nombre: 'Jugo Natural', categoria: 'Bebidas', stockActual: 22 },
        { id: 7, nombre: 'Matcha Latte', categoria: 'Bebidas', stockActual: 28 },
        { id: 8, nombre: 'Cappuccino', categoria: 'Bebidas', stockActual: 35 },
    ]);

    const [nuevoMovimiento, setNuevoMovimiento] = useState({
        producto: '',
        tipo: 'entrada',
        cantidad: 0,
        proveedor: '',
        responsable: '',
        observaciones: '',
    });

    // 📊 Estadísticas
    const totalStock = productos.reduce((sum, p) => sum + p.stockActual, 0);
    const totalEntradas = movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.cantidad, 0);
    const totalSalidas = movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0);
    const totalProductos = productos.length;

    // 🔍 Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const formatNumber = (num: number): string => num.toLocaleString('es-PE');

    const movimientosFiltrados = movimientos.filter(m => {
        const busquedaOk = !busqueda ||
            m.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
            m.proveedor.toLowerCase().includes(busqueda.toLowerCase());
        const tipoOk = !filtroTipo || m.tipo === filtroTipo;
        return busquedaOk && tipoOk;
    });

    return (
        <>
            <Head title="Cardex - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">📦 Cardex</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Control de inventario y movimientos de productos</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setModalAbierto(true)}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo movimiento
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* ===== TARJETAS DE RESUMEN ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Stock total</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatNumber(totalStock)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Warehouse className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Unidades en inventario</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Entradas</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{formatNumber(totalEntradas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Unidades ingresadas</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Salidas</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{formatNumber(totalSalidas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Unidades consumidas</span>
                        </div>
                    </div>

                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Productos</p>
                                <p className="text-3xl font-bold mt-1">{totalProductos}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <Package className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-white/40">En el sistema</span>
                        </div>
                    </div>
                </div>

                {/* ===== FILTROS ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar movimientos..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] placeholder-gray-400 bg-white"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                        </select>
                        <input
                            type="date"
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                        <button
                            onClick={() => { setBusqueda(''); setFiltroTipo(''); setFechaInicio(''); setFechaFin(''); }}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== TABLA DE MOVIMIENTOS ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <div>
                            <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Movimientos de inventario</h2>
                            <p className="text-xs text-[#5A3D2B] mt-1">{movimientosFiltrados.length} registros</p>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF7F0]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Tipo</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Cantidad</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Stock final</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#5A3D2B] uppercase tracking-wider">Proveedor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3E1C8]">
                                {movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-[#8D6B53]">
                                            No hay movimientos registrados
                                        </td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-[#FBF7F0] transition">
                                            <td className="px-4 py-3 text-sm text-[#2D1B1A]">{mov.fecha}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-[#2D1B1A]">{mov.producto}</td>
                                            <td className="px-4 py-3 text-sm text-[#5A3D2B]">{mov.categoria}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    mov.tipo === 'entrada' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {mov.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-center">
                                                <span className={mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                                    {mov.tipo === 'entrada' ? '+' : '-'} {mov.cantidad}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-center text-[#2D1B1A]">{mov.stockFinal}</td>
                                            <td className="px-4 py-3 text-sm text-[#5A3D2B]">{mov.proveedor || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* MODAL: Nuevo Movimiento */}
                {/* ============================================================ */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#C9A96E] rounded-xl flex items-center justify-center shadow-lg">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2D1B1A]">📦 Nuevo Movimiento</h2>
                                        <p className="text-xs text-[#5A3D2B]">Registra una entrada o salida de inventario</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <Package className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Producto
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del producto"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={nuevoMovimiento.producto}
                                        onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, producto: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                            <ArrowUp className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                            Tipo
                                        </label>
                                        <select
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                            value={nuevoMovimiento.tipo}
                                            onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value })}
                                        >
                                            <option value="entrada">📥 Entrada</option>
                                            <option value="salida">📤 Salida</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                            value={nuevoMovimiento.cantidad}
                                            onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, cantidad: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <Building2 className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Proveedor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del proveedor"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={nuevoMovimiento.proveedor}
                                        onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, proveedor: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <User className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Responsable
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del responsable"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={nuevoMovimiento.responsable}
                                        onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, responsable: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setModalAbierto(false);
                                        setNuevoMovimiento({ producto: '', tipo: 'entrada', cantidad: 0, proveedor: '', responsable: '', observaciones: '' });
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    <Check className="w-4 h-4" />
                                    Guardar movimiento
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}