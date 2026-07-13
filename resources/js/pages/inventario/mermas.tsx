import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangle,
    Trash2,
    Plus,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Package,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    Edit,
    Eye,
    Download,
    Printer,
    Coffee,
    Milk,
    Egg,
    Beef,
    Apple,
    Wheat,


} from 'lucide-react';

interface Merma {
    id: number;
    fecha: string;
    producto: string;
    cantidad: number;
    unidad: string;
    motivo: 'caducado' | 'quemado' | 'mal_estado' | 'sobreproduccion' | 'rotura';
    costo: number;
    categoria: string;
    observacion?: string;
}

export default function Mermas() {
    // 📋 Datos de ejemplo
    const [mermas, setMermas] = useState<Merma[]>([
        { id: 1, fecha: '26/06/2026', producto: 'Café en grano', cantidad: 2, unidad: 'kg', motivo: 'quemado', costo: 120, categoria: 'Bebidas' },
        { id: 2, fecha: '25/06/2026', producto: 'Leche', cantidad: 5, unidad: 'L', motivo: 'caducado', costo: 45, categoria: 'Lácteos' },
        { id: 3, fecha: '24/06/2026', producto: 'Brownies', cantidad: 8, unidad: 'unid', motivo: 'sobreproduccion', costo: 64, categoria: 'Postres' },
        { id: 4, fecha: '23/06/2026', producto: 'Pan', cantidad: 12, unidad: 'unid', motivo: 'mal_estado', costo: 36, categoria: 'Panadería' },
        { id: 5, fecha: '22/06/2026', producto: 'Mantequilla', cantidad: 3, unidad: 'kg', motivo: 'caducado', costo: 90, categoria: 'Lácteos' },
        { id: 6, fecha: '21/06/2026', producto: 'Chocolate', cantidad: 5, unidad: 'kg', motivo: 'quemado', costo: 75, categoria: 'Insumos' },
    ]);

    // 📋 Estado del formulario
    const [formAbierto, setFormAbierto] = useState(false);
    const [nuevaMerma, setNuevaMerma] = useState({
        producto: '',
        cantidad: 0,
        unidad: 'unid',
        motivo: 'caducado',
        costo: 0,
        observacion: '',
    });

    // 📋 Estado de filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroMotivo, setFiltroMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // 📊 Estadísticas
    const estadisticas = {
        perdidasHoy: mermas
            .filter(m => m.fecha === new Date().toLocaleDateString('es-PE'))
            .reduce((sum, m) => sum + m.costo, 0),
        totalRegistros: mermas.length,
        productoCritico: mermas.reduce((a, b) => a.costo > b.costo ? a : b).producto,
        impactoMensual: 3.2,
    };

    // 📊 Mermas filtradas
    const mermasFiltradas = mermas.filter(m => {
        const busquedaOk = !busqueda ||
            m.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
            m.categoria.toLowerCase().includes(busqueda.toLowerCase());
        const motivoOk = !filtroMotivo || m.motivo === filtroMotivo;
        return busquedaOk && motivoOk;
    });

    // 📊 Totales
    const totalPerdidas = mermas.reduce((sum, m) => sum + m.costo, 0);

    // 🎨 Configuración de motivos
    const getMotivoConfig = (motivo: string) => {
        switch (motivo) {
            case 'caducado': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Caducado', icon: XCircle };
            case 'quemado': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Quemado', icon: AlertTriangle };
            case 'mal_estado': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mal estado', icon: AlertTriangle };
            case 'sobreproduccion': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sobreproducción', icon: TrendingDown };
            case 'rotura': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Rotura', icon: AlertTriangle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Otro', icon: AlertTriangle };
        }
    };

    // 📊 Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // 📋 Guardar merma
    const guardarMerma = () => {
        if (!nuevaMerma.producto || nuevaMerma.cantidad <= 0 || nuevaMerma.costo <= 0) {
            alert('Complete todos los campos correctamente.');
            return;
        }

        const nueva: Merma = {
            id: Date.now(),
            fecha: new Date().toLocaleDateString('es-PE'),
            producto: nuevaMerma.producto,
            cantidad: nuevaMerma.cantidad,
            unidad: nuevaMerma.unidad,
            motivo: nuevaMerma.motivo as any,
            costo: nuevaMerma.costo,
            categoria: 'General',
            observacion: nuevaMerma.observacion,
        };

        setMermas([nueva, ...mermas]);
        setNuevaMerma({ producto: '', cantidad: 0, unidad: 'unid', motivo: 'caducado', costo: 0, observacion: '' });
        setFormAbierto(false);
    };

    // 📋 Eliminar merma
    const eliminarMerma = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        setMermas(mermas.filter(m => m.id !== id));
    };

    return (
        <>
            <Head title="Mermas - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">🗑️ Mermas</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Control de pérdidas y desperdicios</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFormAbierto(!formAbierto)}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva merma
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* ===== FORMULARIO ===== */}
                {formAbierto && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-lg font-bold text-[#2D1B1A] mb-4">📝 Registrar merma</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <input
                                type="text"
                                placeholder="Producto"
                                className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={nuevaMerma.producto}
                                onChange={(e) => setNuevaMerma({ ...nuevaMerma, producto: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Cantidad"
                                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                    value={nuevaMerma.cantidad || ''}
                                    onChange={(e) => setNuevaMerma({ ...nuevaMerma, cantidad: parseFloat(e.target.value) || 0 })}
                                />
                                <select
                                    className="w-20 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                    value={nuevaMerma.unidad}
                                    onChange={(e) => setNuevaMerma({ ...nuevaMerma, unidad: e.target.value })}
                                >
                                    <option value="unid">unid</option>
                                    <option value="kg">kg</option>
                                    <option value="L">L</option>
                                    <option value="g">g</option>
                                </select>
                            </div>
                            <select
                                className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={nuevaMerma.motivo}
                                onChange={(e) => setNuevaMerma({ ...nuevaMerma, motivo: e.target.value })}
                            >
                                <option value="caducado">Caducado</option>
                                <option value="quemado">Quemado</option>
                                <option value="mal_estado">Mal estado</option>
                                <option value="sobreproduccion">Sobreproducción</option>
                                <option value="rotura">Rotura</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Costo S/"
                                className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={nuevaMerma.costo || ''}
                                onChange={(e) => setNuevaMerma({ ...nuevaMerma, costo: parseFloat(e.target.value) || 0 })}
                            />
                            <button
                                onClick={guardarMerma}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition text-sm"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== ESTADÍSTICAS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Pérdidas hoy</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(estadisticas.perdidasHoy)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Registros</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{estadisticas.totalRegistros}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Producto crítico</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1 truncate">{estadisticas.productoCritico}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Impacto mensual</p>
                                <p className="text-3xl font-bold mt-1">{estadisticas.impactoMensual}%</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-[#C9A96E]" />
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] placeholder-gray-400 bg-white"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
                            value={filtroMotivo}
                            onChange={(e) => setFiltroMotivo(e.target.value)}
                        >
                            <option value="">Todos los motivos</option>
                            <option value="caducado">Caducado</option>
                            <option value="quemado">Quemado</option>
                            <option value="mal_estado">Mal estado</option>
                            <option value="sobreproduccion">Sobreproducción</option>
                            <option value="rotura">Rotura</option>
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
                            onClick={() => {
                                setBusqueda('');
                                setFiltroMotivo('');
                                setFechaInicio('');
                                setFechaFin('');
                            }}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== TABLA ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Registro de mermas</h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#5A3D2B]">Total pérdidas:</span>
                            <span className="font-bold text-red-600">{formatCurrency(totalPerdidas)}</span>
                            <span className="text-[#5A3D2B]">| {mermasFiltradas.length} registros</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Motivo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Costo</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {mermasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-10">No hay registros</td>
                                    </tr>
                                ) : (
                                    mermasFiltradas.map((m) => {
                                        const motivoConfig = getMotivoConfig(m.motivo);
                                        const MotivoIcon = motivoConfig.icon;
                                        return (
                                            <tr key={m.id} className="hover:bg-[#FBF3E7] transition">
                                                <td className="px-4 py-3 text-[#5A3D2B]">{m.fecha}</td>
                                                <td className="px-4 py-3 font-medium text-[#2D1B1A]">{m.producto}</td>
                                                <td className="px-4 py-3 text-[#5A3D2B]">{m.cantidad} {m.unidad}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${motivoConfig.bg} ${motivoConfig.text} flex items-center gap-1 w-fit`}>
                                                        <MotivoIcon className="w-3 h-3" />
                                                        {motivoConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(m.costo)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => eliminarMerma(m.id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== RESUMEN POR MOTIVO ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <h3 className="font-bold text-[#2D1B1A] mb-4">📊 Mermas por motivo</h3>
                        <div className="space-y-2">
                            {['caducado', 'quemado', 'mal_estado', 'sobreproduccion', 'rotura'].map((motivo) => {
                                const total = mermas.filter(m => m.motivo === motivo).reduce((sum, m) => sum + m.costo, 0);
                                const config = getMotivoConfig(motivo);
                                const max = mermas.reduce((sum, m) => sum + m.costo, 0) || 1;
                                const porcentaje = (total / max) * 100;
                                return (
                                    <div key={motivo}>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#5A3D2B]">{config.label}</span>
                                            <span className="font-medium text-[#2D1B1A]">{formatCurrency(total)}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                                            <div className={`h-1.5 rounded-full ${config.bg}`} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <h3 className="font-bold text-[#2D1B1A] mb-4">⚠️ Productos con más mermas</h3>
                        <div className="space-y-2">
                            {mermas
                                .reduce((acc, m) => {
                                    const existente = acc.find(p => p.producto === m.producto);
                                    if (existente) {
                                        existente.total += m.costo;
                                    } else {
                                        acc.push({ producto: m.producto, total: m.costo });
                                    }
                                    return acc;
                                }, [] as { producto: string, total: number }[])
                                .sort((a, b) => b.total - a.total)
                                .slice(0, 5)
                                .map((item, index) => (
                                    <div key={index} className="flex justify-between items-center border-b border-[#F3E1C8] pb-2 last:border-0">
                                        <span className="text-sm text-[#2D1B1A]">{item.producto}</span>
                                        <span className="text-sm font-bold text-red-600">{formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            {mermas.length === 0 && (
                                <p className="text-sm text-gray-400">No hay datos</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}