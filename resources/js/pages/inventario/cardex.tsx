import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Plus,
    Calendar,
    Eye,
    Edit,
    Trash2,
    Download,
    Printer,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUp,
    ArrowDown,
    Box,
    Coffee,
    Milk,
    Wheat,
    Egg,
    Beef,
    Apple,
    
} from 'lucide-react';

interface Movimiento {
    id: number;
    fecha: string;
    producto: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    stockFinal: number;
    categoria: string;
    proveedor?: string;
    observacion?: string;
}

export default function Cardex() {
    // 📋 Datos de ejemplo
    const [movimientos, setMovimientos] = useState<Movimiento[]>([
        { id: 1, fecha: '26/06/2026', producto: 'Café en grano', tipo: 'entrada', cantidad: 50, stockFinal: 320, categoria: 'Bebidas', proveedor: 'Café Peruano SAC' },
        { id: 2, fecha: '26/06/2026', producto: 'Leche', tipo: 'salida', cantidad: 20, stockFinal: 180, categoria: 'Lácteos', observacion: 'Uso en cocina' },
        { id: 3, fecha: '25/06/2026', producto: 'Azúcar', tipo: 'salida', cantidad: 15, stockFinal: 95, categoria: 'Insumos', observacion: 'Reposteria' },
        { id: 4, fecha: '25/06/2026', producto: 'Harina', tipo: 'entrada', cantidad: 100, stockFinal: 450, categoria: 'Panadería', proveedor: 'Molino del Sur' },
        { id: 5, fecha: '24/06/2026', producto: 'Mantequilla', tipo: 'salida', cantidad: 10, stockFinal: 60, categoria: 'Lácteos', observacion: 'Uso en cocina' },
        { id: 6, fecha: '24/06/2026', producto: 'Chocolate', tipo: 'entrada', cantidad: 30, stockFinal: 120, categoria: 'Insumos', proveedor: 'Chocolates Andinos' },
        { id: 7, fecha: '23/06/2026', producto: 'Pan', tipo: 'salida', cantidad: 40, stockFinal: 80, categoria: 'Panadería' },
        { id: 8, fecha: '23/06/2026', producto: 'Café molido', tipo: 'entrada', cantidad: 25, stockFinal: 75, categoria: 'Bebidas', proveedor: 'Café Peruano SAC' },
    ]);

    // 📋 Estado de filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // 📊 Estadísticas
    const estadisticas = {
        stockTotal: movimientos.reduce((sum, m) => m.tipo === 'entrada' ? sum + m.cantidad : sum, 0),
        entradas: movimientos.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.cantidad, 0),
        salidas: movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0),
        productos: new Set(movimientos.map(m => m.producto)).size,
    };

    // 📊 Movimientos filtrados
    const movimientosFiltrados = movimientos.filter(m => {
        const busquedaOk = !busqueda || 
            m.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
            m.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
            (m.proveedor && m.proveedor.toLowerCase().includes(busqueda.toLowerCase()));
        const tipoOk = !filtroTipo || m.tipo === filtroTipo;
        const categoriaOk = !filtroCategoria || m.categoria === filtroCategoria;
        return busquedaOk && tipoOk && categoriaOk;
    });

    // 🎨 Configuración de tipos
    const getTipoConfig = (tipo: string) => {
        if (tipo === 'entrada') {
            return { bg: 'bg-green-100', text: 'text-green-700', label: 'Entrada', icon: ArrowUp };
        }
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Salida', icon: ArrowDown };
    };

    // 📊 Categorías únicas
    const categorias = [...new Set(movimientos.map(m => m.categoria))];

    // 📊 Formatear números
    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-PE');
    };

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
                        <button className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold">
                            <Plus className="w-4 h-4" />
                            Nuevo movimiento
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* ===== ESTADÍSTICAS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Stock total</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatNumber(estadisticas.stockTotal)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Entradas</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{formatNumber(estadisticas.entradas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Salidas</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{formatNumber(estadisticas.salidas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Productos</p>
                                <p className="text-3xl font-bold mt-1">{formatNumber(estadisticas.productos)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <Box className="w-6 h-6 text-[#C9A96E]" />
                            </div>
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
                                placeholder="Buscar producto..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                        </select>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            placeholder="Desde"
                        />
                        <input
                            type="date"
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            placeholder="Hasta"
                        />
                    </div>
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setFiltroTipo('');
                                setFiltroCategoria('');
                                setFechaInicio('');
                                setFechaFin('');
                            }}
                            className="text-sm text-[#5A3D2B] hover:text-[#2D1B1A] font-medium transition"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== TABLA DE MOVIMIENTOS ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Movimientos de inventario</h2>
                        <div className="flex items-center gap-2 text-sm text-[#5A3D2B]">
                            <span>{movimientosFiltrados.length} registros</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Stock final</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Proveedor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-400 py-10">No hay movimientos</td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((mov) => {
                                        const tipoConfig = getTipoConfig(mov.tipo);
                                        const TipoIcon = tipoConfig.icon;
                                        return (
                                            <tr key={mov.id} className="hover:bg-[#FBF3E7] transition">
                                                <td className="px-4 py-3 text-[#5A3D2B]">{mov.fecha}</td>
                                                <td className="px-4 py-3 font-medium text-[#2D1B1A]">{mov.producto}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3E1C8] text-[#5A3D2B]">
                                                        {mov.categoria}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text} flex items-center gap-1 w-fit`}>
                                                        <TipoIcon className="w-3 h-3" />
                                                        {tipoConfig.label}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {mov.tipo === 'entrada' ? '+' : '-'} {mov.cantidad}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[#2D1B1A]">{mov.stockFinal}</td>
                                                <td className="px-4 py-3 text-[#5A3D2B]">{mov.proveedor || '-'}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== PRODUCTOS CON STOCK BAJO ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-[#2D1B1A]">Stock bajo</h3>
                        </div>
                        <div className="space-y-2">
                            {movimientos
                                .filter(m => m.stockFinal < 30)
                                .slice(0, 5)
                                .map((m) => (
                                    <div key={m.id} className="flex justify-between items-center border-b border-[#F3E1C8] pb-2">
                                        <span className="text-sm text-[#2D1B1A]">{m.producto}</span>
                                        <span className="text-sm font-bold text-red-600">{m.stockFinal} uds.</span>
                                    </div>
                                ))}
                            {movimientos.filter(m => m.stockFinal < 30).length === 0 && (
                                <p className="text-sm text-gray-400">No hay productos con stock bajo</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="font-bold text-[#2D1B1A]">Últimas entradas</h3>
                        </div>
                        <div className="space-y-2">
                            {movimientos
                                .filter(m => m.tipo === 'entrada')
                                .slice(0, 5)
                                .map((m) => (
                                    <div key={m.id} className="flex justify-between items-center border-b border-[#F3E1C8] pb-2">
                                        <span className="text-sm text-[#2D1B1A]">{m.producto}</span>
                                        <span className="text-sm font-bold text-green-600">+{m.cantidad} uds.</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}