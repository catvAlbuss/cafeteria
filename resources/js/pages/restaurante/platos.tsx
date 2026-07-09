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
    ChefHat
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
}

export default function Platos() {
    // 📋 Recibir platos desde el controlador
    const { platos: platosIniciales = [] } = usePage<{ platos: Plato[] }>().props;
    
    // 📋 Estado - usar datos del controlador
    const [platos, setPlatos] = useState<Plato[]>(platosIniciales);
    
    // 📋 Estado del modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [platoSeleccionado, setPlatoSeleccionado] = useState<Plato | null>(null);
    const [esEdicion, setEsEdicion] = useState(false);

    // 📋 Estado del formulario
    const [formulario, setFormulario] = useState({
        id: '',
        nombre: '',
        categoria: 'Bebidas',
        descripcion: '',
        precio: 0,
        stock: 0,
        imagen: '',
        emoji: '🍽️'
    });
    const [modalEtiquetaAbierto, setModalEtiquetaAbierto] = useState(false);
    const [etiquetaActual, setEtiquetaActual] = useState<Plato | null>(null);

    // 📋 Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [ordenPor, setOrdenPor] = useState('');

    // 📊 Filtrar y ordenar platos
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

    // 📊 Resumen
    const resumen = {
        activos: platos.filter(p => p.stock > 0).length,
        agotados: platos.filter(p => p.stock === 0).length,
        categorias: new Set(platos.map(p => p.categoria)).size,
        stockTotal: platos.reduce((sum, p) => sum + p.stock, 0),
    };

    // 📊 Top productos
    const topProductos = [...platos].sort((a, b) => b.vendidos - a.vendidos).slice(0, 4);
    const maxVendidos = topProductos.length ? topProductos[0].vendidos : 1;

    // 📊 Top categorías
    const categoriasTotales: Record<string, number> = {};
    platos.forEach(p => {
        categoriasTotales[p.categoria] = (categoriasTotales[p.categoria] || 0) + p.vendidos;
    });
    const topCategorias = Object.entries(categoriasTotales).sort((a, b) => b[1] - a[1]);
    const maxCategoriaVentas = topCategorias.length ? topCategorias[0][1] : 1;

    // 📋 Funciones CRUD
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
            emoji: '🍽️'
        });
        setModalAbierto(true);
    };

    const abrirEditar = (plato: Plato) => {
        setEsEdicion(true);
        setFormulario({ ...plato });
        setModalAbierto(true);
    };

    // ✅ Guardar plato (crear/editar) con Inertia
    const guardarPlato = () => {
        if (!formulario.nombre || formulario.precio < 0 || formulario.stock < 0) {
            alert('Complete todos los campos correctamente.');
            return;
        }

        const url = esEdicion ? `/platos/${formulario.id}` : '/platos';
        const method = esEdicion ? 'put' : 'post';

        router[method](url, formulario, {
            onSuccess: () => {
                setModalAbierto(false);
                router.reload(); // Recargar para ver cambios
            },
            onError: (errors) => {
                alert('Error al guardar: ' + Object.values(errors).join(' '));
            }
        });
    };

    // ✅ Eliminar plato con Inertia
    const eliminarPlato = (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este plato?')) return;
        
        router.delete(`/platos/${id}`, {
            onSuccess: () => {
                router.reload();
            },
            onError: (errors) => {
                alert('Error al eliminar: ' + Object.values(errors).join(' '));
            }
        });
    };

    const verPlato = (plato: Plato) => {
        setPlatoSeleccionado(plato);
        setModalVerAbierto(true);
    };

    // 📋 Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2)}`;
    };

    return (
        <>
            <Head title="Platos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">🍽️ Platos</h1>
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
                {/* MODAL: Nuevo/Editar Plato */}
                {/* ============================================================ */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">
                                    {esEdicion ? 'Editar Plato' : 'Nuevo Plato'}
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
                                    <label className="text-sm text-gray-500 font-medium">Nombre</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.nombre}
                                        onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                                        placeholder="Ej: Cappuccino"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Categoría</label>
                                    <select
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.categoria}
                                        onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                                    >
                                        <option value="Bebidas">Bebidas</option>
                                        <option value="Postres">Postres</option>
                                        <option value="Sandwiches">Sandwiches</option>
                                        <option value="Desayunos">Desayunos</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Descripción</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.descripcion}
                                        onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                                        placeholder="Breve descripción del plato"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 font-medium">Precio (S/)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                            value={formulario.precio}
                                            onChange={(e) => setFormulario({ ...formulario, precio: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 font-medium">Stock</label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                            value={formulario.stock}
                                            onChange={(e) => setFormulario({ ...formulario, stock: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">URL de imagen</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.imagen}
                                        onChange={(e) => setFormulario({ ...formulario, imagen: e.target.value })}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <span className="text-sm text-gray-500">Emoji:</span>
                                    <input
                                        type="text"
                                        className="w-16 border border-gray-200 rounded-xl p-2 text-center text-2xl focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formulario.emoji}
                                        onChange={(e) => setFormulario({ ...formulario, emoji: e.target.value || '🍽️' })}
                                        maxLength={2}
                                    />
                                    <span className="text-xs text-gray-400">(opcional, si no hay imagen)</span>
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
                                    onClick={guardarPlato}
                                    className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl font-semibold transition"
                                >
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
                                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                                            platoSeleccionado.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
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