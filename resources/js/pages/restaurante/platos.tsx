import { Head, usePage, router } from '@inertiajs/react';
import {
    Coffee,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    Package,
    Tag,
    X,
    Image as ImageIcon,
    ChefHat,
    Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Plato {
    id: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    precio: number;
    stock: number;
    vendidos: number;
    imagen: string;
    emoji: string;
    disponible: boolean;
}

const toArray = <T,>(
    value: T[] | { data?: T[] } | Record<string, T> | null | undefined,
): T[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && Array.isArray((value as { data?: T[] }).data)) {
        return (value as { data: T[] }).data;
    }

    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, T>);
    }

    return [];
};

export default function Platos() {
    const { platos: platosIniciales = [] } = usePage<{
        platos: Plato[] | { data?: Plato[] } | Record<string, Plato>;
    }>().props;
    const [platos, setPlatos] = useState<Plato[]>(() =>
        toArray<Plato>(platosIniciales),
    );
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [platoSeleccionado, setPlatoSeleccionado] = useState<Plato | null>(
        null,
    );
    const [esEdicion, setEsEdicion] = useState(false);
    //  Estado del formulario
    const [formulario, setFormulario] = useState({
        id: '',
        nombre: '',
        categoria: 'Bebidas',
        descripcion: '',
        precio: 0,
        stock: 0,
        imagen: '',
    });
    const [modalEtiquetaAbierto, setModalEtiquetaAbierto] = useState(false);
    const [etiquetaActual, setEtiquetaActual] = useState<Plato | null>(null);
    const [previewImagen, setPreviewImagen] = useState<string>('');
    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [ordenPor, setOrdenPor] = useState('');
    //  Filtrar y ordenar platos
    const platosFiltrados = platos
        .filter((p) => {
            const catOk = !filtroCategoria || p.categoria === filtroCategoria;
            const estadoOk =
                !filtroEstado ||
                (filtroEstado === 'Disponible' ? p.stock > 0 : p.stock === 0);

            return catOk && estadoOk;
        })
        .sort((a, b) => {
            if (ordenPor === 'vendidos') {
                return b.vendidos - a.vendidos;
            }

            if (ordenPor === 'precio') {
                return a.precio - b.precio;
            }

            if (ordenPor === 'stock') {
                return b.stock - a.stock;
            }

            return 0;
        });

    //  Resumen
    const resumen = {
        activos: platos.filter((p) => p.stock > 0).length,
        agotados: platos.filter((p) => p.stock === 0).length,
        categorias: new Set(platos.map((p) => p.categoria)).size,
        stockTotal: platos.reduce((sum, p) => sum + p.stock, 0),
    };

    const topProductos = [...platos]
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, 4);
    const maxVendidos = topProductos.length ? topProductos[0].vendidos : 1;

    const categoriasTotales: Record<string, number> = {};
    platos.forEach((p) => {
        categoriasTotales[p.categoria] =
            (categoriasTotales[p.categoria] || 0) + p.vendidos;
    });
    const topCategorias = Object.entries(categoriasTotales).sort(
        (a, b) => b[1] - a[1],
    );
    const maxCategoriaVentas = topCategorias.length ? topCategorias[0][1] : 1;

    const abrirNuevo = () => {
        setEsEdicion(false);
        setFormulario({
            id: '',
            nombre: '',
            categoria: 'Bebidas',
            descripcion: '',
            precio: 0,
            stock: 0,
            imagen: '',
        });
        setPreviewImagen('');
        setImagenFile(null);
        setModalAbierto(true);
    };

    const abrirEditar = (plato: Plato) => {
        setEsEdicion(true);
        setFormulario({ ...plato });
        setPreviewImagen(plato.imagen || '');
        setImagenFile(null);
        setModalAbierto(true);
    };

    //  Guardar plato (crear/editar) con Inertia
    const guardarPlato = () => {
        if (
            !formulario.nombre ||
            formulario.precio < 0 ||
            formulario.stock < 0
        ) {
            alert('Complete todos los campos correctamente.');

            return;
        }

        const url = esEdicion ? `/platos/${formulario.id}` : '/platos';
        const { imagen: _imagen, ...datosSinImagen } = formulario;
        void _imagen;
        const datos = {
            ...datosSinImagen,
            ...(imagenFile ? { imagen: imagenFile } : {}),
        } as Parameters<typeof router.post>[1];

        const opciones = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setModalAbierto(false);
                router.reload({
                    only: ['platos'],
                    preserveScroll: true,
                } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors: Record<string, string>) => {
                alert('Error al guardar: ' + Object.values(errors).join(' '));
            },
        } as Parameters<typeof router.post>[2];

        if (esEdicion) {
            router.post(url, { ...datos, _method: 'put' }, opciones);
        } else {
            router.post(url, datos, opciones);
        }
    };

    //  Eliminar plato con Inertia
    const eliminarPlato = (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este plato?')) {
            return;
        }

        const platosAnteriores = platos;
        setPlatos((prev) => prev.filter((p) => p.id !== id));

        router.delete(`/platos/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({
                    only: ['platos'],
                    preserveScroll: true,
                } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors) => {
                setPlatos(platosAnteriores); // revertir si falla
                alert('Error al eliminar: ' + Object.values(errors).join(' '));
            },
        } as Parameters<typeof router.delete>[1]);
    };
    //  Cambiar disponibilidad del plato
    const toggleDisponibilidad = (id: string) => {
        const plato = platos.find((p) => p.id === id);

        if (!plato) {
            return;
        }

        setPlatos((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, disponible: !p.disponible } : p,
            ),
        );

        router.patch(
            `/platos/${id}/disponibilidad`,
            {
                disponible: !plato.disponible,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({
                        only: ['platos'],
                        preserveScroll: true,
                    } as Parameters<typeof router.reload>[0]);
                },
                onError: (errors) => {
                    setPlatos((prev) =>
                        prev.map((p) =>
                            p.id === id
                                ? { ...p, disponible: plato.disponible }
                                : p,
                        ),
                    );
                    alert(
                        'Error al cambiar disponibilidad: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };

    const verPlato = (plato: Plato) => {
        setPlatoSeleccionado(plato);
        setModalVerAbierto(true);
    };

    const formatCurrency = (amount: number | string): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(num)) {
            return 'S/ 0.00';
        }

        return `S/ ${num.toFixed(2)}`;
    };

    useEffect(() => {
        setPlatos(toArray<Plato>(platosIniciales));
    }, [platosIniciales]);
    useEffect(() => {
        if (!modalAbierto) {
            return;
        }

        const manejarPegado = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;

            if (!items) {
                return;
            }

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();

                    if (file) {
                        setImagenFile(file);
                        setPreviewImagen(URL.createObjectURL(file));
                    }

                    e.preventDefault();
                    break;
                }
            }
        };

        window.addEventListener('paste', manejarPegado);

        return () => {
            window.removeEventListener('paste', manejarPegado);
        };
    }, [modalAbierto]);

    return (
        <>
            <Head title="Platos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* ===== HEADER ===== */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-chocolate">
                            Platos
                        </h1>
                        <p className="mt-1 text-sm text-cocoa">
                            Gestión del menú de la cafetería
                        </p>
                    </div>
                    <button
                        onClick={abrirNuevo}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Plato
                    </button>
                </div>

                {/* ===== FILTROS ===== */}
                <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <select
                            className="rounded-xl border border-wheat bg-card p-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Postres">Postres</option>
                            <option value="Sandwiches">Sandwiches</option>
                            <option value="Desayunos">Desayunos</option>
                        </select>

                        <select
                            className="rounded-xl border border-wheat bg-card p-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Disponible">Disponible</option>
                            <option value="Agotado">Agotado</option>
                        </select>

                        <select
                            className="rounded-xl border border-wheat bg-card p-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={ordenPor}
                            onChange={(e) => setOrdenPor(e.target.value)}
                        >
                            <option value="">Ordenar por</option>
                            <option value="vendidos">Más vendidos</option>
                            <option value="precio">Precio</option>
                            <option value="stock">Stock</option>
                        </select>

                        <button
                            onClick={() => {
                                setFiltroCategoria('');
                                setFiltroEstado('');
                                setOrdenPor('');
                            }}
                            className="rounded-xl bg-roast text-sm font-semibold text-white transition hover:bg-ink"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== CONTADOR Y GRID ===== */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-sand px-4 py-2 text-sm font-semibold text-cocoa">
                            {platosFiltrados.length} Productos
                        </span>
                    </div>
                </div>

                {/* ===== GRID DE PLATOS ===== */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {platosFiltrados.map((plato) => {
                        const estado =
                            plato.stock > 0 ? 'Disponible' : 'Agotado';
                        const estadoClase =
                            plato.stock > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600';

                        return (
                            <div
                                key={plato.id}
                                className="group overflow-hidden rounded-2xl border border-sand bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="flex h-36 items-center justify-center overflow-hidden bg-cream-grain">
                                    {plato.imagen ? (
                                        <img
                                            src={plato.imagen}
                                            alt={plato.nombre}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).style.display = 'none';
                                                (
                                                    e.target as HTMLImageElement
                                                ).nextElementSibling?.classList.remove(
                                                    'hidden',
                                                );
                                            }}
                                        />
                                    ) : (
                                        <span className="text-5xl">
                                            {plato.emoji || '🍽️'}
                                        </span>
                                    )}
                                    <span className="hidden text-5xl">
                                        {plato.emoji || '🍽️'}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <span className="mb-2 inline-block rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-cocoa">
                                        {plato.categoria}
                                    </span>
                                    <h3 className="text-lg font-bold text-chocolate">
                                        {plato.nombre}
                                    </h3>
                                    <p className="mt-1 line-clamp-1 text-xs text-cocoa-soft">
                                        {plato.descripcion}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xl font-bold text-gold">
                                            {formatCurrency(plato.precio)}
                                        </span>
                                        <span
                                            className={`${estadoClase} rounded-full px-2 py-0.5 text-[10px] font-semibold`}
                                        >
                                            {estado}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between text-xs text-cocoa-soft">
                                        <span>Stock: {plato.stock}</span>
                                        <span>Vendidos: {plato.vendidos}</span>
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <button
                                            onClick={() => verPlato(plato)}
                                            className="w-full rounded-lg bg-gold py-1.5 text-sm font-semibold text-ink transition hover:bg-gold-deep"
                                        >
                                            Ver
                                        </button>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                onClick={() =>
                                                    abrirEditar(plato)
                                                }
                                                className="flex items-center justify-center gap-1 rounded-lg bg-sand py-1.5 text-xs font-semibold text-chocolate transition hover:bg-wheat"
                                            >
                                                <Edit className="h-3 w-3" />{' '}
                                                Editar
                                            </button>
                                            <button
                                                onClick={() =>
                                                    eliminarPlato(plato.id)
                                                }
                                                className="flex items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                            >
                                                <Trash2 className="h-3 w-3" />{' '}
                                                Eliminar
                                            </button>
                                        </div>

                                        {/*  AGREGAR ESTE BOTÓN DE DISPONIBILIDAD */}
                                        <button
                                            onClick={() =>
                                                toggleDisponibilidad(plato.id)
                                            }
                                            className={`flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                                                plato.disponible
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                        >
                                            {plato.disponible ? (
                                                <>
                                                    <Check className="h-3 w-3" />
                                                    Disponible
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-3 w-3" />
                                                    No disponible
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEtiquetaActual(plato);
                                                setModalEtiquetaAbierto(true);
                                            }}
                                            className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <Tag className="h-3 w-3" /> Etiqueta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {platosFiltrados.length === 0 && (
                    <div className="py-10 text-center text-cocoa-soft">
                        No hay platos que coincidan con los filtros
                    </div>
                )}

                {/* ===== PANEL DERECHO (Resumen) ===== */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <p className="text-xs font-semibold text-cocoa-soft uppercase">
                            Activos
                        </p>
                        <p className="mt-1 text-3xl font-bold text-chocolate">
                            {resumen.activos}
                        </p>
                        <p className="mt-1 text-sm text-green-600">
                            Disponibles ahora
                        </p>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <p className="text-xs font-semibold text-cocoa-soft uppercase">
                            Agotados
                        </p>
                        <p className="mt-1 text-3xl font-bold text-chocolate">
                            {resumen.agotados}
                        </p>
                        <p className="mt-1 text-sm text-red-500">
                            Reponer stock
                        </p>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <p className="text-xs font-semibold text-cocoa-soft uppercase">
                            Categorías
                        </p>
                        <p className="mt-1 text-3xl font-bold text-chocolate">
                            {resumen.categorias}
                        </p>
                        <p className="mt-1 text-sm text-cocoa">
                            En uso actualmente
                        </p>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <p className="text-xs font-semibold text-cocoa-soft uppercase">
                            Stock Total
                        </p>
                        <p className="mt-1 text-3xl font-bold text-chocolate">
                            {resumen.stockTotal}
                        </p>
                        <p className="mt-1 text-sm text-green-600">
                            Unidades disponibles
                        </p>
                    </div>
                </div>

                {/* ===== MÁS VENDIDOS Y TOP CATEGORÍAS ===== */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-chocolate">
                                Más vendidos
                            </h3>
                            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
                                Top 4
                            </span>
                        </div>
                        <div className="space-y-3">
                            {topProductos.map((p, i) => (
                                <div key={p.id}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-chocolate">
                                            {i + 1}. {p.nombre}
                                        </span>
                                        <span className="text-xs text-cocoa-soft">
                                            {p.vendidos} vendidos
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-sand">
                                        <div
                                            className="h-2 rounded-full bg-gold"
                                            style={{
                                                width: `${((p.vendidos / maxVendidos) * 100).toFixed(0)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-chocolate">
                                Top categorías
                            </h3>
                            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-cocoa">
                                Por ventas
                            </span>
                        </div>
                        <div className="space-y-3">
                            {topCategorias.map(([categoria, ventas]) => (
                                <div key={categoria}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-chocolate">
                                            {categoria}
                                        </span>
                                        <span className="text-xs text-cocoa-soft">
                                            {ventas} vendidos
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-sand">
                                        <div
                                            className="h-2 rounded-full bg-gold"
                                            style={{
                                                width: `${((ventas / maxCategoriaVentas) * 100).toFixed(0)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* MODAL: Nuevo/Editar Plato - REDISEÑADO */}
                {/* ============================================================ */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-2xl animate-in overflow-hidden rounded-3xl bg-card shadow-2xl duration-300 zoom-in-95">
                            {/* HEADER con gradiente */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-roast to-espresso px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-lg">
                                        <Plus className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {esEdicion
                                                ? 'Editar Plato'
                                                : 'Nuevo Plato'}
                                        </h2>
                                        <p className="text-xs text-white/60">
                                            {esEdicion
                                                ? 'Actualiza la información del plato'
                                                : 'Agrega un nuevo plato al menú'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* BODY con scroll */}
                            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        {/* Nombre */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                Nombre del plato
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                                    value={formulario.nombre}
                                                    onChange={(e) =>
                                                        setFormulario({
                                                            ...formulario,
                                                            nombre: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Ej: Cappuccino"
                                                />
                                            </div>
                                        </div>

                                        {/* Categoría */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                Categoría
                                            </label>
                                            <select
                                                className="w-full appearance-none rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                                value={formulario.categoria}
                                                onChange={(e) =>
                                                    setFormulario({
                                                        ...formulario,
                                                        categoria:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="Bebidas">
                                                    Bebidas
                                                </option>
                                                <option value="Postres">
                                                    Postres
                                                </option>
                                                <option value="Sandwiches">
                                                    Sandwiches
                                                </option>
                                                <option value="Desayunos">
                                                    Desayunos
                                                </option>
                                            </select>
                                        </div>

                                        {/* Descripción */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                Descripción
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                                value={formulario.descripcion}
                                                onChange={(e) =>
                                                    setFormulario({
                                                        ...formulario,
                                                        descripcion:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Breve descripción del plato"
                                            />
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        {/* Precio y Stock */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                    Precio (S/)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-gold">
                                                        S/
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft py-3 pr-4 pl-10 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                                        value={
                                                            formulario.precio ===
                                                            0
                                                                ? ''
                                                                : formulario.precio
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value.replace(
                                                                    /[^0-9.]/g,
                                                                    '',
                                                                );
                                                            // Permitir solo un punto decimal
                                                            const parts =
                                                                value.split(
                                                                    '.',
                                                                );

                                                            if (
                                                                parts.length > 2
                                                            ) {
                                                                return;
                                                            }

                                                            // Limitar a 2 decimales
                                                            if (
                                                                parts[1] &&
                                                                parts[1]
                                                                    .length > 2
                                                            ) {
                                                                return;
                                                            }

                                                            setFormulario({
                                                                ...formulario,
                                                                precio:
                                                                    value === ''
                                                                        ? 0
                                                                        : parseFloat(
                                                                              value,
                                                                          ),
                                                            });
                                                        }}
                                                        onBlur={() => {
                                                            // Formatear al perder el foco
                                                            if (
                                                                formulario.precio >
                                                                0
                                                            ) {
                                                                setFormulario({
                                                                    ...formulario,
                                                                    precio: parseFloat(
                                                                        formulario.precio.toFixed(
                                                                            2,
                                                                        ),
                                                                    ),
                                                                });
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                    Stock
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                                    value={formulario.stock}
                                                    onChange={(e) =>
                                                        setFormulario({
                                                            ...formulario,
                                                            stock:
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                        })
                                                    }
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Imagen - Pegar con Ctrl+V */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                                Imagen
                                            </label>

                                            <div className="relative">
                                                <div
                                                    className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
                                                        previewImagen ||
                                                        formulario.imagen
                                                            ? 'border-gold bg-cream'
                                                            : 'border-wheat bg-cream-soft hover:border-gold hover:bg-cream'
                                                    }`}
                                                    onPaste={(e) => {
                                                        const items =
                                                            e.clipboardData
                                                                ?.items;

                                                        if (!items) {
                                                            return;
                                                        }

                                                        for (const item of items) {
                                                            if (
                                                                item.type.startsWith(
                                                                    'image/',
                                                                )
                                                            ) {
                                                                const file =
                                                                    item.getAsFile();

                                                                if (file) {
                                                                    setImagenFile(
                                                                        file,
                                                                    );
                                                                    setPreviewImagen(
                                                                        URL.createObjectURL(
                                                                            file,
                                                                        ),
                                                                    );
                                                                }

                                                                break;
                                                            }
                                                        }
                                                    }}
                                                    onClick={() => {
                                                        // Si no hay imagen, abrir selector de archivos
                                                        if (
                                                            !previewImagen &&
                                                            !formulario.imagen
                                                        ) {
                                                            document
                                                                .getElementById(
                                                                    'fileInput',
                                                                )
                                                                ?.click();
                                                        }
                                                    }}
                                                >
                                                    {previewImagen ||
                                                    formulario.imagen ? (
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={
                                                                    previewImagen ||
                                                                    formulario.imagen
                                                                }
                                                                alt="Vista previa"
                                                                className="h-20 w-20 rounded-lg border-2 border-gold object-cover"
                                                            />
                                                            <div className="flex-1 text-left">
                                                                <p className="text-sm font-medium text-chocolate">
                                                                    Imagen
                                                                    cargada
                                                                </p>
                                                                <p className="text-xs text-cocoa-soft">
                                                                    Haz clic
                                                                    para cambiar
                                                                    o presiona
                                                                    Ctrl+V para
                                                                    pegar otra
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setPreviewImagen(
                                                                        '',
                                                                    );
                                                                    setImagenFile(
                                                                        null,
                                                                    );
                                                                    setFormulario(
                                                                        {
                                                                            ...formulario,
                                                                            imagen: '',
                                                                        },
                                                                    );
                                                                }}
                                                                className="p-1 text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="mb-2">
                                                                <ImageIcon className="mx-auto h-12 w-12 text-cocoa-soft" />
                                                            </div>
                                                            <p className="text-sm font-medium text-chocolate">
                                                                Presiona{' '}
                                                                <kbd className="rounded bg-wheat px-2 py-0.5 text-xs font-bold">
                                                                    Ctrl + V
                                                                </kbd>{' '}
                                                                para pegar una
                                                                imagen
                                                            </p>
                                                            <p className="mt-1 text-xs text-cocoa-soft">
                                                                O haz clic para
                                                                seleccionar un
                                                                archivo
                                                            </p>
                                                            <p className="mt-2 text-[10px] text-cocoa-soft">
                                                                JPG, PNG, WEBP ·
                                                                Max 2MB
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Input file oculto para seleccionar archivo */}
                                                <input
                                                    id="fileInput"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];

                                                        if (file) {
                                                            setImagenFile(file);
                                                            setPreviewImagen(
                                                                URL.createObjectURL(
                                                                    file,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER con botones */}
                            <div className="flex justify-end gap-3 border-t border-sand bg-cream-soft/50 px-6 py-4">
                                <button
                                    type="submit"
                                    className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarPlato}
                                    className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg"
                                >
                                    <Check className="h-4 w-4" />
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: Ver Plato */}
                {/* ============================================================ */}
                {modalVerAbierto && platoSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <h2 className="text-2xl font-bold text-chocolate">
                                    Detalle del Plato
                                </h2>
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="text-3xl text-cocoa-soft transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-cream-grain">
                                    {platoSeleccionado.imagen ? (
                                        <img
                                            src={platoSeleccionado.imagen}
                                            alt={platoSeleccionado.nombre}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-6xl">
                                            {platoSeleccionado.emoji || '🍽️'}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Nombre
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {platoSeleccionado.nombre}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Categoría
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {platoSeleccionado.categoria}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Precio
                                        </p>
                                        <p className="font-semibold text-gold">
                                            {formatCurrency(
                                                platoSeleccionado.precio,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Estado
                                        </p>
                                        <span
                                            className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${
                                                platoSeleccionado.stock > 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-600'
                                            }`}
                                        >
                                            {platoSeleccionado.stock > 0
                                                ? 'Disponible'
                                                : 'Agotado'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Stock
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {platoSeleccionado.stock}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Vendidos
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {platoSeleccionado.vendidos}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-cocoa-soft">
                                            Descripción
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {platoSeleccionado.descripcion ||
                                                '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-sand p-6">
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="rounded-xl bg-sand px-5 py-2.5 font-semibold transition hover:bg-wheat"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: Generar Etiqueta */}
                {/* ============================================================ */}
                {modalEtiquetaAbierto && etiquetaActual && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <h2 className="text-2xl font-bold text-chocolate">
                                    Etiqueta
                                </h2>
                                <button
                                    onClick={() =>
                                        setModalEtiquetaAbierto(false)
                                    }
                                    className="text-3xl text-cocoa-soft transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="rounded-xl border-2 border-dashed border-wheat bg-cream-soft p-6 text-center">
                                    <h3 className="mb-4 text-2xl font-extrabold text-gold">
                                        DOLCE CAFE
                                    </h3>
                                    <p className="mb-2 text-lg font-semibold">
                                        {etiquetaActual.nombre}
                                    </p>
                                    <p className="mb-4 text-3xl font-extrabold text-green-600">
                                        S/{' '}
                                        {typeof etiquetaActual.precio ===
                                        'number'
                                            ? etiquetaActual.precio.toFixed(2)
                                            : parseFloat(
                                                  etiquetaActual.precio || 0,
                                              ).toFixed(2)}
                                    </p>
                                    <hr className="mb-3 border-sand" />
                                    <p className="text-sm tracking-wide text-cocoa">
                                        {etiquetaActual.id
                                            ? `ETQ-${String(etiquetaActual.id).padStart(3, '0')}`
                                            : 'ETQ-001'}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-col gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700"
                                    >
                                        Imprimir
                                    </button>
                                    <button
                                        onClick={() => {
                                            alert(
                                                'Descargando PDF... (Función pendiente)',
                                            );
                                        }}
                                        className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700"
                                    >
                                        Descargar PDF
                                    </button>
                                    <button
                                        onClick={() =>
                                            setModalEtiquetaAbierto(false)
                                        }
                                        className="w-full rounded-xl bg-sand py-3 font-bold text-chocolate transition hover:bg-wheat"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
