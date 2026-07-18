import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
    Check
} from 'lucide-react';

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

const toArray = <T,>(value: T[] | { data?: T[] } | Record<string, T> | null | undefined): T[] => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray((value as { data?: T[] }).data)) return (value as { data: T[] }).data;
    if (value && typeof value === 'object') return Object.values(value as Record<string, T>);
    return [];
};

export default function Platos() {
    //  Recibir platos desde el controlador
    const { platos: platosIniciales = [] } = usePage<{ platos: Plato[] | { data?: Plato[] } | Record<string, Plato> }>().props;

    //  Estado - usar datos del controlador
    const [platos, setPlatos] = useState<Plato[]>(() => toArray<Plato>(platosIniciales));

    //  Estado del modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [platoSeleccionado, setPlatoSeleccionado] = useState<Plato | null>(null);
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
    //  Archivo real de la imagen a subir (se envía como multipart, nunca como base64)
    const [imagenFile, setImagenFile] = useState<File | null>(null);

    //  Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [ordenPor, setOrdenPor] = useState('');

    //  Filtrar y ordenar platos
    const platosFiltrados = platos
        .filter(p => {
            const catOk = !filtroCategoria || p.categoria === filtroCategoria;
            const estadoOk = !filtroEstado || (filtroEstado === 'Disponible' ? p.stock > 0 : p.stock === 0);
            return catOk && estadoOk;
        })
        .sort((a, b) => {
            if (ordenPor === 'vendidos') return b.vendidos - a.vendidos;
            if (ordenPor === 'precio') return a.precio - b.precio;
            if (ordenPor === 'stock') return b.stock - a.stock;
            return 0;
        });

    //  Resumen
    const resumen = {
        activos: platos.filter(p => p.stock > 0).length,
        agotados: platos.filter(p => p.stock === 0).length,
        categorias: new Set(platos.map(p => p.categoria)).size,
        stockTotal: platos.reduce((sum, p) => sum + p.stock, 0),
    };

    // Top productos
    const topProductos = [...platos].sort((a, b) => b.vendidos - a.vendidos).slice(0, 4);
    const maxVendidos = topProductos.length ? topProductos[0].vendidos : 1;

    //  Top categorías
    const categoriasTotales: Record<string, number> = {};
    platos.forEach(p => {
        categoriasTotales[p.categoria] = (categoriasTotales[p.categoria] || 0) + p.vendidos;
    });
    const topCategorias = Object.entries(categoriasTotales).sort((a, b) => b[1] - a[1]);
    const maxCategoriaVentas = topCategorias.length ? topCategorias[0][1] : 1;

    //  Funciones CRUD
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
        if (!formulario.nombre || formulario.precio < 0 || formulario.stock < 0) {
            alert('Complete todos los campos correctamente.');
            return;
        }

        const url = esEdicion ? `/platos/${formulario.id}` : '/platos';
        // Nunca mandamos 'imagen' como string: o va el archivo real (multipart),
        // o no se manda y el backend conserva la imagen existente.
        const { imagen: _imagen, ...datosSinImagen } = formulario;
        void _imagen;
        const datos: Record<string, unknown> = { ...datosSinImagen };
        if (imagenFile) {
            datos.imagen = imagenFile;
        }

        const opciones = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setModalAbierto(false);
                router.reload({ only: ['platos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors: Record<string, string>) => {
                alert('Error al guardar: ' + Object.values(errors).join(' '));
            }
        } as Parameters<typeof router.post>[2];

        if (esEdicion) {
            // Las requests con archivos no soportan PUT nativo: se manda por POST
            // con spoofing de método (recomendación oficial de Inertia).
            router.post(url, { ...datos, _method: 'put' }, opciones);
        } else {
            router.post(url, datos, opciones);
        }
    };

    //  Eliminar plato con Inertia
    const eliminarPlato = (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este plato?')) return;

        const platosAnteriores = platos;
        // Actualización optimista: desaparece de inmediato de la grilla
        setPlatos(prev => prev.filter(p => p.id !== id));

        router.delete(`/platos/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['platos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors) => {
                setPlatos(platosAnteriores); // revertir si falla
                alert('Error al eliminar: ' + Object.values(errors).join(' '));
            }
        } as Parameters<typeof router.delete>[1]);
    };
    //  Cambiar disponibilidad del plato
    const toggleDisponibilidad = (id: string) => {
        const plato = platos.find(p => p.id === id);
        if (!plato) return;

        // Actualización optimista
        setPlatos(prev => prev.map(p =>
            p.id === id ? { ...p, disponible: !p.disponible } : p
        ));

        router.patch(`/platos/${id}/disponibilidad`, {
            disponible: !plato.disponible
        }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['platos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors) => {
                // Revertir si falla
                setPlatos(prev => prev.map(p =>
                    p.id === id ? { ...p, disponible: plato.disponible } : p
                ));
                alert('Error al cambiar disponibilidad: ' + Object.values(errors).join(' '));
            }
        });
    };

    const verPlato = (plato: Plato) => {
        setPlatoSeleccionado(plato);
        setModalVerAbierto(true);
    };

    // Formatear moneda
    const formatCurrency = (amount: number | string): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    };

    useEffect(() => {
        setPlatos(toArray<Plato>(platosIniciales));
    }, [platosIniciales]);

    return (
        <>
            <Head title="Platos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">Platos</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión del menú de la cafetería</p>
                    </div>
                    <button
                        onClick={abrirNuevo}
                        className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Plato
                    </button>
                </div>

                {/* ===== FILTROS ===== */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <select
                            className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
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
                            className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Disponible">Disponible</option>
                            <option value="Agotado">Agotado</option>
                        </select>

                        <select
                            className="border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white"
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
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl font-semibold transition text-sm"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== CONTADOR Y GRID ===== */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="bg-[#F3E1C8] text-[#5A3D2B] px-4 py-2 rounded-xl font-semibold text-sm">
                            {platosFiltrados.length} Productos
                        </span>
                    </div>
                </div>

                {/* ===== GRID DE PLATOS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {platosFiltrados.map((plato) => {
                        const estado = plato.stock > 0 ? 'Disponible' : 'Agotado';
                        const estadoClase = plato.stock > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600';

                        return (
                            <div
                                key={plato.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#F3E1C8] group"
                            >
                                <div className="h-36 bg-[#F8EEE1] flex items-center justify-center overflow-hidden">
                                    {plato.imagen ? (
                                        <img
                                            src={plato.imagen}
                                            alt={plato.nombre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : (
                                        <span className="text-5xl">{plato.emoji || '🍽️'}</span>
                                    )}
                                    <span className="hidden text-5xl">{plato.emoji || '🍽️'}</span>
                                </div>

                                <div className="p-4">
                                    <span className="inline-block bg-[#F3E1C8] text-[#5A3D2B] text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2">
                                        {plato.categoria}
                                    </span>
                                    <h3 className="text-lg font-bold text-[#2D1B1A]">{plato.nombre}</h3>
                                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{plato.descripcion}</p>

                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-xl font-bold text-[#C9A96E]">{formatCurrency(plato.precio)}</span>
                                        <span className={`${estadoClase} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                                            {estado}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>Stock: {plato.stock}</span>
                                        <span>Vendidos: {plato.vendidos}</span>
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <button
                                            onClick={() => verPlato(plato)}
                                            className="w-full bg-[#C9A96E] hover:bg-[#B8975D] text-white py-1.5 rounded-lg text-sm font-semibold transition"
                                        >
                                            Ver
                                        </button>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                onClick={() => abrirEditar(plato)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                                            >
                                                <Edit className="w-3 h-3" /> Editar
                                            </button>
                                            <button
                                                onClick={() => eliminarPlato(plato.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Eliminar
                                            </button>
                                        </div>

                                        {/*  AGREGAR ESTE BOTÓN DE DISPONIBILIDAD */}
                                        <button
                                            onClick={() => toggleDisponibilidad(plato.id)}
                                            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${plato.disponible
                                                ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                                                }`}
                                        >
                                            {plato.disponible ? (
                                                <>
                                                    <Check className="w-3 h-3" />
                                                    Disponible
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-3 h-3" />
                                                    No disponible
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEtiquetaActual(plato);
                                                setModalEtiquetaAbierto(true);
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                                        >
                                            <Tag className="w-3 h-3" /> Etiqueta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {platosFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        No hay platos que coincidan con los filtros
                    </div>
                )}

                {/* ===== PANEL DERECHO (Resumen) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Activos</p>
                        <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{resumen.activos}</p>
                        <p className="text-green-600 text-sm mt-1">Disponibles ahora</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Agotados</p>
                        <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{resumen.agotados}</p>
                        <p className="text-red-500 text-sm mt-1">Reponer stock</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Categorías</p>
                        <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{resumen.categorias}</p>
                        <p className="text-gray-500 text-sm mt-1">En uso actualmente</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Stock Total</p>
                        <p className="text-3xl font-bold text-[#2D1B1A] mt-1">{resumen.stockTotal}</p>
                        <p className="text-green-600 text-sm mt-1">Unidades disponibles</p>
                    </div>
                </div>

                {/* ===== MÁS VENDIDOS Y TOP CATEGORÍAS ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-[#2D1B1A]">🏆 Más vendidos</h3>
                            <span className="bg-[#F3E1C8] text-[#5A3D2B] text-xs font-semibold px-3 py-1 rounded-full">Top 4</span>
                        </div>
                        <div className="space-y-3">
                            {topProductos.map((p, i) => (
                                <div key={p.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold text-gray-700">{i + 1}. {p.nombre}</span>
                                        <span className="text-xs text-gray-400">{p.vendidos} vendidos</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-[#C9A96E] h-2 rounded-full"
                                            style={{ width: `${(p.vendidos / maxVendidos * 100).toFixed(0)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-[#2D1B1A]">📊 Top categorías</h3>
                            <span className="bg-[#F3E1C8] text-[#5A3D2B] text-xs font-semibold px-3 py-1 rounded-full">Por ventas</span>
                        </div>
                        <div className="space-y-3">
                            {topCategorias.map(([categoria, ventas]) => (
                                <div key={categoria}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold text-gray-700">{categoria}</span>
                                        <span className="text-xs text-gray-400">{ventas} vendidos</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-[#C9A96E] h-2 rounded-full"
                                            style={{ width: `${(ventas / maxCategoriaVentas * 100).toFixed(0)}%` }}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">

                            {/* HEADER con gradiente */}
                            <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#C9A96E] rounded-xl flex items-center justify-center shadow-lg">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {esEdicion ? '✏️ Editar Plato' : '✨ Nuevo Plato'}
                                        </h2>
                                        <p className="text-gray-300 text-xs">
                                            {esEdicion ? 'Actualiza la información del plato' : 'Agrega un nuevo plato al menú'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* BODY con scroll */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        {/* Nombre */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                Nombre del plato
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                                    value={formulario.nombre}
                                                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                                                    placeholder="Ej: Cappuccino"
                                                />
                                            </div>
                                        </div>

                                        {/* Categoría */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                Categoría
                                            </label>
                                            <select
                                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white appearance-none"
                                                value={formulario.categoria}
                                                onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                                            >
                                                <option value="Bebidas">☕ Bebidas</option>
                                                <option value="Postres">🍰 Postres</option>
                                                <option value="Sandwiches">🥪 Sandwiches</option>
                                                <option value="Desayunos">🍳 Desayunos</option>
                                            </select>
                                        </div>

                                        {/* Descripción */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                Descripción
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                                value={formulario.descripcion}
                                                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                                                placeholder="Breve descripción del plato"
                                            />
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        {/* Precio y Stock */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                    Precio (S/)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A96E] font-bold">S/</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                                        value={formulario.precio === 0 ? '' : formulario.precio}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                                            // Permitir solo un punto decimal
                                                            const parts = value.split('.');
                                                            if (parts.length > 2) return;
                                                            // Limitar a 2 decimales
                                                            if (parts[1] && parts[1].length > 2) return;
                                                            setFormulario({
                                                                ...formulario,
                                                                precio: value === '' ? 0 : parseFloat(value)
                                                            });
                                                        }}
                                                        onBlur={() => {
                                                            // Formatear al perder el foco
                                                            if (formulario.precio > 0) {
                                                                setFormulario({
                                                                    ...formulario,
                                                                    precio: parseFloat(formulario.precio.toFixed(2))
                                                                });
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                    Stock
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                                    value={formulario.stock}
                                                    onChange={(e) => setFormulario({ ...formulario, stock: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Imagen - Pegar con Ctrl+V */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                                Imagen
                                            </label>

                                            <div className="relative">
                                                <div
                                                    className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${previewImagen || formulario.imagen
                                                        ? 'border-[#C9A96E] bg-[#FBF7F0]'
                                                        : 'border-gray-300 bg-gray-50 hover:border-[#C9A96E] hover:bg-[#FBF7F0]'
                                                        }`}
                                                    onPaste={(e) => {
                                                        const items = e.clipboardData?.items;
                                                        if (!items) return;

                                                        for (const item of items) {
                                                            if (item.type.startsWith('image/')) {
                                                                const file = item.getAsFile();
                                                                if (file) {
                                                                    setImagenFile(file);
                                                                    setPreviewImagen(URL.createObjectURL(file));
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }}
                                                    onClick={() => {
                                                        // Si no hay imagen, abrir selector de archivos
                                                        if (!previewImagen && !formulario.imagen) {
                                                            document.getElementById('fileInput')?.click();
                                                        }
                                                    }}
                                                >
                                                    {previewImagen || formulario.imagen ? (
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={previewImagen || formulario.imagen}
                                                                alt="Vista previa"
                                                                className="w-20 h-20 rounded-lg object-cover border-2 border-[#C9A96E]"
                                                            />
                                                            <div className="text-left flex-1">
                                                                <p className="text-sm font-medium text-[#2D1B1A]">
                                                                    Imagen cargada ✅
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    Haz clic para cambiar o presiona Ctrl+V para pegar otra
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPreviewImagen('');
                                                                    setImagenFile(null);
                                                                    setFormulario({ ...formulario, imagen: '' });
                                                                }}
                                                                className="text-red-500 hover:text-red-700 p-1"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-4xl mb-2">🖼️</div>
                                                            <p className="text-sm font-medium text-[#2D1B1A]">
                                                                Presiona <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs font-bold">Ctrl + V</kbd> para pegar una imagen
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                O haz clic para seleccionar un archivo
                                                            </p>
                                                            <p className="text-[10px] text-gray-300 mt-2">
                                                                JPG, PNG, WEBP · Max 2MB
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
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setImagenFile(file);
                                                            setPreviewImagen(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* FOOTER con botones */}
                            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarPlato}
                                    className="px-6 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    <Check className="w-4 h-4" />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">Detalle del Plato</h2>
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="h-48 rounded-xl overflow-hidden bg-[#F8EEE1] flex items-center justify-center">
                                    {platoSeleccionado.imagen ? (
                                        <img
                                            src={platoSeleccionado.imagen}
                                            alt={platoSeleccionado.nombre}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-6xl">{platoSeleccionado.emoji || '🍽️'}</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Nombre</p>
                                        <p className="font-semibold text-[#2D1B1A]">{platoSeleccionado.nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Categoría</p>
                                        <p className="font-semibold text-[#2D1B1A]">{platoSeleccionado.categoria}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Precio</p>
                                        <p className="font-semibold text-[#C9A96E]">{formatCurrency(platoSeleccionado.precio)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Estado</p>
                                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${platoSeleccionado.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {platoSeleccionado.stock > 0 ? 'Disponible' : 'Agotado'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Stock</p>
                                        <p className="font-semibold text-[#2D1B1A]">{platoSeleccionado.stock}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Vendidos</p>
                                        <p className="font-semibold text-[#2D1B1A]">{platoSeleccionado.vendidos}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400">Descripción</p>
                                        <p className="font-semibold text-[#2D1B1A]">{platoSeleccionado.descripcion || '-'}</p>
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

                {/* ============================================================ */}
                {/* MODAL: Generar Etiqueta */}
                {/* ============================================================ */}
                {modalEtiquetaAbierto && etiquetaActual && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">🏷️ Etiqueta</h2>
                                <button
                                    onClick={() => setModalEtiquetaAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                                    <h3 className="text-[#C9A96E] text-2xl font-extrabold mb-4">DOLCE CAFE</h3>
                                    <p className="text-lg font-semibold mb-2">{etiquetaActual.nombre}</p>
                                    <p className="text-green-600 text-3xl font-extrabold mb-4">
                                        S/ {etiquetaActual.precio.toFixed(2)}
                                    </p>
                                    <hr className="border-gray-200 mb-3" />
                                    <p className="text-gray-500 text-sm tracking-wide">
                                        {etiquetaActual.id ? `ETQ-${String(etiquetaActual.id).padStart(3, '0')}` : 'ETQ-001'}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-col gap-3">
                                    <button
                                        onClick={() => window.print()}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                                    >
                                        🖨️ Imprimir
                                    </button>
                                    <button
                                        onClick={() => {
                                            alert('📄 Descargando PDF... (Función pendiente)');
                                        }}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                                    >
                                        📄 Descargar PDF
                                    </button>
                                    <button
                                        onClick={() => setModalEtiquetaAbierto(false)}
                                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition"
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
