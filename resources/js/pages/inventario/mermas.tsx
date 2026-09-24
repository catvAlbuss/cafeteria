import { Head, usePage, router } from '@inertiajs/react';
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
    X,
} from 'lucide-react';
import { useState } from 'react';
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
    observaciones: string;
    user: { name: string };
    item?: { nombre: string; precio?: number };
    created_at: string;
}

interface ItemFormulario {
    id: number;
    tipo: 'producto' | 'insumo';
    nombre: string;
    cantidad: number;
    motivo: string;
    stock: number;
    precio: number;
    unidad?: string;
}

// ============================================================
// MOTIVOS SEGÚN TIPO — un plato no "se corta" como la leche
// ============================================================
const MOTIVOS_PRODUCTO = [
    { value: 'quemado', label: 'Quemado / mal preparado' },
    { value: 'sobreproduccion', label: 'Sobreproducción' },
    { value: 'devolucion', label: 'Devolución de cliente' },
    { value: 'caducado', label: 'Caducado en vitrina' },
    { value: 'otro', label: 'Otro' },
];

const MOTIVOS_INSUMO = [
    { value: 'caducado', label: 'Vencido / caducado' },
    { value: 'rotura', label: 'Derrame o rotura' },
    { value: 'refrigeracion', label: 'Falla de refrigeración' },
    { value: 'mala_preparacion', label: 'Merma de preparación' },
    { value: 'otro', label: 'Otro' },
];

const getMotivoConfig = (submotivo: string) => {
    const motivos: Record<string, any> = {
        caducado: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            label: 'Caducado',
            icon: XCircle,
        },
        quemado: {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            label: 'Quemado',
            icon: AlertTriangle,
        },
        sobreproduccion: {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            label: 'Sobreproducción',
            icon: TrendingDown,
        },
        devolucion: {
            bg: 'bg-indigo-100',
            text: 'text-indigo-700',
            label: 'Devolución',
            icon: XCircle,
        },
        rotura: {
            bg: 'bg-purple-100',
            text: 'text-purple-700',
            label: 'Rotura/Derrame',
            icon: AlertTriangle,
        },
        refrigeracion: {
            bg: 'bg-cyan-100',
            text: 'text-cyan-700',
            label: 'Falla refrigeración',
            icon: AlertTriangle,
        },
        mala_preparacion: {
            bg: 'bg-pink-100',
            text: 'text-pink-700',
            label: 'Merma de prep.',
            icon: AlertTriangle,
        },
        otro: {
            bg: 'bg-sand',
            text: 'text-chocolate',
            label: 'Otro',
            icon: AlertTriangle,
        },
    };

    return (
        motivos[submotivo] || {
            bg: 'bg-sand',
            text: 'text-chocolate',
            label: submotivo || 'Sin especificar',
            icon: AlertTriangle,
        }
    );
};

export default function Mermas() {
    const {
        platos = [],
        insumos = [],
        mermas: mermasData = [],
    } = usePage().props as any;
    const [mermas, setMermas] = useState<Merma[]>(mermasData);
    const [formAbierto, setFormAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [tipoMerma, setTipoMerma] = useState<'producto' | 'insumo'>(
        'producto',
    );
    const [items, setItems] = useState<ItemFormulario[]>([]);
    const [busquedaItem, setBusquedaItem] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroMotivo, setFiltroMotivo] = useState('');
    const formatCurrency = (amount: any): string => {
        const num = typeof amount === 'number' ? amount : parseFloat(amount);

        if (isNaN(num)) {
            return 'S/ 0.00';
        }

        return `S/ ${num.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('es-PE');
        } catch {
            return dateString;
        }
    };

    // ===== ESTADÍSTICAS =====
    const { stats } = usePage().props as any;
    const totalPerdidas = stats?.total_perdidas ?? 0;
    const totalRegistros = stats?.total_registros ?? 0;

    const itemsDisponibles: (Plato | Insumo)[] =
        tipoMerma === 'producto' ? platos : insumos;
    const itemsFiltrados = itemsDisponibles.filter(
        (i) =>
            i.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) &&
            i.stock > 0,
    );

    const motivosDisponibles =
        tipoMerma === 'producto' ? MOTIVOS_PRODUCTO : MOTIVOS_INSUMO;
    // ===== AGREGAR ITEM AL FORMULARIO =====
    const agregarItem = (item: Plato | Insumo) => {
        const yaExiste = items.find(
            (i) => i.id === item.id && i.tipo === tipoMerma,
        );

        if (yaExiste) {
            toast.info(
                `${item.nombre} ya está en la lista, ajusta la cantidad ahí`,
            );

            return;
        }

        setItems((prev) => [
            ...prev,
            {
                id: item.id,
                tipo: tipoMerma,
                nombre: item.nombre,
                cantidad: tipoMerma === 'insumo' ? 0.1 : 1,
                motivo: '',
                stock: item.stock,
                precio: Number(item.precio) || 0,
                unidad: (item as Insumo).unidad,
            },
        ]);
    };

    const quitarItem = (id: number, tipo: string) => {
        setItems((prev) =>
            prev.filter((i) => !(i.id === id && i.tipo === tipo)),
        );
    };

    const actualizarItem = (
        id: number,
        tipo: string,
        campo: 'cantidad' | 'motivo',
        valor: string | number,
    ) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.id !== id || i.tipo !== tipo) {
                    return i;
                }

                if (campo === 'cantidad') {
                    const cant = Number(valor);

                    if (cant > i.stock) {
                        toast.error(
                            `Stock insuficiente para ${i.nombre} (disponible: ${i.stock})`,
                        );

                        return i;
                    }

                    return { ...i, cantidad: cant };
                }

                return { ...i, motivo: String(valor) };
            }),
        );
    };

    const resetFormulario = () => {
        setItems([]);
        setObservaciones('');
        setBusquedaItem('');
        setTipoMerma('producto');
    };

    // ===== GUARDAR =====
    const guardarMermas = () => {
        if (items.length === 0) {
            toast.warning('Agrega al menos un producto o insumo');

            return;
        }

        const sinMotivo = items.find((i) => !i.motivo);

        if (sinMotivo) {
            toast.warning(`Selecciona el motivo para "${sinMotivo.nombre}"`);

            return;
        }

        const sinCantidad = items.find((i) => !i.cantidad || i.cantidad <= 0);

        if (sinCantidad) {
            toast.warning(
                `Ingresa una cantidad válida para "${sinCantidad.nombre}"`,
            );

            return;
        }

        setCargando(true);
        router.post(
            '/mermas',
            {
                items: items.map((i) => ({
                    id: i.id,
                    tipo: i.tipo,
                    nombre: i.nombre,
                    cantidad: i.cantidad,
                    motivo: i.motivo,
                })),
                observaciones: observaciones || null,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setCargando(false);
                    resetFormulario();
                    setFormAbierto(false);
                    toast.success('Mermas registradas correctamente');
                    const nuevasMermas = (page.props.mermas as Merma[]) || [];
                    setMermas(nuevasMermas);
                },
                onError: (errors) => {
                    setCargando(false);
                    toast.error('Error: ' + Object.values(errors).join(' '));
                },
            } as Parameters<typeof router.post>[2],
        );
    };

    const eliminarMerma = (id: number) => {
        if (
            !confirm(
                '¿Eliminar este registro? El stock del producto/insumo se restaurará automáticamente.',
            )
        ) {
            return;
        }

        router.delete(`/mermas/${id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                toast.success('Merma eliminada y stock restaurado');
                const nuevasMermas = (page.props.mermas as Merma[]) || [];
                setMermas(nuevasMermas);
            },
            onError: (errors) =>
                toast.error('Error: ' + Object.values(errors).join(' ')),
        } as Parameters<typeof router.delete>[1]);
    };

    const mermasFiltradas = mermas.filter((m) => {
        const busquedaOk =
            !busqueda ||
            (m.item?.nombre || '')
                .toLowerCase()
                .includes(busqueda.toLowerCase());
        const motivoOk = !filtroMotivo || m.submotivo === filtroMotivo;

        return busquedaOk && motivoOk;
    });

    // ===== CALCULAR COSTO DE MERMA POR UNIDAD (SOLO FRONTEND) =====
    const calcularCostoMerma = (merma: Merma) => {
        const precio = merma.item?.precio || 0;
        const cantidad = merma.cantidad;

        if (merma.item_type === 'insumo') {
            const PESO_POR_UNIDAD = 0.1; // 100 gramos por unidad

            return cantidad * precio * PESO_POR_UNIDAD;
        }

        return cantidad * precio;
    };

    return (
        <>
            <Head title="Mermas - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-chocolate">
                            <span className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 p-2 text-white">
                                <Trash2 className="h-6 w-6" />
                            </span>
                            Mermas
                        </h1>
                        <p className="mt-1 ml-1 text-sm text-cocoa">
                            Control de pérdidas: productos terminados e insumos
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFormAbierto(!formAbierto)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva merma
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-roast px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-ink">
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* ===== FORMULARIO ===== */}
                {formAbierto && (
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-chocolate">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Registrar merma
                            </h2>
                            <button
                                onClick={() => setFormAbierto(false)}
                                className="text-cocoa-soft hover:text-red-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* PASO 1: Tipo */}
                        <div className="mb-4">
                            <label className="mb-1.5 block text-xs font-medium text-cocoa">
                                ¿Qué se perdió?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setTipoMerma('producto');
                                        setBusquedaItem('');
                                    }}
                                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition ${
                                        tipoMerma === 'producto'
                                            ? 'border-gold bg-gold text-ink'
                                            : 'border-wheat bg-cream-soft text-cocoa hover:border-gold/50'
                                    }`}
                                >
                                    Producto (plato ya hecho)
                                </button>
                                <button
                                    onClick={() => {
                                        setTipoMerma('insumo');
                                        setBusquedaItem('');
                                    }}
                                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition ${
                                        tipoMerma === 'insumo'
                                            ? 'border-gold bg-gold text-ink'
                                            : 'border-wheat bg-cream-soft text-cocoa hover:border-gold/50'
                                    }`}
                                >
                                    Insumo (materia prima)
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* PASO 2: Buscar y agregar */}
                            <div>
                                <label className="text-xs font-medium text-cocoa">
                                    Buscar{' '}
                                    {tipoMerma === 'producto'
                                        ? 'producto'
                                        : 'insumo'}{' '}
                                    y agregar
                                </label>
                                <div className="relative mt-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                                    <input
                                        type="text"
                                        placeholder={`Buscar ${tipoMerma === 'producto' ? 'producto' : 'insumo'}...`}
                                        className="w-full rounded-xl border border-wheat bg-card py-2.5 pr-4 pl-10 text-sm text-chocolate transition outline-none focus:ring-2 focus:ring-gold"
                                        value={busquedaItem}
                                        onChange={(e) =>
                                            setBusquedaItem(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="mt-2 grid max-h-[260px] grid-cols-2 gap-2 overflow-y-auto">
                                    {itemsFiltrados.length === 0 ? (
                                        <p className="col-span-2 py-6 text-center text-sm text-cocoa-soft">
                                            {busquedaItem
                                                ? 'Sin resultados'
                                                : `No hay ${tipoMerma === 'producto' ? 'productos' : 'insumos'} con stock`}
                                        </p>
                                    ) : (
                                        itemsFiltrados.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() =>
                                                    agregarItem(item)
                                                }
                                                className="rounded-xl border border-wheat p-3 text-left transition hover:border-gold hover:bg-cream"
                                            >
                                                <p className="text-sm font-medium text-chocolate">
                                                    {item.nombre}
                                                </p>
                                                <p className="text-xs text-cocoa-soft">
                                                    Stock: {item.stock}
                                                    {(item as Insumo).unidad
                                                        ? ` ${(item as Insumo).unidad}`
                                                        : ''}
                                                </p>
                                                <p className="text-xs font-semibold text-gold">
                                                    {formatCurrency(
                                                        item.precio,
                                                    )}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* PASO 3: Items a mermar, con motivo y cantidad */}
                            <div>
                                <label className="text-xs font-medium text-cocoa">
                                    Productos a mermar ({items.length})
                                </label>
                                <div className="mt-1 max-h-[300px] min-h-[150px] space-y-3 overflow-y-auto rounded-xl border border-wheat p-3">
                                    {items.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-cocoa-soft">
                                            No hay productos agregados
                                        </p>
                                    ) : (
                                        items.map((item) => (
                                            <div
                                                key={`${item.tipo}-${item.id}`}
                                                className="space-y-2 rounded-lg bg-cream p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-chocolate">
                                                        {item.nombre}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            quitarItem(
                                                                item.id,
                                                                item.tipo,
                                                            )
                                                        }
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="w-16 text-[10px] text-cocoa">
                                                        Cantidad
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={item.stock}
                                                        step={
                                                            item.tipo ===
                                                            'insumo'
                                                                ? 0.1
                                                                : 1
                                                        }
                                                        value={item.cantidad}
                                                        onChange={(e) =>
                                                            actualizarItem(
                                                                item.id,
                                                                item.tipo,
                                                                'cantidad',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex-1 rounded-lg border border-wheat px-2 py-1.5 text-sm text-chocolate outline-none focus:ring-2 focus:ring-gold"
                                                    />
                                                    {item.unidad && (
                                                        <span className="text-xs text-cocoa-soft">
                                                            {item.unidad}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="w-16 text-[10px] text-cocoa">
                                                        Motivo
                                                    </label>
                                                    <select
                                                        value={item.motivo}
                                                        onChange={(e) =>
                                                            actualizarItem(
                                                                item.id,
                                                                item.tipo,
                                                                'motivo',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex-1 rounded-lg border border-wheat px-2 py-1.5 text-xs text-chocolate outline-none focus:ring-2 focus:ring-gold"
                                                    >
                                                        <option value="">
                                                            Seleccionar...
                                                        </option>
                                                        {(item.tipo ===
                                                        'producto'
                                                            ? MOTIVOS_PRODUCTO
                                                            : MOTIVOS_INSUMO
                                                        ).map((m) => (
                                                            <option
                                                                key={m.value}
                                                                value={m.value}
                                                            >
                                                                {m.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-3">
                                    <label className="text-xs font-medium text-cocoa">
                                        Observaciones (opcional)
                                    </label>
                                    <textarea
                                        className="mt-1 w-full resize-none rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:ring-2 focus:ring-gold"
                                        rows={2}
                                        value={observaciones}
                                        onChange={(e) =>
                                            setObservaciones(e.target.value)
                                        }
                                        placeholder="Ej: se cayó el bidón en el almacén, contexto adicional..."
                                    />
                                </div>

                                <button
                                    onClick={guardarMermas}
                                    disabled={cargando || items.length === 0}
                                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition ${
                                        cargando || items.length === 0
                                            ? 'cursor-not-allowed bg-wheat text-cocoa'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    {cargando ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Registrar Mermas
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ESTADÍSTICAS */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Pérdidas totales
                                </p>
                                <p className="mt-1 text-3xl font-bold text-red-600">
                                    {formatCurrency(totalPerdidas)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                                <DollarSign className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Registros
                                </p>
                                <p className="mt-1 text-3xl font-bold text-chocolate">
                                    {totalRegistros}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                                <Package className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Última merma
                                </p>
                                <p className="mt-1 truncate text-lg font-bold text-blue-600">
                                    {mermas.length > 0
                                        ? mermas[0]?.item?.nombre || '-'
                                        : '-'}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Promedio por registro
                                </p>
                                <p className="mt-1 text-3xl font-bold text-chocolate">
                                    {totalRegistros > 0
                                        ? formatCurrency(
                                              totalPerdidas / totalRegistros,
                                          )
                                        : 'S/ 0.00'}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                                <TrendingDown className="h-6 w-6 text-gold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full rounded-xl border border-wheat bg-card py-2.5 pr-4 pl-10 text-sm text-chocolate transition outline-none focus:ring-2 focus:ring-gold"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:ring-2 focus:ring-gold"
                            value={filtroMotivo}
                            onChange={(e) => setFiltroMotivo(e.target.value)}
                        >
                            <option value="">Todos los motivos</option>
                            {[...MOTIVOS_PRODUCTO, ...MOTIVOS_INSUMO]
                                .filter(
                                    (m, i, arr) =>
                                        arr.findIndex(
                                            (x) => x.value === m.value,
                                        ) === i,
                                )
                                .map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                        </select>
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setFiltroMotivo('');
                            }}
                            className="rounded-xl bg-roast py-2.5 text-sm font-semibold text-white transition hover:bg-ink"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="overflow-hidden rounded-2xl border border-sand bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-sand p-5">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Package className="h-5 w-5 text-red-500" />
                            Registro de mermas
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-cocoa">Total pérdidas:</span>
                            <span className="font-bold text-red-600">
                                {formatCurrency(totalPerdidas)}
                            </span>
                            <span className="text-cocoa">
                                | {mermasFiltradas.length} registros
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Producto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Cantidad
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Motivo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Costo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-cocoa uppercase">
                                        Responsable
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-cocoa uppercase">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-soft">
                                {mermasFiltradas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-12 text-center text-cocoa-soft"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-10 w-10 text-cocoa-soft" />
                                                <span>
                                                    No hay mermas registradas
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    mermasFiltradas.map((m) => {
                                        const motivoConfig = getMotivoConfig(
                                            m.submotivo,
                                        );
                                        const MotivoIcon = motivoConfig.icon;

                                        return (
                                            <tr
                                                key={m.id}
                                                className="transition hover:bg-cream"
                                            >
                                                <td className="px-4 py-3 text-sm text-cocoa">
                                                    {formatDate(m.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-cocoa">
                                                        {m.item_type === 'plato'
                                                            ? 'Producto'
                                                            : 'Insumo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-chocolate">
                                                    {m.item?.nombre || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600">
                                                    {m.cantidad}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${motivoConfig.bg} ${motivoConfig.text}`}
                                                    >
                                                        <MotivoIcon className="h-3 w-3" />
                                                        {motivoConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-red-600">
                                                    {formatCurrency(
                                                        calcularCostoMerma(m),
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-cocoa">
                                                    {m.user?.name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() =>
                                                            eliminarMerma(m.id)
                                                        }
                                                        className="mx-auto flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                                                    >
                                                        <Trash2 className="h-3 w-3" />{' '}
                                                        Eliminar
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
