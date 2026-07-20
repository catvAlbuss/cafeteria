import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    Trash2,
    Plus,
    Search,
    DollarSign,
    Package,
    TrendingDown,
    Clock,
    XCircle,
    Download,
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

interface Insumo {
    id: number;
    nombre: string;
    stock: number;
    precio: number;
    unidad: string;
    categoria: string;
}

interface Merma {
    id: number;
    item_id: number;
    item_type: string;
    cantidad: number;
    stock_resultante: number;
    motivo: string;
    submotivo: string;
    observaciones: string | null;
    user: { name: string };
    item?: { nombre: string; precio?: number };
    created_at: string;
}

interface PaginatedMermas {
    data: Merma[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Stats {
    total_perdidas: number;
    total_registros: number;
    promedio: number;
    ultima_merma: string | null;
}

interface ItemFormulario {
    id: number;
    tipo: 'producto' | 'insumo';
    nombre: string;
    cantidad: number;
    motivo: string;
    detalle?: string;
    stock: number;
    precio: number;
    unidad?: string;
}

const MOTIVOS_PRODUCTO = [
    { value: 'quemado', label: '🔥 Quemado / mal preparado' },
    { value: 'sobreproduccion', label: '📈 Sobreproducción' },
    { value: 'devolucion', label: '🔄 Devolución de cliente' },
    { value: 'caducado', label: '📅 Caducado en vitrina' },
    { value: 'otro', label: '📝 Otro' },
];

const MOTIVOS_INSUMO = [
    { value: 'caducado', label: '📅 Vencido / caducado' },
    { value: 'rotura', label: '💔 Derrame o rotura' },
    { value: 'refrigeracion', label: '❄️ Falla de refrigeración' },
    { value: 'mala_preparacion', label: '👨‍🍳 Merma de preparación' },
    { value: 'otro', label: '📝 Otro' },
];

const getMotivoConfig = (submotivo: string) => {
    const motivos: Record<string, any> = {
        'caducado': { bg: 'bg-red-100', text: 'text-red-700', label: 'Caducado', icon: XCircle },
        'quemado': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Quemado', icon: AlertTriangle },
        'sobreproduccion': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sobreproducción', icon: TrendingDown },
        'devolucion': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Devolución', icon: XCircle },
        'rotura': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Rotura/Derrame', icon: AlertTriangle },
        'refrigeracion': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Falla refrigeración', icon: AlertTriangle },
        'mala_preparacion': { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Merma de prep.', icon: AlertTriangle },
        'otro': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Otro', icon: AlertTriangle },
    };
    return motivos[submotivo] || { bg: 'bg-gray-100', text: 'text-gray-700', label: submotivo || 'Sin especificar', icon: AlertTriangle };
};

export default function Mermas() {
    const {
        platos = [],
        insumos = [],
        mermas,
        stats,
        filtros: filtrosIniciales = {},
    } = usePage().props as unknown as {
        platos: Plato[];
        insumos: Insumo[];
        mermas: PaginatedMermas;
        stats: Stats;
        filtros: Record<string, string>;
    };

    const [formAbierto, setFormAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);

    const [tipoMerma, setTipoMerma] = useState<'producto' | 'insumo'>('producto');
    const [items, setItems] = useState<ItemFormulario[]>([]);
    const [busquedaItem, setBusquedaItem] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // ===== FILTROS (sincronizados con el backend) =====
    const [filtros, setFiltros] = useState({
        busqueda: filtrosIniciales.busqueda || '',
        motivo: filtrosIniciales.motivo || '',
        fecha_inicio: filtrosIniciales.fecha_inicio || '',
        fecha_fin: filtrosIniciales.fecha_fin || '',
    });

    const [mermaAEliminar, setMermaAEliminar] = useState<Merma | null>(null);

    const primerRender = useRef(true);

    useEffect(() => {
        if (primerRender.current) {
            primerRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get('/mermas', {
                busqueda: filtros.busqueda || undefined,
                motivo: filtros.motivo || undefined,
                fecha_inicio: filtros.fecha_inicio || undefined,
                fecha_fin: filtros.fecha_fin || undefined,
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros.busqueda, filtros.motivo, filtros.fecha_inicio, filtros.fecha_fin]);

    const formatCurrency = (amount: any): string => {
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('es-PE');
        } catch {
            return dateString;
        }
    };

    const itemsDisponibles: (Plato | Insumo)[] = tipoMerma === 'producto' ? platos : insumos;
    const itemsFiltrados = itemsDisponibles.filter((i) =>
        i.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) && i.stock > 0
    );

    const agregarItem = (item: Plato | Insumo) => {
        const yaExiste = items.find(i => i.id === item.id && i.tipo === tipoMerma);
        if (yaExiste) {
            toast.info(`${item.nombre} ya está en la lista, ajusta la cantidad ahí`);
            return;
        }
        setItems(prev => [...prev, {
            id: item.id,
            tipo: tipoMerma,
            nombre: item.nombre,
            cantidad: tipoMerma === 'insumo' ? 0.1 : 1,
            motivo: '',
            detalle: '',
            stock: item.stock,
            precio: Number(item.precio) || 0,
            unidad: (item as Insumo).unidad,
        }]);
    };

    const quitarItem = (id: number, tipo: string) => {
        setItems(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));
    };

    const actualizarItem = (id: number, tipo: string, campo: 'cantidad' | 'motivo' | 'detalle', valor: string | number) => {
        setItems(prev => prev.map(i => {
            if (i.id !== id || i.tipo !== tipo) return i;
            if (campo === 'cantidad') {
                const cant = Number(valor);
                if (cant > i.stock) {
                    toast.error(`Stock insuficiente para ${i.nombre} (disponible: ${i.stock})`);
                    return i;
                }
                return { ...i, cantidad: cant };
            }
            if (campo === 'detalle') {
                return { ...i, detalle: String(valor) };
            }
            return { ...i, motivo: String(valor) };
        }));
    };

    const resetFormulario = () => {
        setItems([]);
        setObservaciones('');
        setBusquedaItem('');
        setTipoMerma('producto');
    };

    const guardarMermas = () => {
        if (items.length === 0) {
            toast.warning('Agrega al menos un producto o insumo');
            return;
        }
        const sinMotivo = items.find(i => !i.motivo);
        if (sinMotivo) {
            toast.warning(`Selecciona el motivo para "${sinMotivo.nombre}"`);
            return;
        }
        const sinCantidad = items.find(i => !i.cantidad || i.cantidad <= 0);
        if (sinCantidad) {
            toast.warning(`Ingresa una cantidad válida para "${sinCantidad.nombre}"`);
            return;
        }

        setCargando(true);

        router.post('/mermas', {
            items: items.map(i => ({
                id: i.id,
                tipo: i.tipo,
                nombre: i.nombre,
                cantidad: i.cantidad,
                motivo: i.motivo,
                detalle: i.motivo === 'otro' ? (i.detalle || null) : null,
            })),
            observaciones: observaciones || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCargando(false);
                resetFormulario();
                setFormAbierto(false);
                toast.success('✅ Mermas registradas correctamente');
            },
            onError: (errors) => {
                setCargando(false);
                toast.error('Error: ' + Object.values(errors).join(' '));
            },
        } as Parameters<typeof router.post>[2]);
    };

    const confirmarEliminarMerma = () => {
        if (!mermaAEliminar) return;
        router.delete(`/mermas/${mermaAEliminar.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('✅ Merma eliminada y stock restaurado');
                setMermaAEliminar(null);
            },
            onError: (errors) => {
                toast.error('Error: ' + Object.values(errors).join(' '));
                setMermaAEliminar(null);
            },
        } as Parameters<typeof router.delete>[1]);
    };

    const exportarExcel = () => {
        const params = new URLSearchParams();
        if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros.motivo) params.set('motivo', filtros.motivo);
        if (filtros.fecha_inicio) params.set('fecha_inicio', filtros.fecha_inicio);
        if (filtros.fecha_fin) params.set('fecha_fin', filtros.fecha_fin);
        window.open(`/mermas/export?${params.toString()}`, '_blank');
    };

    const irAPagina = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

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
                        <p className="text-[#5A3D2B] text-sm mt-1 ml-1">Control de pérdidas: productos terminados e insumos</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFormAbierto(!formAbierto)}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva merma
                        </button>
                        <button
                            onClick={exportarExcel}
                            className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* ===== FORMULARIO ===== */}
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

                        <div className="mb-4">
                            <label className="text-xs text-gray-500 font-medium block mb-1.5">¿Qué se perdió?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setTipoMerma('producto'); setBusquedaItem(''); }}
                                    className={`py-3 rounded-xl font-semibold text-sm transition border-2 ${tipoMerma === 'producto'
                                        ? 'bg-[#C9A96E] border-[#C9A96E] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#C9A96E]/50'
                                        }`}
                                >
                                    🍽️ Producto (plato ya hecho)
                                </button>
                                <button
                                    onClick={() => { setTipoMerma('insumo'); setBusquedaItem(''); }}
                                    className={`py-3 rounded-xl font-semibold text-sm transition border-2 ${tipoMerma === 'insumo'
                                        ? 'bg-[#C9A96E] border-[#C9A96E] text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#C9A96E]/50'
                                        }`}
                                >
                                    🥛 Insumo (materia prima)
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 font-medium">
                                    Buscar {tipoMerma === 'producto' ? 'producto' : 'insumo'} y agregar
                                </label>
                                <div className="mt-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={`Buscar ${tipoMerma === 'producto' ? 'producto' : 'insumo'}...`}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition"
                                        value={busquedaItem}
                                        onChange={(e) => setBusquedaItem(e.target.value)}
                                    />
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
                                    {itemsFiltrados.length === 0 ? (
                                        <p className="col-span-2 text-center text-sm text-gray-400 py-6">
                                            {busquedaItem ? 'Sin resultados' : `No hay ${tipoMerma === 'producto' ? 'productos' : 'insumos'} con stock`}
                                        </p>
                                    ) : (
                                        itemsFiltrados.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => agregarItem(item)}
                                                className="p-3 text-left rounded-xl border border-[#E8D5C4] hover:border-[#C9A96E] hover:bg-[#FBF7F0] transition"
                                            >
                                                <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>
                                                <p className="text-xs text-gray-400">
                                                    Stock: {item.stock}{(item as Insumo).unidad ? ` ${(item as Insumo).unidad}` : ''}
                                                </p>
                                                <p className="text-xs text-[#C9A96E] font-semibold">{formatCurrency(item.precio)}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-medium">Productos a mermar ({items.length})</label>
                                <div className="mt-1 border border-[#E8D5C4] rounded-xl p-3 min-h-[150px] max-h-[300px] overflow-y-auto space-y-3">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No hay productos agregados</p>
                                    ) : (
                                        items.map((item) => (
                                            <div key={`${item.tipo}-${item.id}`} className="p-3 bg-[#FBF7F0] rounded-lg space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-[#2D1B1A]">{item.nombre}</p>
                                                    <button onClick={() => quitarItem(item.id, item.tipo)} className="text-red-400 hover:text-red-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] text-gray-500 w-16">Cantidad</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={item.stock}
                                                        step={item.tipo === 'insumo' ? 0.1 : 1}
                                                        value={item.cantidad}
                                                        onChange={(e) => actualizarItem(item.id, item.tipo, 'cantidad', e.target.value)}
                                                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-[#2D1B1A] outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                                    />
                                                    {item.unidad && <span className="text-xs text-gray-400">{item.unidad}</span>}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] text-gray-500 w-16">Motivo</label>
                                                    <select
                                                        value={item.motivo}
                                                        onChange={(e) => actualizarItem(item.id, item.tipo, 'motivo', e.target.value)}
                                                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-[#2D1B1A] outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {(item.tipo === 'producto' ? MOTIVOS_PRODUCTO : MOTIVOS_INSUMO).map(m => (
                                                            <option key={m.value} value={m.value}>{m.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {item.motivo === 'otro' && (
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[10px] text-gray-500 w-16">Detalle</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Especifica el motivo..."
                                                            value={item.detalle || ''}
                                                            onChange={(e) => actualizarItem(item.id, item.tipo, 'detalle', e.target.value)}
                                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-[#2D1B1A] outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-3">
                                    <label className="text-xs text-gray-500 font-medium">Observaciones generales (opcional)</label>
                                    <textarea
                                        className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition resize-none"
                                        rows={2}
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        placeholder="Ej: se cayó el bidón en el almacén, contexto adicional..."
                                    />
                                </div>

                                <button
                                    onClick={guardarMermas}
                                    disabled={cargando || items.length === 0}
                                    className={`mt-3 w-full py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${cargando || items.length === 0
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
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

                {/* ESTADÍSTICAS (vienen del backend, sobre TODOS los registros filtrados) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Pérdidas totales</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(stats.total_perdidas)}</p>
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
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{stats.total_registros}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Última merma</p>
                                <p className="text-lg font-bold text-blue-600 mt-1 truncate">
                                    {stats.ultima_merma || '-'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Promedio por registro</p>
                                <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatCurrency(stats.promedio)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
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
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition"
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                            />
                        </div>
                        <select
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition"
                            value={filtros.motivo}
                            onChange={(e) => setFiltros({ ...filtros, motivo: e.target.value })}
                        >
                            <option value="">Todos los motivos</option>
                            {[...MOTIVOS_PRODUCTO, ...MOTIVOS_INSUMO]
                                .filter((m, i, arr) => arr.findIndex(x => x.value === m.value) === i)
                                .map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <input
                            type="date"
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition"
                            value={filtros.fecha_inicio}
                            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                        />
                        <input
                            type="date"
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] outline-none bg-white transition"
                            value={filtros.fecha_fin}
                            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                        />
                        <button
                            onClick={() => setFiltros({ busqueda: '', motivo: '', fecha_inicio: '', fecha_fin: '' })}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2.5"
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
                            <span className="font-bold text-red-600">{formatCurrency(stats.total_perdidas)}</span>
                            <span className="text-[#5A3D2B]">| {stats.total_registros} registros</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF7F0] border-b-2 border-[#F3E1C8]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Cantidad</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Motivo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Costo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Responsable</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase">Obs.</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#5A3D2B] uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FBF3E7]">
                                {mermas.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-gray-400 py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="w-10 h-10 text-gray-300" />
                                                <span>No hay mermas registradas</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    mermas.data.map((m) => {
                                        const motivoConfig = getMotivoConfig(m.submotivo);
                                        const MotivoIcon = motivoConfig.icon;
                                        return (
                                            <tr key={m.id} className="hover:bg-[#FBF7F0] transition">
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B]">{formatDate(m.created_at)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        {m.item_type === 'plato' ? '🍽️ Producto' : '🥛 Insumo'}
                                                    </span>
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
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B] max-w-[160px] truncate" title={m.observaciones || ''}>
                                                    {m.observaciones || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setMermaAEliminar(m)}
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

                    {mermas.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-[#F3E1C8]">
                            <p className="text-sm text-[#5A3D2B]">
                                Mostrando {mermas.from}-{mermas.to} de {mermas.total} registros
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {mermas.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => irAPagina(link.url)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${link.active
                                            ? 'bg-[#C9A96E] text-white'
                                            : link.url
                                                ? 'bg-white border border-[#E8D5C4] text-[#5A3D2B] hover:bg-[#FBF7F0]'
                                                : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MODAL: Confirmar eliminación ===== */}
            {mermaAEliminar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-[#2D1B1A]">¿Eliminar este registro?</h3>
                        <p className="text-sm text-[#5A3D2B] mt-1">
                            Se eliminará la merma de <strong>{mermaAEliminar.item?.nombre || 'este ítem'}</strong> y el stock
                            ({mermaAEliminar.cantidad}) se restaurará automáticamente.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setMermaAEliminar(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminarMerma}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}