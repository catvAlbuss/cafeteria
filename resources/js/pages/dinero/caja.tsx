import { Head, router, usePage } from '@inertiajs/react';
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
    ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import ModalBoleta from '@/components/modals/ModalBoleta';
import { useSedeChannel } from '@/hooks/useSedeChannel';

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
    className = 'w-full h-full object-cover',
}: {
    src?: string;
    alt: string;
    className?: string;
}) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-cream-pale">
                <ImageOff className="h-8 w-8 text-gold" strokeWidth={1.5} />
                <span className="mt-1 text-[10px] text-cocoa-soft">
                    Sin imagen
                </span>
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
    stockStatus,
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
            className={`group cursor-pointer rounded-xl px-3.5 py-3 transition-all duration-200 select-none ${
                isActive
                    ? `scale-[1.01] bg-gradient-to-br from-gold to-gold-deep text-white shadow-md ring-1 shadow-gold/20 ring-gold/20`
                    : `border border-black/5 bg-card text-chocolate shadow-sm hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md`
            } `}
        >
            <div className="flex items-center gap-3">
                {/* Icono */}
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                        isActive
                            ? 'bg-white/20 text-white'
                            : `bg-cream text-gold group-hover:bg-gold/10`
                    } `}
                >
                    <IconComponent className="h-4.5 w-4.5" strokeWidth={2} />
                </div>

                {/* Información */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className={`truncate text-sm leading-tight font-bold ${
                                isActive ? 'text-white' : 'text-chocolate'
                            } `}
                        >
                            {categoria}
                        </h3>

                        {/* Stock bajo */}
                        {stockStatus === 'bajo' && (
                            <span
                                className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-orange-100 text-orange-700'
                                } `}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        isActive
                                            ? 'animate-pulse bg-card'
                                            : 'animate-pulse bg-orange-500'
                                    } `}
                                />
                                Bajo
                            </span>
                        )}
                    </div>

                    <p
                        className={`mt-0.5 text-xs ${
                            isActive ? 'text-white/75' : 'text-cocoa'
                        } `}
                    >
                        <span className="font-semibold">{count}</span>{' '}
                        {count === 1 ? 'producto' : 'productos'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function Caja() {
    const {
        platos = [],
        mesas = [],
        pedidos = [],
        caja = null,
    } = usePage().props as any;
    const siguienteNumeroPedido = String(
        (Number(caja?.contador_pedidos) || 0) + 1,
    ).padStart(3, '0');
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
                precio:
                    typeof p.precio === 'string'
                        ? parseFloat(p.precio)
                        : p.precio,
                categoria: p.categoria || 'Sin categoría',
                imagen: p.imagen || '',
                stock:
                    typeof p.stock === 'string'
                        ? parseInt(p.stock)
                        : (p.stock ?? 0),
                disponible: p.disponible === 1 || p.disponible === true,
            }));
            setProductos(productosProcesados);
        }
    }, [platos]);

    const [carrito, setCarrito] = useState<ItemCarrito[]>(() => {
        const saved = localStorage.getItem('carritoCaja');

        return saved ? JSON.parse(saved) : [];
    });

    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
        string | null
    >(null);
    const [cliente, setCliente] = useState('');
    const [mesa, setMesa] = useState('');
    const [tipoPedido, setTipoPedido] = useState('llevar');
    const [datosBoleta, setDatosBoleta] = useState<any>(null);
    const [modalBoletaAbierto, setModalBoletaAbierto] = useState(false);
    const [busquedaSalon, setBusquedaSalon] = useState('');
    const [visibles, setVisibles] = useState(10);

    useEffect(() => {
        setMesasLista(toArray<MesaSalon>(mesas));
        setPedidosLista(toArray<PedidoSalon>(pedidos));
    }, [mesas, pedidos]);

    // ===== BANDEJA DE PEDIDOS DE SALÓN =====
    const salonPendientes = useMemo(() => {
        const porMesa = new Map<
            number,
            { mesa: MesaSalon; pedidos: PedidoSalon[] }
        >();

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
            .filter(
                (g) => g.mesa.estado === 'listo_cobrar' && g.pedidos.length > 0,
            )
            .map((g) => {
                const total = g.pedidos.reduce(
                    (sum, p) =>
                        sum +
                        (typeof p.total === 'number'
                            ? p.total
                            : parseFloat(p.total) || 0),
                    0,
                );
                const masAntiguo = g.pedidos.reduce((acc, p) => {
                    const t =
                        new Date(
                            p.hora_pedido || p.created_at || '',
                        ).getTime() || 0;

                    return acc === 0 || (t > 0 && t < acc) ? t : acc;
                }, 0);

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

        const minutos = Math.max(
            1,
            Math.floor((Date.now() - timestamp) / 60000),
        );

        if (minutos < 60) {
            return `Hace ${minutos} min`;
        }

        const horas = Math.floor(minutos / 60);
        const resto = minutos % 60;

        return resto > 0 ? `Hace ${horas} h ${resto} min` : `Hace ${horas} h`;
    };

    const abrirCobro = (mesa: MesaSalon, pedidosMesa: PedidoSalon[]) => {
        // Calcular subtotal, igv y total
        const total = pedidosMesa.reduce(
            (sum, p) =>
                sum +
                (typeof p.total === 'number'
                    ? p.total
                    : parseFloat(p.total) || 0),
            0,
        );
        const igv = pedidosMesa.reduce(
            (sum, p) =>
                sum +
                (typeof p.igv === 'number'
                    ? p.igv
                    : parseFloat(p.igv || '0') || 0),
            0,
        );
        const subtotal = total - igv;

        // Aplanar todos los productos
        const productos = pedidosMesa.flatMap((p) => {
            const prods =
                typeof p.productos === 'string'
                    ? JSON.parse(p.productos)
                    : p.productos;

            return Array.isArray(prods) ? prods : [];
        });

        setDatosBoleta({
            pedidoIds: pedidosMesa.map((p) => p.id),
            mesaId: mesa.id,
            cliente: 'CLIENTES VARIOS',
            mesa: mesa.numero,
            tipo: 'salon',
            productos: productos,
            subtotal: subtotal,
            igv: igv,
            total: total,
        });
        setModalBoletaAbierto(true);
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
                prev.map((p) =>
                    p.id === payload.id ? { ...p, ...payload } : p,
                ),
            );
        },
        'pedido.creado': (payload: any) => {
            setPedidosLista((prev) =>
                prev.some((p) => p.id === payload.id)
                    ? prev
                    : [...prev, payload],
            );
        },
    });

    // Guardar carrito en localStorage
    useEffect(() => {
        localStorage.setItem('carritoCaja', JSON.stringify(carrito));
    }, [carrito]);

    // Obtener categorías únicas con conteo
    const categorias = () => {
        const cats = productos.reduce(
            (acc, p) => {
                if (!acc[p.categoria]) {
                    acc[p.categoria] = { count: 0, stockBajo: 0 };
                }

                acc[p.categoria].count++;

                if (p.stock !== undefined && p.stock <= 2 && p.disponible) {
                    acc[p.categoria].stockBajo++;
                }

                return acc;
            },
            {} as Record<string, { count: number; stockBajo: number }>,
        );

        return Object.entries(cats).map(([nombre, data]) => ({
            nombre,
            count: data.count,
            stockBajo: data.stockBajo,
        }));
    };

    // Filtrar productos
    const productosFiltrados = productos.filter((p) => {
        if (categoriaSeleccionada && p.categoria !== categoriaSeleccionada) {
            return false;
        }

        if (
            busqueda &&
            !p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
            !p.categoria.toLowerCase().includes(busqueda.toLowerCase())
        ) {
            return false;
        }

        return true;
    });

    const getIconoCategoria = (categoria: string) => {
        const icons: Record<string, any> = {
            Todos: LayoutGrid,
            Café: CoffeeIcon,
            'Café Premium': Sparkles,
            'Café Frío': Snowflake,
            Té: CupSoda,
            Snacks: Utensils,
        };

        return icons[categoria] || CoffeeIcon;
    };

    const agregarProducto = (producto: Producto) => {
        if (!producto.disponible) {
            toast.warning('Este producto no está disponible');

            return;
        }

        if (producto.stock !== undefined && producto.stock <= 0) {
            toast.warning('Este producto está agotado');

            return;
        }

        const existente = carrito.find((item) => item.id === producto.id);

        if (existente) {
            if (
                producto.stock !== undefined &&
                existente.cantidad + 1 > producto.stock
            ) {
                toast.error('No hay suficiente stock');

                return;
            }

            setCarrito((prev) =>
                prev.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item,
                ),
            );
        } else {
            setCarrito((prev) => [
                ...prev,
                {
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad: 1,
                    imagen: producto.imagen,
                },
            ]);
        }
    };

    const quitarProducto = (id: number) => {
        setCarrito((prev) => {
            const existente = prev.find((item) => item.id === id);

            if (existente && existente.cantidad > 1) {
                return prev.map((item) =>
                    item.id === id
                        ? { ...item, cantidad: item.cantidad - 1 }
                        : item,
                );
            }

            return prev.filter((item) => item.id !== id);
        });
    };

    const eliminarProducto = (id: number) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    // Calcular totales (el precio del producto ya incluye IGV)
    const bruto = carrito.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0,
    );
    const subtotal = Math.round((bruto / 1.18) * 100) / 100;
    const igv = Math.round((bruto - subtotal) * 100) / 100;
    const total = Math.round(bruto * 100) / 100;

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
        const productosSinStock = carrito.filter((item) => {
            const producto = productos.find((p) => p.id === item.id);

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
            productos: carrito.map((item) => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.precio * item.cantidad,
            })),
            subtotal: subtotal,
            igv: igv,
            total: total,
        };

        router.post('/caja/registrar', pedidoData, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                // Obtener el ID del pedido que devuelve el backend
                const pedidoId = page.props.flash?.pedido_id;
                console.log('Pedido ID recibido:', pedidoId);

                // Guardar datos de la boleta y abrir modal
                setDatosBoleta({
                    pedidoIds: pedidoId ? [pedidoId] : [],
                    cliente: cliente || 'Anónimo',
                    mesa: mesa || null,
                    tipo: tipoPedido,
                    productos: carrito.map((item) => ({
                        id: item.id,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio: item.precio,
                        subtotal: item.precio * item.cantidad,
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
                const errorMsg =
                    typeof errors === 'object'
                        ? Object.values(errors).flat().join(' ')
                        : errors;
                toast.error('Error al registrar pedido', {
                    description: errorMsg || 'Intenta nuevamente',
                    duration: 5000,
                });
            },
        });
    };

    const categoriasData = categorias();

    return (
        <>
            <Head title="Caja" />
            <div className="flex min-h-full flex-1 flex-col gap-4 overflow-x-clip p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-cocoa">
                        <span className="rounded-lg border border-black/5 bg-card px-3 py-1 font-semibold text-chocolate">
                            Pedido #{siguienteNumeroPedido}
                        </span>
                        <span className="rounded-lg border border-black/5 bg-card px-3 py-1">
                            Caja {caja?.caja || '—'}
                        </span>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1 text-green-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        ABIERTA
                    </span>
                </div>

                {/* Layout Principal */}
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_400px]">
                    {/* ============================================================ */}
                    {/* COLUMNA IZQUIERDA: Productos */}
                    {/* ============================================================ */}
                    <div className="min-w-0">
                        {/* Buscador */}
                        <div className="relative mb-4">
                            <Search
                                className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-cocoa-soft"
                                strokeWidth={2}
                            />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                className="w-full rounded-xl border border-wheat bg-card p-3 pl-10 text-chocolate shadow-sm outline-none placeholder:text-cocoa-soft focus:border-transparent focus:ring-2 focus:ring-roast/15"
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
                                    onClick={() =>
                                        setCategoriaSeleccionada(null)
                                    }
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-cocoa-soft hover:text-cocoa"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Categorías */}
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
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
                                    isActive={
                                        categoriaSeleccionada === cat.nombre
                                    }
                                    onClick={() => {
                                        setCategoriaSeleccionada(cat.nombre);
                                        setBusqueda('');
                                    }}
                                    stockStatus={
                                        cat.stockBajo > 0 ? 'bajo' : 'normal'
                                    }
                                />
                            ))}
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {productosFiltrados.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-cocoa-soft">
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
                                        className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-card transition hover:shadow-md ${
                                            producto.disponible &&
                                            (producto.stock === undefined ||
                                                producto.stock > 0)
                                                ? 'cursor-pointer hover:border-gold/50 active:scale-[0.98]'
                                                : 'cursor-not-allowed opacity-70'
                                        }`}
                                        onClick={() => {
                                            if (
                                                producto.disponible &&
                                                (producto.stock === undefined ||
                                                    producto.stock > 0)
                                            ) {
                                                agregarProducto(producto);
                                            } else {
                                                toast.warning(
                                                    'Este producto no está disponible',
                                                );
                                            }
                                        }}
                                    >
                                        {/* Badges */}
                                        {!producto.disponible && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/60">
                                                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                                    No disponible
                                                </span>
                                            </div>
                                        )}
                                        {producto.disponible &&
                                            producto.stock !== undefined &&
                                            producto.stock <= 0 && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50">
                                                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                                        Agotado
                                                    </span>
                                                </div>
                                            )}
                                        {producto.disponible &&
                                            producto.stock !== undefined &&
                                            producto.stock <= 2 &&
                                            producto.stock > 0 && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                                                        Últimas {producto.stock}
                                                    </span>
                                                </div>
                                            )}

                                        {/* Imagen */}
                                        <div className="flex h-32 items-center justify-center overflow-hidden bg-cream-pale">
                                            <ProductImage
                                                src={producto.imagen}
                                                alt={producto.nombre}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Información */}
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-chocolate">
                                                {producto.nombre}
                                            </p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <p className="font-bold text-gold">
                                                    S/{' '}
                                                    {Number(
                                                        producto.precio,
                                                    ).toFixed(2)}
                                                </p>
                                                {producto.stock !== undefined &&
                                                    producto.stock > 0 && (
                                                        <span className="text-xs text-cocoa-soft">
                                                            Stock:{' '}
                                                            {producto.stock}
                                                        </span>
                                                    )}
                                            </div>
                                            <p className="text-xs text-cocoa-soft">
                                                {producto.categoria}
                                            </p>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    if (
                                                        producto.disponible &&
                                                        (producto.stock ===
                                                            undefined ||
                                                            producto.stock > 0)
                                                    ) {
                                                        agregarProducto(
                                                            producto,
                                                        );
                                                    } else {
                                                        toast.warning(
                                                            'Este producto no está disponible',
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    !producto.disponible ||
                                                    (producto.stock !==
                                                        undefined &&
                                                        producto.stock <= 0)
                                                }
                                                className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                                                    producto.disponible &&
                                                    (producto.stock ===
                                                        undefined ||
                                                        producto.stock > 0)
                                                        ? 'bg-gold text-ink hover:bg-gold-deep'
                                                        : 'cursor-not-allowed bg-wheat text-cocoa'
                                                }`}
                                            >
                                                {producto.disponible &&
                                                (producto.stock === undefined ||
                                                    producto.stock > 0)
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
                    <div className="min-w-0 md:sticky md:top-20 md:h-fit md:self-start">
                        <div className="mb-3 h-fit rounded-2xl border border-black/5 bg-card p-4 shadow-sm md:flex md:max-h-[calc(100dvh_-_8rem)] md:flex-col">
                            {/* Cabecera */}
                            <div className="mb-3 flex shrink-0 items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-chocolate">
                                    <ShoppingCart
                                        className="h-4 w-4"
                                        strokeWidth={2.25}
                                    />
                                    Pedido
                                </h2>
                                <button
                                    onClick={limpiarCarrito}
                                    className="text-sm text-cocoa-soft transition hover:text-red-500"
                                >
                                    Limpiar
                                </button>
                            </div>

                            <div className="mb-3 grid shrink-0 grid-cols-3 gap-1">
                                <button
                                    onClick={() => setTipoPedido('salon')}
                                    className={`rounded-lg py-1.5 text-xs font-medium transition ${
                                        tipoPedido === 'salon'
                                            ? 'bg-gold text-ink'
                                            : 'bg-sand text-cocoa hover:bg-wheat'
                                    }`}
                                >
                                    Salón
                                </button>
                                <button
                                    onClick={() => setTipoPedido('llevar')}
                                    className={`rounded-lg py-1.5 text-xs font-medium transition ${
                                        tipoPedido === 'llevar'
                                            ? 'bg-gold text-ink'
                                            : 'bg-sand text-cocoa hover:bg-wheat'
                                    }`}
                                >
                                    Llevar
                                </button>
                                <button
                                    onClick={() => setTipoPedido('delivery')}
                                    className={`rounded-lg py-1.5 text-xs font-medium transition ${
                                        tipoPedido === 'delivery'
                                            ? 'bg-gold text-ink'
                                            : 'bg-sand text-cocoa hover:bg-wheat'
                                    }`}
                                >
                                    Delivery
                                </button>
                            </div>

                            {/* ============ BANDEJA DE PEDIDOS DE SALÓN ============ */}
                            {tipoPedido === 'salon' ? (
                                <div className="flex flex-col gap-2 md:min-h-0 md:flex-1">
                                    <div className="relative shrink-0">
                                        <Search
                                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft"
                                            strokeWidth={2}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Buscar mesa o pedido... (Ej: M03, #1004)"
                                            className="w-full rounded-lg border border-black/5 bg-cream p-2 pl-9 text-sm outline-none focus:ring-1 focus:ring-gold"
                                            value={busquedaSalon}
                                            onChange={(e) => {
                                                setBusquedaSalon(
                                                    e.target.value,
                                                );
                                                setVisibles(10);
                                            }}
                                        />
                                    </div>

                                    {bandejaVisibles.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-6">
                                            <Receipt
                                                className="h-8 w-8 text-cocoa-soft"
                                                strokeWidth={1.5}
                                            />
                                            <p className="text-sm text-cocoa-soft">
                                                {busquedaSalon
                                                    ? 'Sin resultados en la búsqueda'
                                                    : 'No hay pedidos de Salón por cobrar'}
                                            </p>
                                            {!busquedaSalon && (
                                                <p className="text-center text-xs text-cocoa-soft">
                                                    Las mesas con todos sus
                                                    pedidos entregados
                                                    aparecerán aquí
                                                    automáticamente.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-0.5">
                                            <div className="space-y-2">
                                                {bandejaVisibles.map(
                                                    ({
                                                        mesa,
                                                        pedidos: pedidosMesa,
                                                        total,
                                                    }) => (
                                                        <div
                                                            key={mesa.id}
                                                            className="flex items-center justify-between gap-2 border-b border-black/5 py-2.5"
                                                        >
                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-cream-pale text-sm font-bold text-gold">
                                                                    {
                                                                        mesa.numero
                                                                    }
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-chocolate">
                                                                        Mesa{' '}
                                                                        {
                                                                            mesa.numero
                                                                        }
                                                                    </p>
                                                                    <p className="truncate text-xs text-cocoa-soft">
                                                                        {pedidosMesa
                                                                            .map(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.numero,
                                                                            )
                                                                            .join(
                                                                                ' · ',
                                                                            )}
                                                                        {total >
                                                                            0 && (
                                                                            <span className="ml-1 font-semibold text-gold">
                                                                                S/{' '}
                                                                                {total.toFixed(
                                                                                    2,
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                                                {(() => {
                                                                    const ts =
                                                                        pendientesFiltrados.find(
                                                                            (
                                                                                g,
                                                                            ) =>
                                                                                g
                                                                                    .mesa
                                                                                    .id ===
                                                                                mesa.id,
                                                                        )
                                                                            ?.masAntiguo ||
                                                                        0;
                                                                    const rel =
                                                                        tiempoRelativo(
                                                                            ts,
                                                                        );

                                                                    return (
                                                                        rel && (
                                                                            <span className="flex items-center gap-1 text-[10px] text-cocoa-soft">
                                                                                <Clock className="h-3 w-3" />
                                                                                {
                                                                                    rel
                                                                                }
                                                                            </span>
                                                                        )
                                                                    );
                                                                })()}
                                                                <button
                                                                    onClick={() =>
                                                                        abrirCobro(
                                                                            mesa,
                                                                            pedidosMesa,
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-roast px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ink-deep active:scale-95"
                                                                >
                                                                    COBRAR
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>

                                            {pendientesFiltrados.length >
                                                visibles && (
                                                <button
                                                    onClick={() =>
                                                        setVisibles(
                                                            (v) => v + 10,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-gold/30 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                    Mostrar más (
                                                    {pendientesFiltrados.length -
                                                        visibles}{' '}
                                                    restantes)
                                                </button>
                                            )}

                                            <p className="pt-1 text-center text-xs text-cocoa-soft">
                                                {pendientesFiltrados.length ===
                                                1
                                                    ? '1 pedido pendiente'
                                                    : `${pendientesFiltrados.length} pedidos pendientes`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col md:min-h-0 md:flex-1">
                                    <div className="md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-0.5">
                                        {carrito.length === 0 ? (
                                            <div className="flex flex-col items-center gap-2 py-6">
                                                <ShoppingCart
                                                    className="h-8 w-8 text-cocoa-soft"
                                                    strokeWidth={1.5}
                                                />
                                                <p className="text-sm text-cocoa-soft">
                                                    Sin productos
                                                </p>
                                            </div>
                                        ) : (
                                            carrito.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between border-b border-black/5 py-2"
                                                >
                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-cream-pale">
                                                            <ProductImage
                                                                src={
                                                                    item.imagen
                                                                }
                                                                alt={
                                                                    item.nombre
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-chocolate">
                                                                {item.nombre}
                                                            </p>
                                                            <p className="text-xs text-cocoa-soft">
                                                                S/{' '}
                                                                {item.precio.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                x{' '}
                                                                {item.cantidad}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-shrink-0 items-center gap-1">
                                                        <button
                                                            onClick={() =>
                                                                quitarProducto(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-90"
                                                        >
                                                            <Minus
                                                                className="h-3.5 w-3.5"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        </button>
                                                        <span className="w-4 text-center text-sm font-bold text-chocolate">
                                                            {item.cantidad}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const producto =
                                                                    productos.find(
                                                                        (p) =>
                                                                            p.id ===
                                                                            item.id,
                                                                    );

                                                                if (producto) {
                                                                    agregarProducto(
                                                                        producto,
                                                                    );
                                                                }
                                                            }}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-roast/5 text-chocolate transition hover:bg-roast/10 active:scale-90"
                                                        >
                                                            <Plus
                                                                className="h-3.5 w-3.5"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                eliminarProducto(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="ml-1 text-sm text-red-400 transition hover:text-red-600"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Totales y acciones */}
                                    {carrito.length > 0 && (
                                        <div className="mt-4 shrink-0 border-t border-black/5 pt-4">
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-cocoa">
                                                        Subtotal
                                                    </span>
                                                    <span className="font-medium">
                                                        S/ {subtotal.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-cocoa">
                                                        IGV (18%)
                                                    </span>
                                                    <span className="font-medium">
                                                        S/ {igv.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-black/5 pt-2 text-base font-bold">
                                                    <span className="text-chocolate">
                                                        Total
                                                    </span>
                                                    <span className="text-gold">
                                                        S/ {total.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={realizarPedido}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-roast py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-deep active:scale-95"
                                            >
                                                <Receipt
                                                    className="h-4 w-4"
                                                    strokeWidth={2.25}
                                                />
                                                Realizar Pedido
                                                <ArrowRight
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2.25}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
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
