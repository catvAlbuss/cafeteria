import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import ModalBoleta from '@/components/modals/ModalBoleta';
import ModalCobro from '@/components/modals/ModalCobro';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import {
    Search,
    Plus,
    Minus,
    X,
    ArrowRight,
    ShoppingCart,
    ImageOff,
    Coffee as CoffeeIcon,
    Sparkles,
    Snowflake,
    Utensils,
    CupSoda,
    LayoutGrid,
    Receipt,
    Clock,
    ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    imagen: string;
    stock?: number;
    disponible?: boolean;
}

interface ItemCarrito {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

interface MesaSalon {
    id: number;
    numero: string;
    capacidad: number;
    estado: string;
    cliente?: string | null;
    mesero?: string | null;
}

interface PedidoSalon {
    id: number;
    numero: string;
    mesa_id: number;
    cliente: string;
    productos: any[] | string;
    subtotal?: number | string | null;
    igv?: number | string | null;
    total: number | string;
    hora_pedido: string;
    created_at?: string;
    estado: string;
    mesero?: string | null;
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

// ============================================================
// COMPONENTE: Imagen con fallback
// ============================================================
const ProductImage = ({
    src,
    alt,
    className = "w-full h-full object-cover",
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
            loading="lazy"
            decoding="async"
        />
    );
};
const CategoriaCard = ({
    categoria,
    icon: IconComponent,
    count,
    isActive,
    onClick,
    stockStatus
}: {
    categoria: string;
    icon: any;
    count: number;
    isActive: boolean;
    onClick: () => void;
    stockStatus?: 'bajo' | 'normal';
}) => {
    return (
        <div
            onClick={onClick}
            className={`rounded-xl p-5 cursor-pointer transition-all duration-300 group ${isActive
                ? 'bg-gradient-to-br from-[#C9A96E] to-[#B8975D] text-white shadow-md shadow-[#C9A96E]/25 scale-[1.02]'
                : 'bg-white text-gray-800 shadow-sm border border-black/5 hover:shadow-md hover:border-[#C9A96E]/40 hover:scale-[1.02]'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#FBF7F0] text-[#C9A96E] group-hover:bg-[#C9A96E]/10'
                    }`}>
                    <IconComponent className="w-4 h-4" strokeWidth={2} />
                </div>
                {stockStatus === 'bajo' && !isActive && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1">
                        <span className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
                        Stock bajo
                    </span>
                )}
                {isActive && (
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm">
                        Activo
                    </span>
                )}
            </div>
            <div className="mt-2">
                <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-[#2D1B1A]'}`}>
                    {categoria}
                </h3>
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                    <span className="text-base font-bold">{count}</span>
                    <span>prod.</span>
                </p>
            </div>
        </div>
    );
};

export default function Caja() {

    const { platos = [], mesas = [], pedidos = [] } = usePage().props as any;
    const [productos, setProductos] = useState<Producto[]>([]);
    const [mesasLista, setMesasLista] = useState<MesaSalon[]>(() =>
        toArray<MesaSalon>(mesas),
    );
    const [pedidosLista, setPedidosLista] = useState<PedidoSalon[]>(() =>
        toArray<PedidoSalon>(pedidos),
    );
    // Procesar platos desde la base de datos
    useEffect(() => {
        if (platos && platos.length > 0) {
            const productosProcesados = platos.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                precio: typeof p.precio === 'string' ? parseFloat(p.precio) : p.precio,
                categoria: p.categoria || 'Sin categoría',
                imagen: p.imagen || '',
                stock: typeof p.stock === 'string' ? parseInt(p.stock) : (p.stock ?? 0),
                disponible: p.disponible === 1 || p.disponible === true,
            }));
            setProductos(productosProcesados);
        }
    }, [platos]);

    //  Estado del carrito
    const [carrito, setCarrito] = useState<ItemCarrito[]>(() => {
        const saved = localStorage.getItem('carritoCaja');
        return saved ? JSON.parse(saved) : [];
    });

    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [cliente, setCliente] = useState('');
    const [mesa, setMesa] = useState('');
    const [tipoPedido, setTipoPedido] = useState('llevar');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [datosBoleta, setDatosBoleta] = useState<any>(null);
    const [modalBoletaAbierto, setModalBoletaAbierto] = useState(false);
    const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
    const [mesaCobro, setMesaCobro] = useState<MesaSalon | null>(null);
    const [pedidoCobro, setPedidoCobro] = useState<PedidoSalon[]>([]);
    const [busquedaSalon, setBusquedaSalon] = useState('');
    const [visibles, setVisibles] = useState(10);

    // Sincronizar mesas/pedidos cuando llegan nuevas props
    useEffect(() => {
        setMesasLista(toArray<MesaSalon>(mesas));
        setPedidosLista(toArray<PedidoSalon>(pedidos));
    }, [mesas, pedidos]);

    // ===== BANDEJA DE PEDIDOS DE SALÓN =====
    const salonPendientes = useMemo(() => {
        const porMesa = new Map<number, { mesa: MesaSalon; pedidos: PedidoSalon[] }>();

        mesasLista.forEach((mesa) => {
            porMesa.set(mesa.id, { mesa, pedidos: [] });
        });

        pedidosLista.forEach((pedido) => {
            const grupo = porMesa.get(pedido.mesa_id);
            if (grupo) {
                grupo.pedidos.push(pedido);
            }
        });

        return Array.from(porMesa.values())
            .filter((g) => g.mesa.estado === 'listo_cobrar' && g.pedidos.length > 0)
            .map((g) => {
                const total = g.pedidos.reduce(
                    (sum, p) => sum + (typeof p.total === 'number' ? p.total : parseFloat(p.total) || 0),
                    0,
                );
                const masAntiguo = g.pedidos.reduce(
                    (acc, p) => {
                        const t = new Date(p.hora_pedido || p.created_at || '').getTime() || 0;
                        return acc === 0 || (t > 0 && t < acc) ? t : acc;
                    },
                    0,
                );
                return { ...g, total, masAntiguo };
            })
            .sort((a, b) => a.masAntiguo - b.masAntiguo);
    }, [mesasLista, pedidosLista]);

    const pendientesFiltrados = useMemo(() => {
        const q = busquedaSalon.trim().toLowerCase();
        if (!q) {
            return salonPendientes;
        }

        return salonPendientes.filter(
            (g) =>
                g.mesa.numero.toLowerCase().includes(q) ||
                g.pedidos.some((p) => p.numero.toLowerCase().includes(q)),
        );
    }, [salonPendientes, busquedaSalon]);

    const bandejaVisibles = pendientesFiltrados.slice(0, visibles);

    const tiempoRelativo = (timestamp: number) => {
        if (!timestamp) {
            return '';
        }

        const minutos = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
        if (minutos < 60) {
            return `Hace ${minutos} min`;
        }

        const horas = Math.floor(minutos / 60);
        const resto = minutos % 60;

        return resto > 0 ? `Hace ${horas} h ${resto} min` : `Hace ${horas} h`;
    };

    const abrirCobro = (mesa: MesaSalon, pedidosMesa: PedidoSalon[]) => {
        setMesaCobro(mesa);
        setPedidoCobro(pedidosMesa);
        setModalCobroAbierto(true);
    };

    // Tiempo real: una mesa que llega a listo_cobrar aparece sola en la bandeja
    useSedeChannel('mesas', {
        'mesa.actualizada': (payload: any) => {
            setMesasLista((prev) =>
                prev.map((m) =>
                    m.id === payload.id ? { ...m, ...payload } : m,
                ),
            );
        },
    });

    useSedeChannel('pedidos', {
        'pedido.actualizado': (payload: any) => {
            setPedidosLista((prev) =>
                prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)),
            );
        },
        'pedido.creado': (payload: any) => {
            setPedidosLista((prev) =>
                prev.some((p) => p.id === payload.id) ? prev : [...prev, payload],
            );
        },
    });

    // Guardar carrito en localStorage
    useEffect(() => {
        localStorage.setItem('carritoCaja', JSON.stringify(carrito));
    }, [carrito]);

    // Obtener categorías únicas con conteo
    const categorias = () => {
        const cats = productos.reduce((acc, p) => {
            if (!acc[p.categoria]) {
                acc[p.categoria] = { count: 0, stockBajo: 0 };
            }
            acc[p.categoria].count++;
            if (p.stock !== undefined && p.stock <= 2 && p.disponible) {
                acc[p.categoria].stockBajo++;
            }
            return acc;
        }, {} as Record<string, { count: number; stockBajo: number }>);

        return Object.entries(cats).map(([nombre, data]) => ({
            nombre,
            count: data.count,
            stockBajo: data.stockBajo
        }));
    };

    // Filtrar productos
    const productosFiltrados = productos.filter(p => {
        if (categoriaSeleccionada && p.categoria !== categoriaSeleccionada) {
            return false;
        }
        if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            !p.categoria.toLowerCase().includes(busqueda.toLowerCase())) {
            return false;
        }
        return true;
    });

    // Iconos por categoría
    const getIconoCategoria = (categoria: string) => {
        const icons: Record<string, any> = {
            'Todos': LayoutGrid,
            'Café': CoffeeIcon,
            'Café Premium': Sparkles,
            'Café Frío': Snowflake,
            'Té': CupSoda,
            'Snacks': Utensils
        };
        return icons[categoria] || CoffeeIcon;
    };

    // Agregar producto
    const agregarProducto = (producto: Producto) => {
        if (!producto.disponible) {
            toast.warning('Este producto no está disponible');
            return;
        }

        if (producto.stock !== undefined && producto.stock <= 0) {
            toast.warning('Este producto está agotado');
            return;
        }

        const existente = carrito.find(item => item.id === producto.id);
        if (existente) {
            if (producto.stock !== undefined && existente.cantidad + 1 > producto.stock) {
                toast.error('No hay suficiente stock');
                return;
            }
            setCarrito(prev =>
                prev.map(item =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                )
            );
        } else {
            setCarrito(prev => [...prev, {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                imagen: producto.imagen
            }]);
        }
    };

    const quitarProducto = (id: number) => {
        setCarrito(prev => {
            const existente = prev.find(item => item.id === id);
            if (existente && existente.cantidad > 1) {
                return prev.map(item =>
                    item.id === id
                        ? { ...item, cantidad: item.cantidad - 1 }
                        : item
                );
            }
            return prev.filter(item => item.id !== id);
        });
    };

    const eliminarProducto = (id: number) => {
        setCarrito(prev => prev.filter(item => item.id !== id));
    };

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Limpiar carrito
    const limpiarCarrito = () => {
        setCarrito([]);
        setCliente('');
        setMesa('');
    };

    // ============================================================
    // REALIZAR PEDIDO - CON MODAL DE BOLETA
    // ============================================================
    const realizarPedido = () => {
        if (carrito.length === 0) {
            toast.warning('Agrega productos al pedido');
            return;
        }

        // Verificar stock antes de enviar
        const productosSinStock = carrito.filter(item => {
            const producto = productos.find(p => p.id === item.id);
            return producto && item.cantidad > (producto.stock || 0);
        });

        if (productosSinStock.length > 0) {
            toast.error('Algunos productos no tienen stock suficiente');
            return;
        }

        const pedidoData = {
            cliente: cliente || 'Anónimo',
            mesa: mesa || null,
            tipo: tipoPedido,
            metodoPago: metodoPago,
            productos: carrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.precio * item.cantidad
            })),
            subtotal: subtotal,
            igv: igv,
            total: total,
        };

        router.post('/caja/registrar', pedidoData, {
            preserveScroll: true,
            onSuccess: () => {
                // Guardar datos de la boleta y abrir modal
                setDatosBoleta({
                    cliente: cliente || 'Anónimo',
                    mesa: mesa || null,
                    tipo: tipoPedido,
                    metodoPago: metodoPago,
                    productos: carrito.map(item => ({
                        id: item.id,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio: item.precio,
                        subtotal: item.precio * item.cantidad
                    })),
                    subtotal: subtotal,
                    igv: igv,
                    total: total,
                });
                setModalBoletaAbierto(true);

                limpiarCarrito();
            },
            onError: (errors) => {
                console.log('❌ Error:', errors);
                const errorMsg = typeof errors === 'object'
                    ? Object.values(errors).flat().join(' ')
                    : errors;
                toast.error('Error al registrar pedido', {
                    description: errorMsg || 'Intenta nuevamente',
                    duration: 5000,
                });
            }
        });
    };

    const categoriasData = categorias();
    return (
        <>
            <Head title="Caja" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:p-4 bg-[#FBF7F0]">

                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-white rounded-lg border border-black/5">
                            Pedido #27362
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                            Abierta
                        </span>
                    </div>
                </div>

                {/* Layout Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* ============================================================ */}
                    {/* COLUMNA IZQUIERDA: Productos (2/3) */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-2">

                        {/* Buscador */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" strokeWidth={2} />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full p-3 pl-10 rounded-xl border border-black/5 focus:ring-2 focus:ring-[#2D1B1A]/15 focus:border-transparent outline-none text-[#1A1A1A] placeholder-gray-500 bg-white shadow-sm"
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    if (e.target.value) {
                                        setCategoriaSeleccionada(null);
                                    }
                                }}
                            />
                            {categoriaSeleccionada && (
                                <button
                                    onClick={() => setCategoriaSeleccionada(null)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Categorías */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                            <CategoriaCard
                                categoria="Todos"
                                icon={LayoutGrid}
                                count={productos.length}
                                isActive={categoriaSeleccionada === null}
                                onClick={() => {
                                    setCategoriaSeleccionada(null);
                                    setBusqueda('');
                                }}
                            />
                            {categoriasData.map((cat) => (
                                <CategoriaCard
                                    key={cat.nombre}
                                    categoria={cat.nombre}
                                    icon={getIconoCategoria(cat.nombre)}
                                    count={cat.count}
                                    isActive={categoriaSeleccionada === cat.nombre}
                                    onClick={() => {
                                        setCategoriaSeleccionada(cat.nombre);
                                        setBusqueda('');
                                    }}
                                    stockStatus={cat.stockBajo > 0 ? 'bajo' : 'normal'}
                                />
                            ))}
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {productosFiltrados.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-[#8D6B53]">
                                    {busqueda
                                        ? `No se encontraron productos para "${busqueda}"`
                                        : categoriaSeleccionada
                                            ? `No hay productos en "${categoriaSeleccionada}"`
                                            : 'No hay productos disponibles'}
                                </div>
                            ) : (
                                productosFiltrados.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className={`relative bg-white rounded-2xl border border-black/5 hover:shadow-md transition overflow-hidden group ${producto.disponible && (producto.stock === undefined || producto.stock > 0)
                                            ? 'cursor-pointer hover:border-[#C9A96E]/50 active:scale-[0.98]'
                                            : 'cursor-not-allowed opacity-70'
                                            }`}
                                        onClick={() => {
                                            if (producto.disponible && (producto.stock === undefined || producto.stock > 0)) {
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
                                        {producto.disponible && producto.stock !== undefined && producto.stock <= 0 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                                                <span className="text-white font-bold text-xs px-3 py-1 bg-orange-500 rounded-full shadow-lg">
                                                    ⚠️ Agotado
                                                </span>
                                            </div>
                                        )}
                                        {producto.disponible && producto.stock !== undefined && producto.stock <= 2 && producto.stock > 0 && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                                    Últimas {producto.stock}
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
                                                {producto.stock !== undefined && producto.stock > 0 && (
                                                    <span className="text-xs text-gray-400">Stock: {producto.stock}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#8D6B53]">{producto.categoria}</p>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (producto.disponible && (producto.stock === undefined || producto.stock > 0)) {
                                                        agregarProducto(producto);
                                                    } else {
                                                        toast.warning('Este producto no está disponible');
                                                    }
                                                }}
                                                disabled={!producto.disponible || (producto.stock !== undefined && producto.stock <= 0)}
                                                className={`w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition ${producto.disponible && (producto.stock === undefined || producto.stock > 0)
                                                    ? 'bg-[#C9A96E] hover:bg-[#B8975D] text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {producto.disponible && (producto.stock === undefined || producto.stock > 0)
                                                    ? '+ Agregar'
                                                    : 'No disponible'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* COLUMNA DERECHA: Pedido (1/3) */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm h-fit">

                            {/* Cabecera */}
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="flex items-center gap-2 font-bold text-[#2D1B1A]">
                                    <ShoppingCart className="w-4 h-4" strokeWidth={2.25} />
                                    Pedido
                                </h2>
                                <button
                                    onClick={limpiarCarrito}
                                    className="text-gray-400 hover:text-red-500 transition text-sm"
                                >
                                    Limpiar
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-1 mb-3">
                                <button
                                    onClick={() => setTipoPedido('salon')}
                                    className={`py-1.5 rounded-lg text-xs font-medium transition ${tipoPedido === 'salon'
                                        ? 'bg-[#C9A96E] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    🪑 Salón
                                </button>
                                <button
                                    onClick={() => setTipoPedido('llevar')}
                                    className={`py-1.5 rounded-lg text-xs font-medium transition ${tipoPedido === 'llevar'
                                        ? 'bg-[#C9A96E] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    📦 Llevar
                                </button>
                                <button
                                    onClick={() => setTipoPedido('delivery')}
                                    className={`py-1.5 rounded-lg text-xs font-medium transition ${tipoPedido === 'delivery'
                                        ? 'bg-[#C9A96E] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    🚚 Delivery
                                </button>
                            </div>

                            {/* ============ BANDEJA DE PEDIDOS DE SALÓN ============ */}
                            {tipoPedido === 'salon' ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" strokeWidth={2} />
                                        <input
                                            type="text"
                                            placeholder="Buscar mesa o pedido... (Ej: M03, #1004)"
                                            className="w-full p-2 pl-9 border border-black/5 rounded-lg text-sm focus:ring-1 focus:ring-[#C9A96E] outline-none bg-[#FBF7F0]"
                                            value={busquedaSalon}
                                            onChange={(e) => {
                                                setBusquedaSalon(e.target.value);
                                                setVisibles(10);
                                            }}
                                        />
                                    </div>

                                    {bandejaVisibles.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-6">
                                            <Receipt className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                                            <p className="text-[#8D6B53] text-sm">
                                                {busquedaSalon
                                                    ? 'Sin resultados en la búsqueda'
                                                    : 'No hay pedidos de Salón por cobrar'}
                                            </p>
                                            {!busquedaSalon && (
                                                <p className="text-xs text-gray-400 text-center">
                                                    Las mesas con todos sus pedidos entregados aparecerán aquí automáticamente.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                                                {bandejaVisibles.map(({ mesa, pedidos: pedidosMesa, total }) => (
                                                    <div
                                                        key={mesa.id}
                                                        className="flex items-center justify-between gap-2 border-b border-black/5 py-2.5"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <div className="w-9 h-9 rounded-lg bg-[#F5EDE3] flex-shrink-0 flex items-center justify-center font-bold text-[#C9A96E] text-sm">
                                                                {mesa.numero}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-[#2D1B1A] truncate">
                                                                    Mesa {mesa.numero}
                                                                </p>
                                                                <p className="text-xs text-[#8D6B53] truncate">
                                                                    {pedidosMesa.map((p) => p.numero).join(' · ')}
                                                                    {total > 0 && (
                                                                        <span className="ml-1 text-[#C9A96E] font-semibold">
                                                                            S/ {total.toFixed(2)}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                            {(() => {
                                                                const ts = pendientesFiltrados.find((g) => g.mesa.id === mesa.id)?.masAntiguo || 0;
                                                                const rel = tiempoRelativo(ts);
                                                                return rel && (
                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {rel}
                                                                    </span>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={() => abrirCobro(mesa, pedidosMesa)}
                                                                className="px-3 py-1.5 bg-[#2D1B1A] hover:bg-[#1E1211] text-white rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm"
                                                            >
                                                                COBRAR
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {pendientesFiltrados.length > visibles && (
                                                <button
                                                    onClick={() => setVisibles((v) => v + 10)}
                                                    className="w-full py-2 border border-[#C9A96E]/30 text-[#C9A96E] rounded-lg text-xs font-semibold transition hover:bg-[#C9A96E]/10 flex items-center justify-center gap-1"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                    Mostrar más ({pendientesFiltrados.length - visibles} restantes)
                                                </button>
                                            )}

                                            <p className="text-xs text-gray-400 text-center pt-1">
                                                {pendientesFiltrados.length === 1
                                                    ? '1 pedido pendiente'
                                                    : `${pendientesFiltrados.length} pedidos pendientes`}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                            {/* Cliente y Mesa */}
                            <div className="space-y-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente"
                                    className="w-full p-2 border border-black/5 rounded-lg text-sm focus:ring-1 focus:ring-[#C9A96E] outline-none bg-[#FBF7F0]"
                                    value={cliente}
                                    onChange={(e) => setCliente(e.target.value)}
                                />
                                <select
                                    className="w-full p-2 border border-black/5 rounded-lg text-sm focus:ring-1 focus:ring-[#C9A96E] outline-none bg-[#FBF7F0]"
                                    value={mesa}
                                    onChange={(e) => setMesa(e.target.value)}
                                >
                                    <option value="">Seleccionar mesa</option>
                                    <option value="Mesa 01">Mesa 01</option>
                                    <option value="Mesa 02">Mesa 02</option>
                                    <option value="Mesa 03">Mesa 03</option>
                                    <option value="Mesa 04">Mesa 04</option>
                                    <option value="Mesa 05">Mesa 05</option>
                                </select>
                            </div>

                            {/* Lista del carrito */}
                            <div className="max-h-52 overflow-y-auto space-y-2">
                                {carrito.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-6">
                                        <ShoppingCart className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                                        <p className="text-[#8D6B53] text-sm">Sin productos</p>
                                    </div>
                                ) : (
                                    carrito.map((item) => (
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
                                            <div className="flex items-center gap-1 flex-shrink-0">
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
                                                        if (producto) {
                                                            agregarProducto(producto);
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded-full bg-[#2D1B1A]/5 text-[#2D1B1A] hover:bg-[#2D1B1A]/10 transition flex items-center justify-center active:scale-90"
                                                >
                                                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => eliminarProducto(item.id)}
                                                    className="ml-1 text-red-400 hover:text-red-600 transition text-sm"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totales y acciones */}
                            {carrito.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-black/5">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">IGV (18%)</span>
                                            <span className="font-medium">S/ {igv.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold pt-2 border-t border-black/5">
                                            <span className="text-[#2D1B1A]">Total</span>
                                            <span className="text-[#C9A96E]">S/ {total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Método de pago */}
                                    <div className="grid grid-cols-3 gap-1 mt-3">
                                        <button
                                            onClick={() => setMetodoPago('efectivo')}
                                            className={`py-1.5 rounded-lg text-xs font-medium transition ${metodoPago === 'efectivo'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            💵 Efectivo
                                        </button>
                                        <button
                                            onClick={() => setMetodoPago('tarjeta')}
                                            className={`py-1.5 rounded-lg text-xs font-medium transition ${metodoPago === 'tarjeta'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            💳 Tarjeta
                                        </button>
                                        <button
                                            onClick={() => setMetodoPago('yape')}
                                            className={`py-1.5 rounded-lg text-xs font-medium transition ${metodoPago === 'yape'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            📱 Yape
                                        </button>
                                    </div>

                                    <button
                                        onClick={realizarPedido}
                                        className="w-full mt-3 py-2.5 bg-[#2D1B1A] hover:bg-[#1E1211] text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                    >
                                        <Receipt className="w-4 h-4" strokeWidth={2.25} />
                                        Realizar Pedido
                                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                                    </button>
                                </div>
                            )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* ===== MODAL BOLETA ===== */}
            <ModalBoleta
                isOpen={modalBoletaAbierto}
                data={datosBoleta}
                onClose={() => {
                    setModalBoletaAbierto(false);
                    setDatosBoleta(null);
                }}
                onSuccess={() => {
                    setModalBoletaAbierto(false);
                    setDatosBoleta(null);

                    router.reload();
                }}
            />
            {/* ===== MODAL COBRO SALÓN ===== */}
            <ModalCobro
                isOpen={modalCobroAbierto}
                mesa={mesaCobro}
                pedido={pedidoCobro}
                onClose={() => setModalCobroAbierto(false)}
                onSuccess={() => {
                    setModalCobroAbierto(false);
                    router.reload({
                        only: ['mesas', 'pedidos'],
                        preserveUrl: true,
                    });
                }}
            />
        </>
    );

}
Caja.layout = {
    breadcrumbs: [
        {
            title: 'Caja',
            href: '/caja',
        },
    ],
};  