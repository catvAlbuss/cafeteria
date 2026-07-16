import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    AlertTriangle,
    Trash2,
    Plus,
    Search,
    Calendar,
    DollarSign,
    Package,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Printer,
    Save,
    X
} from 'lucide-react';
import { toast } from 'sonner';

interface Plato {
    id: number;
    nombre: string;
    stock: number;
    precio: number;
    categoria: string;
}

interface Merma {
    id: number;
    item_id: number;
    item_type: string;
    cantidad: number;
    stock_resultante: number;
    motivo: string;
    observaciones: string;
    user: { name: string };
    item?: { nombre: string; precio?: number };
    created_at: string;
}

export default function Mermas() {
    const { platos, mermas: mermasData } = usePage().props as any;

    const [mermas, setMermas] = useState<Merma[]>(mermasData || []);
    const [formAbierto, setFormAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);

    // Formulario
    const [items, setItems] = useState<any[]>([]);
    const [observaciones, setObservaciones] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroMotivo, setFiltroMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Estadísticas
    const totalPerdidas = (mermas || []).reduce((sum, m) => sum + (m.cantidad * (m.item?.precio || 0)), 0);
    const totalRegistros = mermas.length;

    const getMotivoConfig = (motivo: string) => {
        const motivos: Record<string, any> = {
            'caducado': { bg: 'bg-red-100', text: 'text-red-700', label: 'Caducado', icon: XCircle },
            'quemado': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Quemado', icon: AlertTriangle },
            'mal_estado': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mal estado', icon: AlertTriangle },
            'sobreproduccion': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sobreproducción', icon: TrendingDown },
            'rotura': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Rotura', icon: AlertTriangle },
        };
        return motivos[motivo] || { bg: 'bg-gray-100', text: 'text-gray-700', label: motivo, icon: AlertTriangle };
    };

    const formatCurrency = (amount: any): string => {
        
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    };

    const agregarProducto = (plato: Plato) => {
        const existente = items.find(i => i.id === plato.id);
        if (existente) {
            if (existente.cantidad + 1 > plato.stock) {
                toast.error(`Stock insuficiente para ${plato.nombre}`);
                return;
            }
            setItems(items.map(i => i.id === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i));
        } else {
            if (plato.stock < 1) {
                toast.error(`Stock insuficiente para ${plato.nombre}`);
                return;
            }
            setItems([...items, {
                id: plato.id,
                nombre: plato.nombre,
                cantidad: 1,
                motivo: 'caducado',
                stock: plato.stock,
                precio: plato.precio
            }]);
        }
    };

    const quitarProducto = (id: number) => {
        setItems(items.filter(i => i.id !== id));
    };

    const actualizarCantidad = (id: number, cantidad: number) => {
        const item = items.find(i => i.id === id);
        if (item && cantidad > item.stock) {
            toast.error('No hay suficiente stock');
            return;
        }
        setItems(items.map(i => i.id === id ? { ...i, cantidad: Math.max(1, cantidad) } : i));
    };

    const guardarMermas = () => {
        if (items.length === 0) {
            toast.warning('Agrega al menos un producto');
            return;
        }

        setCargando(true);

        router.post('/mermas', {
            productos: items.map(i => ({
                id: i.id,
                nombre: i.nombre,
                cantidad: i.cantidad,
                motivo: i.motivo || 'Pérdida registrada'
            })),
            observaciones: observaciones,
        }, {
            onSuccess: () => {
                setItems([]);
                setObservaciones('');
                setFormAbierto(false);
                setCargando(false);
                toast.success('✅ Mermas registradas correctamente');
                router.reload();
            },
            onError: (errors) => {
                setCargando(false);
                toast.error('Error: ' + Object.values(errors).join(' '));
            }
        });
    };

    const eliminarMerma = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        // Aquí iría la llamada al backend para eliminar
        toast.info('Funcionalidad en desarrollo');
    };

    const mermasFiltradas = (mermas || []).filter(m => {
        const busquedaOk = !busqueda ||
            (m.item?.nombre || '').toLowerCase().includes(busqueda.toLowerCase());
        const motivoOk = !filtroMotivo || m.motivo === filtroMotivo;
        return busquedaOk && motivoOk;
    });

    const platosFiltrados = (platos || []).filter((p: Plato) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <>
            <Head title="Mermas - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-[#FBF3E7]">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A] flex items-center gap-3">
                            <span className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-xl text-white">🗑️</span>
                            Mermas
                        </h1>
                        <p className="text-[#5A3D2B] text-sm mt-1 ml-1">Control de pérdidas y desperdicios</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFormAbierto(!formAbierto)}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold hover:shadow-lg active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva merma
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm hover:shadow-lg active:scale-95">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* FORMULARIO */}
                {formAbierto && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-[#2D1B1A] flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Registrar merma
                            </h2>
                            <button onClick={() => setFormAbierto(false)} className="text-gray-400 hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Productos disponibles */}
                            <div className="lg:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Productos</label>
                                <div className="mt-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar producto..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1B1A] placeholder-[#8D6B53] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                                    {platosFiltrados.map((plato: Plato) => (
                                        <button
                                            key={plato.id}
                                            onClick={() => agregarProducto(plato)}
                                            className="p-3 text-left rounded-xl border border-[#E8D5C4] hover:border-[#C9A96E] hover:bg-[#FBF7F0] transition group"
                                            disabled={plato.stock <= 0}
                                        >
                                            <p className="text-sm font-medium text-[#2D1B1A]">{plato.nombre}</p>
                                            <p className="text-xs text-gray-400">Stock: {plato.stock}</p>
                                            <p className="text-xs text-[#C9A96E] font-semibold">{formatCurrency(plato.precio)}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Items seleccionados */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium">Productos a mermar</label>
                                <div className="mt-1 border border-[#E8D5C4] rounded-xl p-3 min-h-[150px] max-h-[250px] overflow-y-auto">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No hay productos agregados</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-2 bg-[#FBF7F0] rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button
                                                                onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold"
                                                            >-</button>
                                                            <span className="text-sm font-bold w-6 text-center">{item.cantidad}</span>
                                                            <button
                                                                onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                                                className="w-6 h-6 rounded-full bg-[#C9A96E]/20 hover:bg-[#C9A96E]/30 text-[#C9A96E] flex items-center justify-center text-sm font-bold"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => quitarProducto(item.id)}
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <label className="text-xs text-gray-500 font-medium">Observaciones</label>
                                    <textarea
                                        className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition resize-none"
                                        rows={2}
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        placeholder="Notas adicionales..."
                                    />
                                </div>
                                <button
                                    onClick={guardarMermas}
                                    disabled={cargando || items.length === 0}
                                    className={`mt-3 w-full py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${cargando || items.length === 0
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                        : 'bg-[#C9A96E] hover:bg-[#B8975D] text-white hover:shadow-lg active:scale-95'
                                        }`}
                                >
                                    {cargando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Registrar Mermas
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Pérdidas totales</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalPerdidas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Registros</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{totalRegistros}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Última merma</p>
                                <p className="text-lg font-bold text-blue-600 mt-1 truncate">
                                    {mermas.length > 0 ? mermas[0]?.item?.nombre || '-' : '-'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Promedio por registro</p>
                                <p className="text-3xl font-bold mt-1">
                                    {totalRegistros > 0 ? formatCurrency(totalPerdidas / totalRegistros) : 'S/ 0.00'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1B1A] placeholder-[#8D6B53] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
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
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition
                            [&::-webkit-calendar-picker-indicator]:!opacity-100
                            [&::-webkit-calendar-picker-indicator]:!cursor-pointer
                            [&::-webkit-calendar-picker-indicator]:!bg-gray-400
                            [&::-webkit-calendar-picker-indicator]:!rounded-md
                            [&::-webkit-calendar-picker-indicator]:!p-0.5
                            [&::-webkit-calendar-picker-indicator]:!w-5
                            [&::-webkit-calendar-picker-indicator]:!h-5
                            [&::-webkit-calendar-picker-indicator]:hover:!bg-gray-500"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition
                            [&::-webkit-calendar-picker-indicator]:!opacity-100
                            [&::-webkit-calendar-picker-indicator]:!cursor-pointer
                            [&::-webkit-calendar-picker-indicator]:!bg-gray-400
                            [&::-webkit-calendar-picker-indicator]:!rounded-md
                            [&::-webkit-calendar-picker-indicator]:!p-0.5
                            [&::-webkit-calendar-picker-indicator]:!w-5
                            [&::-webkit-calendar-picker-indicator]:!h-5
                            [&::-webkit-calendar-picker-indicator]:hover:!bg-gray-500"
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
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2.5 hover:shadow-md active:scale-95"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                            <Package className="w-5 h-5 text-red-500" />
                            Registro de mermas
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#5A3D2B]">Total pérdidas:</span>
                            <span className="font-bold text-red-600">{formatCurrency(totalPerdidas)}</span>
                            <span className="text-[#5A3D2B]">| {mermasFiltradas.length} registros</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF7F0] border-b-2 border-[#F3E1C8]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Motivo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Costo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Responsable</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FBF3E7]">
                                {mermasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-400 py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="w-10 h-10 text-gray-300" />
                                                <span>No hay mermas registradas</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    mermasFiltradas.map((m) => {
                                        const motivoConfig = getMotivoConfig(m.motivo);
                                        const MotivoIcon = motivoConfig.icon;
                                        return (
                                            <tr key={m.id} className="hover:bg-[#FBF7F0] transition group">
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B]">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-[#2D1B1A]">{m.item?.nombre || '-'}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600">{m.cantidad}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${motivoConfig.bg} ${motivoConfig.text}`}>
                                                        <MotivoIcon className="w-3 h-3" />
                                                        {motivoConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600">
                                                    {formatCurrency(m.cantidad * (m.item?.precio || 0))}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B]">{m.user?.name || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => eliminarMerma(m.id)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto"
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
            </div>
        </>
    );
}