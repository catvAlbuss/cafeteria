import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { detectarArea } from '@/utils/clasificarPedidos';
import {
    UserRound,
    Armchair,
    Search,
    Minus,
    Plus,
    ShoppingBag,
    Send,
    ShoppingCart,
    Package,
    ImageOff
} from 'lucide-react';
import ModalEditarPedido from '@/components/modals/ModalEditarPedido';
import { toast } from 'sonner';

// ============================================================
// INTERFACES
// ============================================================
interface Producto {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    imagen: string;
    stock: number;
    disponible: boolean;
}

interface ItemCarrito {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

interface MesaInfo {
    id: number;
    numero: string;
    capacidad: number;
    sillas: number;
    estado: string;
    mesero?: string | null;
}

// ============================================================
// CONFIGURACIÓN DE ESTADOS
// ============================================================
const ESTADOS = {
    libre: { label: 'Libre', soft: 'bg-[#1F8A5F]/10 text-[#1F8A5F]', solid: 'bg-[#1F8A5F]' },
    pendiente: { label: 'Pendiente', soft: 'bg-[#B7791F]/10 text-[#B7791F]', solid: 'bg-[#B7791F]' },
    ocupada: { label: 'Ocupada', soft: 'bg-[#C24A26]/10 text-[#C24A26]', solid: 'bg-[#C24A26]' },
    reserva: { label: 'Reserva', soft: 'bg-[#3E5FCE]/10 text-[#3E5FCE]', solid: 'bg-[#3E5FCE]' },
    listo_cobrar: { label: 'Cobrar', soft: 'bg-[#7B4FC9]/10 text-[#7B4FC9]', solid: 'bg-[#7B4FC9]' },
} as const;

const getEstadoConfig = (estado: string) =>
    ESTADOS[estado as keyof typeof ESTADOS] ?? ESTADOS.libre;

// ============================================================
// COMPONENTE: Imagen con fallback
// ============================================================
const ProductImage = ({
    src,
    alt,
    className = "w-full h-full object-cover"
}: {
    src?: string;
    alt: string;
    className?: string;
}) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className="w-full h-full bg-[#F5EDE3] flex flex-col items-center justify-center">
                <ImageOff className="w-8 h-8 text-[#C9A96E]" strokeWidth={1.5} />
                <span className="text-[10px] text-[#8D6B53] mt-1">Sin imagen</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Ventas() {
    const {
        platos = [],
        mesaInfo: mesaInfoProp = null,
        pedidosActivos: pedidosActivosProp = [],
    } = usePage().props as any;

    // ============================================================
    // STATES
    // ============================================================
    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [pedidosActivos, setPedidosActivos] = useState<any[]>(pedidosActivosProp);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(null);
    const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
    const [mesaInfo, setMesaInfo] = useState<MesaInfo | null>(mesaInfoProp);

  

      // ============================================================
    // EFECTOS
    // ============================================================
    // Procesar productos desde props
    useEffect(() => {
        if (platos && platos.length > 0) {
            const productosProcesados = platos.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                precio: typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio,
                categoria: p.categoria || '',
                imagen: p.imagen || '',
                stock: typeof p.stock === 'string' ? parseInt(p.stock) : p.stock,
                disponible: p.disponible === 1 || p.disponible === true,
            }));
            setProductos(productosProcesados);
        }
    }, [platos]);

    // Mantener pedidosActivos sincronizado con lo que devuelve el backend
    useEffect(() => {
        setPedidosActivos(pedidosActivosProp);
    }, [pedidosActivosProp]);

    // 👇 NUEVO: Recargar automáticamente al volver a la página
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                router.reload({
                    only: ['pedidosActivos', 'mesaInfo'],
                    preserveUrl: true
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Obtener información de la mesa desde API si no viene en props
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');

        if (mesa && !mesaInfoProp) {
            axios.get(`/api/mesas/${mesa}`)
                .then(response => setMesaInfo(response.data))
                .catch(() => { /* Silencioso */ });
        }
    }, [mesaInfoProp]);

    // ============================================================
    // FUNCIONES DE CARRITO
    // ============================================================
    const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const agregarProducto = (producto: Producto) => {
        if (!producto.disponible) {
            toast.warning('Este producto no está disponible');
            return;
        }

        if (producto.stock <= 0) {
            toast.warning('Este producto está agotado');
            return;
        }

        const existente = carrito.find(item => item.id === producto.id);

        if (existente) {
            if (existente.cantidad + 1 > producto.stock) {
                toast.error('No hay suficiente stock');
                return;
            }
            setCarrito(carrito.map(item =>
                item.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                imagen: producto.imagen
            }]);
        }
    };

    const quitarProducto = (id: number) => {
        const existente = carrito.find(item => item.id === id);

        if (existente && existente.cantidad > 1) {
            setCarrito(carrito.map(item =>
                item.id === id
                    ? { ...item, cantidad: item.cantidad - 1 }
                    : item
            ));
        } else {
            setCarrito(carrito.filter(item => item.id !== id));
        }
    };


    // ============================================================
    // ENVIAR PEDIDO - VERSIÓN CORREGIDA (SOLO ESTA PARTE)
    // ============================================================
    const enviarPedido = () => {
        if (carrito.length === 0) {
            toast.warning('Agrega productos al pedido');
            return;
        }

        // Verificar stock
        const productosSinStock = carrito.filter(item => {
            const producto = productos.find(p => p.id === item.id);
            return producto && item.cantidad > producto.stock;
        });

        if (productosSinStock.length > 0) {
            toast.error('Algunos productos no tienen stock suficiente');
            return;
        }

        // 👇 Preparar productos con categoría (para detectar área)
        const productosConCategoria = carrito.map(item => {
            const productoOriginal = productos.find(p => p.id === item.id);
            return {
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.precio * item.cantidad,
                categoria: productoOriginal?.categoria || '',
                imagen: item.imagen,
            };
        });

        // 👇 Detectar área
        const areaDetectada = detectarArea(productosConCategoria);

        router.post('/pedidos', {
            mesa_id: mesaInfo?.id || null,
            cliente: 'Anónimo',
            productos: productosConCategoria, // 👈 Enviar con categoría
            total: totalCarrito,
            area: areaDetectada, // 👈 Enviar área
            observaciones: '',
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pedido enviado a cocina', {
                    description: `Mesa: ${mesaInfo?.numero || 'No asignada'} · Mesero: ${mesaInfo?.mesero || 'No asignado'} · Total: S/ ${totalCarrito.toFixed(2)} · Área: ${areaDetectada}`,
                    duration: 5000,
                    style: {
                        background: '#2D1B1A',
                        color: '#FBF3E7',
                        border: '1px solid #C9A96E',
                    },
                });

                setCarrito([]);
                router.reload({ only: ['pedidosActivos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
            },
            onError: (errors) => {
                toast.error('Error al enviar pedido: ' + Object.values(errors).join(' '));
            }
        });
    };
    // ============================================================
    // FILTRADO DE PRODUCTOS
    // ============================================================
    const productosFiltrados = productos
        .filter(p => p.stock > 0)
        .filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.categoria.toLowerCase().includes(busqueda.toLowerCase())
        );

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <>
            <Head title="Ventas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:p-4 bg-[#FBF7F0]">

                {/* Título */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#2D1B1A] tracking-tight">Tomar Pedido</h1>
                    <p className="text-[#8D6B53] text-xs sm:text-sm font-medium">Busca productos y arma el pedido</p>
                </div>

                {/* Información de la mesa */}
                {mesaInfo && (
                    <div className="relative bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/5">
                        <div className="absolute -top-2 -right-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${getEstadoConfig(mesaInfo.estado).solid}`}>
                                {getEstadoConfig(mesaInfo.estado).label}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            {/* Mesa */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#FBF7F0] border-2 border-[#C9A96E] flex items-center justify-center">
                                    <span className="text-lg font-bold text-[#2D1B1A]">#{mesaInfo.numero}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-[#8D6B53] font-semibold tracking-wider">Mesa</p>
                                    <p className="text-sm text-[#2D1B1A] font-medium">{mesaInfo.capacidad} personas</p>
                                </div>
                            </div>

                            <div className="hidden sm:block w-px h-10 bg-black/5" />

                            {/* Mesero */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#2D1B1A]/5 flex items-center justify-center">
                                    <UserRound className="w-5 h-5 text-[#2D1B1A]" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-[#8D6B53] font-semibold tracking-wider">Mesero</p>
                                    <p className="text-sm text-[#2D1B1A] font-medium">{mesaInfo.mesero || 'No asignado'}</p>
                                </div>
                            </div>

                            {/* Sillas */}
                            <div className="flex items-center gap-2 ml-auto bg-[#FBF7F0] px-3 py-1.5 rounded-full border border-black/5">
                                <Armchair className="w-4 h-4 text-[#8D6B53]" strokeWidth={2} />
                                <span className="text-sm text-[#2D1B1A] font-medium">{mesaInfo.sillas} sillas</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* COLUMNA 1: Productos */}
                    <div className="lg:col-span-2">
                        {/* Buscador */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" strokeWidth={2} />
                            <input
                                type="text"
                                placeholder="Buscar producto (ej: café, latte, sandwich...)"
                                className="w-full p-3 pl-10 rounded-xl border border-black/5 focus:ring-2 focus:ring-[#2D1B1A]/15 focus:border-transparent outline-none text-[#1A1A1A] placeholder-gray-500 bg-white shadow-sm"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {productosFiltrados.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-[#8D6B53]">
                                    {busqueda ? 'No se encontraron productos' : 'No hay productos disponibles'}
                                </div>
                            ) : (
                                productosFiltrados.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className={`relative bg-white rounded-2xl border border-black/5 hover:shadow-md transition overflow-hidden group ${producto.disponible && producto.stock > 0
                                            ? 'cursor-pointer hover:border-[#C9A96E]/50 active:scale-[0.98]'
                                            : 'cursor-not-allowed opacity-70'
                                            }`}
                                        onClick={() => {
                                            if (producto.disponible && producto.stock > 0) {
                                                agregarProducto(producto);
                                            } else {
                                                toast.warning('Este producto no está disponible');
                                            }
                                        }}
                                    >
                                        {/* Badges */}
                                        {!producto.disponible && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-2xl">
                                                <span className="text-white font-bold text-xs px-3 py-1 bg-red-600 rounded-full shadow-lg">
                                                    🚫 No disponible
                                                </span>
                                            </div>
                                        )}
                                        {producto.disponible && producto.stock <= 0 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                                                <span className="text-white font-bold text-xs px-3 py-1 bg-orange-500 rounded-full shadow-lg">
                                                    ⚠️ Agotado
                                                </span>
                                            </div>
                                        )}

                                        {/* Imagen */}
                                        <div className="h-32 bg-[#F5EDE3] flex items-center justify-center overflow-hidden">
                                            <ProductImage
                                                src={producto.imagen}
                                                alt={producto.nombre}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        </div>

                                        {/* Información */}
                                        <div className="p-3">
                                            <p className="font-medium text-[#2D1B1A] text-sm">{producto.nombre}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-[#C9A96E] font-bold">S/ {Number(producto.precio).toFixed(2)}</p>
                                                <span className="text-xs text-gray-400">Stock: {producto.stock}</span>
                                            </div>
                                            <p className="text-xs text-[#8D6B53]">{producto.categoria}</p>

                                            {/* Botón Agregar */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (producto.disponible && producto.stock > 0) {
                                                        agregarProducto(producto);
                                                    } else {
                                                        toast.warning('Este producto no está disponible');
                                                    }
                                                }}
                                                disabled={!producto.disponible || producto.stock <= 0}
                                                className={`w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition ${producto.disponible && producto.stock > 0
                                                    ? 'bg-[#C9A96E] hover:bg-[#B8975D] text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {producto.disponible && producto.stock > 0 ? '+ Agregar' : 'No disponible'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Carrito */}
                    <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm h-fit">
                        <h2 className="flex items-center gap-2 font-bold text-[#2D1B1A] mb-3">
                            <ShoppingCart className="w-4 h-4" strokeWidth={2.25} />
                            Pedido
                        </h2>

                        {carrito.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8">
                                <ShoppingBag className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                                <p className="text-[#8D6B53] text-sm">Sin productos</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {carrito.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between border-b border-black/5 py-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#F5EDE3]">
                                                <ProductImage
                                                    src={item.imagen}
                                                    alt={item.nombre}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[#2D1B1A] truncate">{item.nombre}</p>
                                                <p className="text-xs text-[#8D6B53]">S/ {item.precio.toFixed(2)} x {item.cantidad}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => quitarProducto(item.id)}
                                                className="w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center justify-center active:scale-90"
                                            >
                                                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </button>
                                            <span className="text-sm font-bold text-[#2D1B1A] w-4 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => {
                                                    const producto = productos.find(p => p.id === item.id);
                                                    if (producto && producto.stock > item.cantidad) {
                                                        agregarProducto(producto);
                                                    } else {
                                                        toast.error('Stock insuficiente');
                                                    }
                                                }}
                                                className="w-6 h-6 rounded-full bg-[#2D1B1A]/5 text-[#2D1B1A] hover:bg-[#2D1B1A]/10 transition flex items-center justify-center active:scale-90"
                                            >
                                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {carrito.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-black/5">
                                <div className="flex justify-between items-baseline font-bold text-[#2D1B1A]">
                                    <span className="text-sm">Total</span>
                                    <span className="text-[#C9A96E] text-lg">S/ {totalCarrito.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={enviarPedido}
                                    className="w-full mt-3 py-2.5 bg-[#2D1B1A] hover:bg-[#1E1211] text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                >
                                    <Send className="w-4 h-4" strokeWidth={2.25} />
                                    Enviar Pedido
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== PEDIDOS ACTIVOS ===== */}
                {pedidosActivos.length > 0 && (
                    <div className="mt-4">
                        <div className="bg-white rounded-2xl border border-[#F3E1C8] p-4 shadow-sm">
                            <h3 className="font-bold text-[#2D1B1A] text-sm mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Pedidos Activos ({pedidosActivos.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {pedidosActivos.map((pedido, index) => (
                                    <div
                                        key={pedido.id ?? index}
                                        className="flex items-center justify-between p-3 bg-[#FBF7F0] rounded-xl border border-[#F3E1C8] cursor-pointer hover:border-[#C9A96E] transition"
                                        onClick={() => {
                                            setPedidoSeleccionado(pedido);
                                            setModalEdicionAbierto(true);
                                        }}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-[#2D1B1A]">{pedido.numero}</p>
                                            <p className="text-xs text-[#8D6B53]">
                                                {pedido.productos.length} productos · S/ {Number(pedido.total).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pedido.estado === 'pendiente' ? 'bg-orange-100 text-orange-700' :
                                                pedido.estado === 'preparando' ? 'bg-blue-100 text-blue-700' :
                                                    pedido.estado === 'listo' ? 'bg-green-100 text-green-600' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {pedido.estado === 'listo' ? '✅ Listo' :
                                                    pedido.estado === 'preparando' ? '👨‍🍳 Preparando' :
                                                        pedido.estado || 'Pendiente'}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    window.location.href = `/ventas?mesa_id=${pedido.mesa_id}`;
                                                }}
                                                className="flex-1 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-medium text-sm transition"
                                            >
                                                ✏️ Editar pedido
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL DE EDICIÓN ===== */}
                {pedidoSeleccionado && (
                    <ModalEditarPedido
                        isOpen={modalEdicionAbierto}
                        onClose={() => {
                            setModalEdicionAbierto(false);
                            setPedidoSeleccionado(null);
                        }}
                        pedido={pedidoSeleccionado}
                        productos={productos}
                        onPedidoActualizado={() => {
                            setModalEdicionAbierto(false);
                            setPedidoSeleccionado(null);
                            toast.success('✅ Pedido actualizado');
                            router.reload({ only: ['pedidosActivos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
                        }}
                        onPedidoCancelado={() => {
                            setModalEdicionAbierto(false);
                            setPedidoSeleccionado(null);
                            toast.success('🗑️ Pedido cancelado');
                            router.reload({ only: ['pedidosActivos'], preserveScroll: true } as Parameters<typeof router.reload>[0]);
                        }}
                    />
                )}
            </div>
        </>
    );
}