import { Head, usePage, router } from '@inertiajs/react';

import ModalInsumo from '@/components/modals/ModalInsumo';
import { useState, useMemo } from 'react';
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
    BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

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
}

const categoriaIconos: Record<string, any> = {
    'Cafetería': Coffee,
    'Lácteos': Milk,
    'Panadería': Wheat,
    'Frutas': Apple,
    'Huevos': Egg,
    'Dulces': Package,
    'Bebidas': Coffee,
    'Especias': Tag,
    'Frutas Secas': Box,
};

const categoriaColores: Record<string, string> = {
    'Cafetería': 'bg-amber-100 text-amber-700 border-amber-200',
    'Lácteos': 'bg-blue-100 text-blue-700 border-blue-200',
    'Panadería': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Frutas': 'bg-green-100 text-green-700 border-green-200',
    'Huevos': 'bg-orange-100 text-orange-700 border-orange-200',
    'Dulces': 'bg-pink-100 text-pink-700 border-pink-200',
    'Bebidas': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Especias': 'bg-purple-100 text-purple-700 border-purple-200',
    'Frutas Secas': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function Insumos() {
    const { insumos, userRole } = usePage().props as any; // 
    const [insumosData, setInsumosData] = useState<Insumo[]>(insumos || []);


    const CATEGORIAS_COCINA = ['Panadería', 'Frutas', 'Huevos', 'Dulces', 'Especias', 'Frutas Secas'];
    const CATEGORIAS_BAR = ['Cafetería', 'Lácteos', 'Bebidas'];


    const insumosFiltradosPorRol = useMemo(() => {
        if (userRole === 'Cocinero') {
            return insumosData.filter(i => CATEGORIAS_COCINA.includes(i.categoria));
        }
        if (userRole === 'Bar') {
            return insumosData.filter(i => CATEGORIAS_BAR.includes(i.categoria));
        }
        return insumosData;
    }, [insumosData, userRole]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
    const [modalMermaAbierto, setModalMermaAbierto] = useState(false);
    const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);
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

    const [formCompra, setFormCompra] = useState({ cantidad: 0, observaciones: '' });
    const [formMerma, setFormMerma] = useState({ cantidad: 0, observaciones: '' });
    const [motivoMerma, setMotivoMerma] = useState('');
    const [cargandoMerma, setCargandoMerma] = useState(false);

    const totalInsumos = insumosData.length;
    const totalStock = insumosData.reduce((sum, i) => sum + i.stock, 0);
    const totalValor = insumosData.reduce((sum, i) => sum + (i.stock * i.precio), 0);
    const insumosBajos = insumosData.filter(i => i.stock < 5).length;
    const categorias = [...new Set(insumosData.map(i => i.categoria))].filter(Boolean);

    const formatCurrency = (amount: any) => {
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return 'S/ 0.00';
        return `S/ ${num.toFixed(2)}`;
    };

    const formatNumber = (num: any) => {
        const n = typeof num === 'number' ? num : parseFloat(num);
        if (isNaN(n)) return '0';
        return n.toLocaleString('es-PE');
    };

    const getCategoriaIcon = (categoria: string) => {
        return categoriaIconos[categoria] || Package;
    };

    const getCategoriaColor = (categoria: string) => {
        return categoriaColores[categoria] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const insumosFiltrados = insumosFiltradosPorRol.filter(i => {
        const busquedaOk = !busqueda ||
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
        setInsumosData(prev => prev.filter(i => i.id !== insumo.id));
        toast.success('Insumo eliminado');
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
            onSuccess: () => {
                setModalCompraAbierto(false);
                toast.success('✅ Compra registrada');
                router.reload();
            },
            onError: (errors) => {
                toast.error('Error: ' + Object.values(errors).join(' '));
            }
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

        router.post('/mermas', {
            items: [{
                id: insumoSeleccionado.id,
                tipo: 'insumo',
                nombre: insumoSeleccionado.nombre,
                cantidad: formMerma.cantidad,
                motivo: motivoMerma,
            }],
            observaciones: formMerma.observaciones || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setModalMermaAbierto(false);
                setFormMerma({ cantidad: 0, observaciones: '' });
                setMotivoMerma('');
                setCargandoMerma(false);
                toast.success('✅ Merma registrada correctamente');
                router.reload();
            },
            onError: (errors) => {
                setCargandoMerma(false);
                toast.error('Error: ' + Object.values(errors).join(' '));
            },
        } as Parameters<typeof router.post>[2]);
    };

    return (
        <>
            <Head title="Insumos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-[#FBF3E7]">

                {/* HEADER con gradiente */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] p-6 md:p-8">
                    <div className="absolute right-0 top-0 opacity-10">
                        <Package className="w-64 h-64 text-white" />
                    </div>
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="bg-[#C9A96E] p-2 rounded-xl">
                                    <Package className="w-6 h-6 text-white" />
                                </span>
                                Insumos
                            </h1>
                            <p className="text-white/60 text-sm mt-1">Gestión de materia prima e insumos</p>
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
                                className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold hover:shadow-lg active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Insumo
                            </button>
                            <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition font-semibold text-sm">
                                <FileSpreadsheet className="w-4 h-4" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs font-medium">Total insumos</p>
                            <p className="text-2xl font-bold text-white">{totalInsumos}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs font-medium">Stock total</p>
                            <p className="text-2xl font-bold text-white">{formatNumber(totalStock)}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs font-medium">Valor total</p>
                            <p className="text-2xl font-bold text-[#C9A96E]">{formatCurrency(totalValor)}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-white/60 text-xs font-medium">Stock bajo</p>
                            <p className="text-2xl font-bold text-orange-400">{insumosBajos}</p>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar insumo..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1B1A] placeholder-[#8D6B53] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition min-w-[180px]"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => { setBusqueda(''); setFiltroCategoria(''); }}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition px-6 py-2.5 hover:shadow-md active:scale-95"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* TARJETAS DE INSUMOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {insumosFiltrados.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                            <p className="text-lg font-medium">No hay insumos registrados</p>
                            <p className="text-sm">Crea tu primer insumo haciendo clic en "Nuevo Insumo"</p>
                        </div>
                    ) : (
                        insumosFiltrados.map((insumo) => {
                            const Icono = getCategoriaIcon(insumo.categoria);
                            const colorCategoria = getCategoriaColor(insumo.categoria);
                            const isStockBajo = insumo.stock < 5;
                            const isStockCritico = insumo.stock < 2;

                            return (
                                <div
                                    key={insumo.id}
                                    className={`group bg-white rounded-2xl border ${isStockCritico ? 'border-red-300' : isStockBajo ? 'border-yellow-300' : 'border-[#F3E1C8]'} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                                >
                                    {/* Header con categoría */}
                                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isStockCritico ? 'bg-red-50' : isStockBajo ? 'bg-yellow-50' : 'bg-[#FBF7F0]'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`p-1.5 rounded-lg ${colorCategoria}`}>
                                                <Icono className="w-4 h-4" />
                                            </span>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colorCategoria}`}>
                                                {insumo.categoria || 'Sin categoría'}
                                            </span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${insumo.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {insumo.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-[#2D1B1A]">{insumo.nombre}</h3>
                                                <p className="text-xs text-[#8D6B53] flex items-center gap-1 mt-0.5">
                                                    <Truck className="w-3 h-3" />
                                                    {insumo.proveedor || 'Sin proveedor'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#C9A96E]">{formatCurrency(insumo.precio)}</p>
                                                <p className="text-xs text-[#8D6B53]">por {insumo.unidad}</p>
                                            </div>
                                        </div>

                                        {/* Stock */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-[#5A3D2B]">Stock</span>
                                                <span className={`font-bold ${isStockCritico ? 'text-red-600' : isStockBajo ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {insumo.stock} {insumo.unidad}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-[#F3E1C8] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isStockCritico ? 'bg-red-500' :
                                                        isStockBajo ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min((insumo.stock / 50) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="mt-4 pt-3 border-t border-[#F3E1C8] flex items-center gap-1.5">
                                            <button
                                                onClick={() => abrirCompra(insumo)}
                                                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                                            >
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                Comprar
                                            </button>
                                            <button
                                                onClick={() => abrirMerma(insumo)}
                                                className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                                            >
                                                <TrendingDown className="w-3.5 h-3.5" />
                                                Mermar
                                            </button>
                                            <button
                                                onClick={() => abrirEditar(insumo)}
                                                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center"
                                                title="Editar insumo"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => eliminarInsumo(insumo)}
                                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
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
                    const url = esEdicion ? `/insumos/${insumoSeleccionado?.id}` : '/insumos';
                    const method = esEdicion ? 'put' : 'post';

                    router[method](url, data, {
                        onSuccess: () => {
                            setModalAbierto(false);
                            toast.success(esEdicion ? '✅ Insumo actualizado' : '✅ Insumo creado');
                            router.reload();
                        },
                        onError: (errors) => {
                            toast.error('Error: ' + Object.values(errors).join(' '));
                        }
                    });
                }}
            />
            {/* ===== MODAL: Registrar Compra ===== */}
            {modalCompraAbierto && insumoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                            <div>
                                <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-green-500" />
                                    Registrar Compra
                                </h2>
                                <p className="text-xs text-[#5A3D2B]">{insumoSeleccionado.nombre}</p>
                            </div>
                            <button
                                onClick={() => setModalCompraAbierto(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    Stock actual: <span className="font-bold text-[#C9A96E]">{insumoSeleccionado.stock} {insumoSeleccionado.unidad}</span>
                                </label>
                            </div>

                            {/* ❌ ELIMINA el selector de motivo de aquí */}

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Cantidad a comprar *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={formCompra.cantidad}
                                    onChange={(e) => setFormCompra({ ...formCompra, cantidad: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Observaciones</label>
                                <textarea
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white resize-none"
                                    rows={2}
                                    value={formCompra.observaciones}
                                    onChange={(e) => setFormCompra({ ...formCompra, observaciones: e.target.value })}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>

                        <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                            <button
                                onClick={() => setModalCompraAbierto(false)}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registrarCompra}
                                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Check className="w-4 h-4" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                            <div>
                                <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                    Registrar Merma
                                </h2>
                                <p className="text-xs text-[#5A3D2B]">{insumoSeleccionado.nombre}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setModalMermaAbierto(false);
                                    setFormMerma({ cantidad: 0, observaciones: '' });
                                    setMotivoMerma('');
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Stock actual */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    Stock actual: <span className="font-bold text-[#C9A96E]">{insumoSeleccionado.stock} {insumoSeleccionado.unidad}</span>
                                </label>
                            </div>

                            {/* ✅ Selector de motivo - AQUÍ DEBE ESTAR */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    Motivo de la merma *
                                </label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={motivoMerma}
                                    onChange={(e) => setMotivoMerma(e.target.value)}
                                >
                                    <option value="">Seleccionar motivo...</option>
                                    <option value="caducado">📅 Vencido / caducado</option>
                                    <option value="rotura">💔 Derrame o rotura</option>
                                    <option value="refrigeracion">❄️ Falla de refrigeración</option>
                                    <option value="mala_preparacion">👨‍🍳 Merma de preparación</option>
                                    <option value="otro">📝 Otro</option>
                                </select>
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Cantidad a mermar *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={formMerma.cantidad}
                                    onChange={(e) => setFormMerma({ ...formMerma, cantidad: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    max={insumoSeleccionado.stock}
                                />
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Observaciones</label>
                                <textarea
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white resize-none"
                                    rows={2}
                                    value={formMerma.observaciones}
                                    onChange={(e) => setFormMerma({ ...formMerma, observaciones: e.target.value })}
                                    placeholder="Notas adicionales sobre la merma..."
                                />
                            </div>
                        </div>

                        <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModalMermaAbierto(false);
                                    setFormMerma({ cantidad: 0, observaciones: '' });
                                    setMotivoMerma('');
                                }}
                                className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registrarMerma}
                                disabled={cargandoMerma || formMerma.cantidad <= 0 || !motivoMerma}
                                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 ${cargandoMerma || formMerma.cantidad <= 0 || !motivoMerma
                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                            >
                                {cargandoMerma ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
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