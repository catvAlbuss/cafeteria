import { Head, usePage, router } from '@inertiajs/react';

import {
    Package,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Check,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Building2,
    DollarSign,
    AlertTriangle,
    Coffee,
    Milk,
    Wheat,
    Apple,
    Egg,
    ShoppingCart,
    Printer,
    FileSpreadsheet,
    Layers,
    Box,
    Store,
    Truck,
    Tag,
    BarChart3,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import ModalInsumo from '@/components/modals/ModalInsumo';

interface Insumo {
    id: number;
    nombre: string;
    categoria: string;
    unidad: string;
    stock: number;
    precio: number;
    proveedor: string;
    activo: boolean;
    created_at: string;
    area: 'cocina' | 'bar';
}

const categoriaIconos: Record<string, any> = {
    Cafetería: Coffee,
    Lácteos: Milk,
    Panadería: Wheat,
    Frutas: Apple,
    Huevos: Egg,
    Dulces: Package,
    Bebidas: Coffee,
    Especias: Tag,
    'Frutas Secas': Box,
};

const categoriaColores: Record<string, string> = {
    Cafetería: 'bg-amber-100 text-amber-700 border-amber-200',
    Lácteos: 'bg-blue-100 text-blue-700 border-blue-200',
    Panadería: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Frutas: 'bg-green-100 text-green-700 border-green-200',
    Huevos: 'bg-orange-100 text-orange-700 border-orange-200',
    Dulces: 'bg-pink-100 text-pink-700 border-pink-200',
    Bebidas: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Especias: 'bg-purple-100 text-purple-700 border-purple-200',
    'Frutas Secas': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function Insumos() {
    const { insumos, userRole } = usePage().props as any; //
    const [insumosData, setInsumosData] = useState<Insumo[]>(insumos || []);
    const CATEGORIAS_COCINA = [
        'Panadería',
        'Frutas',
        'Huevos',
        'Dulces',
        'Especias',
        'Frutas Secas',
    ];
    const CATEGORIAS_BAR = ['Cafetería', 'Lácteos', 'Bebidas'];
    const insumosFiltradosPorRol = useMemo(() => {
        if (userRole === 'Cocinero') {
            return insumosData.filter((i) =>
                CATEGORIAS_COCINA.includes(i.categoria),
            );
        }

        if (userRole === 'Bar') {
            return insumosData.filter((i) =>
                CATEGORIAS_BAR.includes(i.categoria),
            );
        }

        return insumosData;
    }, [insumosData, userRole]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
    const [modalMermaAbierto, setModalMermaAbierto] = useState(false);
    const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(
        null,
    );
    const [esEdicion, setEsEdicion] = useState(false);

    const [formulario, setFormulario] = useState({
        nombre: '',
        categoria: '',
        unidad: 'kg',
        stock: 0,
        precio: 0,
        proveedor: '',
        activo: true,
    });

    const [formCompra, setFormCompra] = useState({
        cantidad: 0,
        observaciones: '',
    });
    const [formMerma, setFormMerma] = useState({
        cantidad: 0,
        observaciones: '',
    });
    const [motivoMerma, setMotivoMerma] = useState('');
    const [cargandoMerma, setCargandoMerma] = useState(false);
    const totalInsumos = insumosData.length;
    const totalStock = insumosData.reduce((sum, i) => sum + i.stock, 0);
    const totalValor = insumosData.reduce(
        (sum, i) => sum + i.stock * i.precio,
        0,
    );
    const insumosBajos = insumosData.filter((i) => i.stock < 5).length;
    const categorias = [...new Set(insumosData.map((i) => i.categoria))].filter(
        Boolean,
    );

    const formatCurrency = (amount: any) => {
        const num = typeof amount === 'number' ? amount : parseFloat(amount);

        if (isNaN(num)) {
            return 'S/ 0.00';
        }

        return `S/ ${num.toFixed(2)}`;
    };

    const formatNumber = (num: any) => {
        const n = typeof num === 'number' ? num : parseFloat(num);

        if (isNaN(n)) {
            return '0';
        }

        return n.toLocaleString('es-PE');
    };

    const getCategoriaIcon = (categoria: string) => {
        return categoriaIconos[categoria] || Package;
    };

    const getCategoriaColor = (categoria: string) => {
        return (
            categoriaColores[categoria] || 'bg-sand text-chocolate border-wheat'
        );
    };

    const insumosFiltrados = insumosFiltradosPorRol.filter((i) => {
        const busquedaOk =
            !busqueda ||
            i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            i.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
            i.proveedor.toLowerCase().includes(busqueda.toLowerCase());
        const categoriaOk = !filtroCategoria || i.categoria === filtroCategoria;

        return busquedaOk && categoriaOk;
    });

    const abrirCompra = (insumo: Insumo) => {
        setInsumoSeleccionado(insumo);
        setModalCompraAbierto(true);
        setModalMermaAbierto(false);
        setModalAbierto(false);
    };

    const abrirMerma = (insumo: Insumo) => {
        setInsumoSeleccionado(insumo);
        setModalMermaAbierto(true);
        setModalCompraAbierto(false);
        setModalAbierto(false);
    };

    const abrirEditar = (insumo: Insumo) => {
        setInsumoSeleccionado(insumo);
        setFormulario({
            nombre: insumo.nombre,
            categoria: insumo.categoria,
            unidad: insumo.unidad,
            stock: insumo.stock,
            precio: insumo.precio,
            proveedor: insumo.proveedor,
            activo: insumo.activo,
        });
        setEsEdicion(true);
        setModalAbierto(true);
        setModalCompraAbierto(false);
        setModalMermaAbierto(false);
    };

    const eliminarInsumo = (insumo: Insumo) => {
        if (!confirm(`¿Seguro que deseas eliminar "${insumo.nombre}"?`)) {
            return;
        }

        const idEliminar = insumo.id;
        setInsumosData((prev) => prev.filter((i) => i.id !== idEliminar));

        router.delete(`/insumos/${insumo.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Insumo eliminado correctamente');
            },
            onError: (errors) => {
                setInsumosData((prev) => [...prev, insumo]);

                if (errors.insumo?.includes('Cardex')) {
                    if (
                        confirm(
                            `${insumo.nombre} ya tiene movimientos registrados (compras/mermas) y no se puede eliminar sin perder ese historial.\n\n¿Deseas DESACTIVARLO en su lugar? Dejará de aparecer en las operaciones diarias, pero conservará su historial.`,
                        )
                    ) {
                        desactivarInsumo(insumo);
                    }

                    return;
                }

                toast.error(errors.insumo || 'No se pudo eliminar el insumo');
            },
        });
    };

    const desactivarInsumo = (insumo: Insumo) => {
        router.put(
            `/insumos/${insumo.id}`,
            {
                nombre: insumo.nombre,
                categoria: insumo.categoria,
                area: (insumo as any).area,
                unidad: insumo.unidad,
                precio: insumo.precio,
                proveedor: insumo.proveedor,
                activo: false,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.success(
                        'Insumo desactivado — se conserva su historial',
                    );
                    const nuevosInsumos =
                        (page.props.insumos as Insumo[]) || [];
                    setInsumosData(nuevosInsumos);
                },
                onError: (errors) => {
                    toast.error(
                        'Error al desactivar: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };
    // ============================================================
    // REGISTRAR COMPRA Y MERMA
    // ============================================================

    const registrarCompra = () => {
        if (!insumoSeleccionado || formCompra.cantidad <= 0) {
            toast.warning('Ingresa una cantidad válida');

            return;
        }

        router.post(`/insumos/${insumoSeleccionado.id}/comprar`, formCompra, {
            onSuccess: (page) => {
                setModalCompraAbierto(false);
                toast.success('Compra registrada');

                const nuevosInsumos = (page.props.insumos as Insumo[]) || [];
                setInsumosData(nuevosInsumos);
            },
            onError: (errors) => {
                toast.error('Error: ' + Object.values(errors).join(' '));
            },
        });
    };

    const registrarMerma = () => {
        if (!insumoSeleccionado || formMerma.cantidad <= 0) {
            toast.warning('Ingresa una cantidad válida');

            return;
        }

        if (formMerma.cantidad > insumoSeleccionado.stock) {
            toast.error('Stock insuficiente');

            return;
        }

        if (!motivoMerma) {
            toast.warning('Selecciona un motivo para la merma');

            return;
        }

        setCargandoMerma(true);
        router.post(
            '/mermas',
            {
                items: [
                    {
                        id: insumoSeleccionado.id,
                        tipo: 'insumo',
                        nombre: insumoSeleccionado.nombre,
                        cantidad: formMerma.cantidad,
                        motivo: motivoMerma,
                    },
                ],
                observaciones: formMerma.observaciones || null,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setModalMermaAbierto(false);
                    setFormMerma({ cantidad: 0, observaciones: '' });
                    setMotivoMerma('');
                    setCargandoMerma(false);
                    toast.success('Merma registrada correctamente');

                    const nuevosInsumos =
                        (page.props.insumos as Insumo[]) || [];
                    setInsumosData(nuevosInsumos);
                },
                onError: (errors) => {
                    setCargandoMerma(false);
                    toast.error('Error: ' + Object.values(errors).join(' '));
                },
            } as Parameters<typeof router.post>[2],
        );
    };

    return (
        <>
            <Head title="Insumos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* HEADER con gradiente */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-roast to-espresso p-6 md:p-8">
                    <div className="absolute top-0 right-0 opacity-10">
                        <Package className="h-64 w-64 text-white" />
                    </div>
                    <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                                <span className="rounded-xl bg-gold p-2">
                                    <Package className="h-6 w-6 text-white" />
                                </span>
                                Insumos
                            </h1>
                            <p className="mt-1 text-sm text-white/60">
                                Gestión de materia prima e insumos
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    setEsEdicion(false);
                                    setInsumoSeleccionado(null);
                                    setFormulario({
                                        nombre: '',
                                        categoria: '',
                                        unidad: 'kg',
                                        stock: 0,
                                        precio: 0,
                                        proveedor: '',
                                        activo: true,
                                    });
                                    setModalAbierto(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Insumo
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs font-medium text-white/60">
                                Total insumos
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {totalInsumos}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs font-medium text-white/60">
                                Stock total
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {formatNumber(totalStock)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs font-medium text-white/60">
                                Valor total
                            </p>
                            <p className="text-2xl font-bold text-gold">
                                {formatCurrency(totalValor)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs font-medium text-white/60">
                                Stock bajo
                            </p>
                            <p className="text-2xl font-bold text-orange-400">
                                {insumosBajos}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                            <input
                                type="text"
                                placeholder="Buscar insumo..."
                                className="w-full rounded-xl border border-wheat bg-card py-2.5 pr-4 pl-10 text-sm text-chocolate placeholder-cocoa-soft transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="min-w-[180px] rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setFiltroCategoria('');
                            }}
                            className="rounded-xl bg-roast px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink hover:shadow-md active:scale-95"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* TARJETAS DE INSUMOS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {insumosFiltrados.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-cocoa-soft">
                            <Package className="mx-auto mb-3 h-16 w-16 text-cocoa-soft" />
                            <p className="text-lg font-medium">
                                No hay insumos registrados
                            </p>
                            <p className="text-sm">
                                Crea tu primer insumo haciendo clic en "Nuevo
                                Insumo"
                            </p>
                        </div>
                    ) : (
                        insumosFiltrados.map((insumo) => {
                            const Icono = getCategoriaIcon(insumo.categoria);
                            const colorCategoria = getCategoriaColor(
                                insumo.categoria,
                            );
                            const isStockBajo = insumo.stock < 5;
                            const isStockCritico = insumo.stock < 2;

                            return (
                                <div
                                    key={insumo.id}
                                    className={`group rounded-2xl border bg-card ${isStockCritico ? 'border-red-300' : isStockBajo ? 'border-yellow-300' : 'border-sand'} overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                                >
                                    {/* Header con categoría */}
                                    <div
                                        className={`flex items-center justify-between border-b px-4 py-3 ${isStockCritico ? 'bg-red-50' : isStockBajo ? 'bg-yellow-50' : 'bg-cream'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`rounded-lg p-1.5 ${colorCategoria}`}
                                            >
                                                <Icono className="h-4 w-4" />
                                            </span>
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colorCategoria}`}
                                            >
                                                {insumo.categoria ||
                                                    'Sin categoría'}
                                            </span>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                insumo.activo
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {insumo.activo
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-chocolate">
                                                    {insumo.nombre}
                                                </h3>
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-cocoa-soft">
                                                    <Truck className="h-3 w-3" />
                                                    {insumo.proveedor ||
                                                        'Sin proveedor'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gold">
                                                    {formatCurrency(
                                                        insumo.precio,
                                                    )}
                                                </p>
                                                <p className="text-xs text-cocoa-soft">
                                                    por {insumo.unidad}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stock */}
                                        <div className="mt-3">
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="text-cocoa">
                                                    Stock
                                                </span>
                                                <span
                                                    className={`font-bold ${isStockCritico ? 'text-red-600' : isStockBajo ? 'text-yellow-600' : 'text-green-600'}`}
                                                >
                                                    {insumo.stock}{' '}
                                                    {insumo.unidad}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isStockCritico
                                                            ? 'bg-red-500'
                                                            : isStockBajo
                                                              ? 'bg-yellow-500'
                                                              : 'bg-green-500'
                                                    }`}
                                                    style={{
                                                        width: `${Math.min((insumo.stock / 50) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="mt-4 flex items-center gap-1.5 border-t border-sand pt-3">
                                            <button
                                                onClick={() =>
                                                    abrirCompra(insumo)
                                                }
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-200"
                                            >
                                                <ShoppingCart className="h-3.5 w-3.5" />
                                                Comprar
                                            </button>
                                            <button
                                                onClick={() =>
                                                    abrirMerma(insumo)
                                                }
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-200"
                                            >
                                                <TrendingDown className="h-3.5 w-3.5" />
                                                Mermar
                                            </button>
                                            <button
                                                onClick={() =>
                                                    abrirEditar(insumo)
                                                }
                                                className="flex flex-1 items-center justify-center rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                                title="Editar insumo"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    eliminarInsumo(insumo)
                                                }
                                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== MODAL: Nuevo/Editar Insumo ===== */}
            <ModalInsumo
                isOpen={modalAbierto}
                onClose={() => {
                    setModalAbierto(false);
                    setInsumoSeleccionado(null);
                    setEsEdicion(false);
                }}
                insumo={esEdicion ? insumoSeleccionado : null}
                onSave={(data) => {
                    const url = esEdicion
                        ? `/insumos/${insumoSeleccionado?.id}`
                        : '/insumos';
                    const method = esEdicion ? 'put' : 'post';

                    router[method](url, data, {
                        onSuccess: (page) => {
                            setModalAbierto(false);
                            toast.success(
                                esEdicion
                                    ? 'Insumo actualizado'
                                    : 'Insumo creado',
                            );

                            // ✅ Actualizar el estado local con los nuevos datos
                            const nuevosInsumos =
                                (page.props.insumos as Insumo[]) || [];
                            setInsumosData(nuevosInsumos);
                        },
                        onError: (errors) => {
                            toast.error(
                                'Error: ' + Object.values(errors).join(' '),
                            );
                        },
                    });
                }}
            />
            {/* ===== MODAL: Registrar Compra ===== */}
            {modalCompraAbierto && insumoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-sand p-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                                    <ShoppingCart className="h-5 w-5 text-green-500" />
                                    Registrar Compra
                                </h2>
                                <p className="text-xs text-cocoa">
                                    {insumoSeleccionado.nombre}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalCompraAbierto(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Stock actual:{' '}
                                    <span className="font-bold text-gold">
                                        {insumoSeleccionado.stock}{' '}
                                        {insumoSeleccionado.unidad}
                                    </span>
                                </label>
                            </div>

                            {/* ❌ ELIMINA el selector de motivo de aquí */}

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Cantidad a comprar *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={formCompra.cantidad}
                                    onChange={(e) =>
                                        setFormCompra({
                                            ...formCompra,
                                            cantidad:
                                                parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Observaciones
                                </label>
                                <textarea
                                    className="w-full resize-none rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    rows={2}
                                    value={formCompra.observaciones}
                                    onChange={(e) =>
                                        setFormCompra({
                                            ...formCompra,
                                            observaciones: e.target.value,
                                        })
                                    }
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-sand p-6">
                            <button
                                onClick={() => setModalCompraAbierto(false)}
                                className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registrarCompra}
                                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg active:scale-95"
                            >
                                <Check className="h-4 w-4" />
                                Registrar Compra
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL: Registrar Merma - CORRECTO */}
            {/* ============================================================ */}
            {modalMermaAbierto && insumoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-sand p-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                    Registrar Merma
                                </h2>
                                <p className="text-xs text-cocoa">
                                    {insumoSeleccionado.nombre}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setModalMermaAbierto(false);
                                    setFormMerma({
                                        cantidad: 0,
                                        observaciones: '',
                                    });
                                    setMotivoMerma('');
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            {/* Stock actual */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Stock actual:{' '}
                                    <span className="font-bold text-gold">
                                        {insumoSeleccionado.stock}{' '}
                                        {insumoSeleccionado.unidad}
                                    </span>
                                </label>
                            </div>

                            {/* ✅ Selector de motivo - AQUÍ DEBE ESTAR */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Motivo de la merma *
                                </label>
                                <select
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={motivoMerma}
                                    onChange={(e) =>
                                        setMotivoMerma(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Seleccionar motivo...
                                    </option>
                                    <option value="caducado">
                                        Vencido / caducado
                                    </option>
                                    <option value="rotura">
                                        Derrame o rotura
                                    </option>
                                    <option value="refrigeracion">
                                        Falla de refrigeración
                                    </option>
                                    <option value="mala_preparacion">
                                        Merma de preparación
                                    </option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Cantidad a mermar *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={formMerma.cantidad}
                                    onChange={(e) =>
                                        setFormMerma({
                                            ...formMerma,
                                            cantidad:
                                                parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    placeholder="0.00"
                                    max={insumoSeleccionado.stock}
                                />
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Observaciones
                                </label>
                                <textarea
                                    className="w-full resize-none rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    rows={2}
                                    value={formMerma.observaciones}
                                    onChange={(e) =>
                                        setFormMerma({
                                            ...formMerma,
                                            observaciones: e.target.value,
                                        })
                                    }
                                    placeholder="Notas adicionales sobre la merma..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-sand p-6">
                            <button
                                onClick={() => {
                                    setModalMermaAbierto(false);
                                    setFormMerma({
                                        cantidad: 0,
                                        observaciones: '',
                                    });
                                    setMotivoMerma('');
                                }}
                                className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registrarMerma}
                                disabled={
                                    cargandoMerma ||
                                    formMerma.cantidad <= 0 ||
                                    !motivoMerma
                                }
                                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition hover:shadow-lg active:scale-95 ${
                                    cargandoMerma ||
                                    formMerma.cantidad <= 0 ||
                                    !motivoMerma
                                        ? 'cursor-not-allowed bg-wheat text-cocoa'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                {cargandoMerma ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Registrar Merma
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
Insumos.layout = {
    breadcrumbs: [
        {
            title: 'Insumos',
            href: '/insumos',
        },
    ],
};
