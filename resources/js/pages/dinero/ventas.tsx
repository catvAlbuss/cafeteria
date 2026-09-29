import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
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
    ImageOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ModalEditarPedido from '@/components/modals/ModalEditarPedido';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import { detectarArea } from '@/utils/clasificarPedidos';

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
    libre: {
        label: 'Libre',
        soft: 'bg-[var(--status-success)]/10 text-[var(--status-success)]',
        solid: 'bg-[var(--status-success)]',
    },
    pendiente: {
        label: 'Pendiente',
        soft: 'bg-[var(--status-warning)]/10 text-[var(--status-warning)]',
        solid: 'bg-[var(--status-warning)]',
    },
    ocupada: {
        label: 'Ocupada',
        soft: 'bg-[var(--status-danger)]/10 text-[var(--status-danger)]',
        solid: 'bg-[var(--status-danger)]',
    },
    reserva: {
        label: 'Reserva',
        soft: 'bg-[var(--status-info)]/10 text-[var(--status-info)]',
        solid: 'bg-[var(--status-info)]',
    },
    listo_cobrar: {
        label: 'Cobrar',
        soft: 'bg-[var(--status-special)]/10 text-[var(--status-special)]',
        solid: 'bg-[var(--status-special)]',
    },
} as const;

const getEstadoConfig = (estado: string) =>
    ESTADOS[estado as keyof typeof ESTADOS] ?? ESTADOS.libre;

// ============================================================
// COMPONENTE: Imagen con fallback
// ============================================================
const ProductImage = ({
    src,
    alt,
    className = 'w-full h-full object-cover',
    onError,
}: {
    src?: string;
    alt: string;
    className?: string;
    onError?: (e: any) => void;
}) => {
    const [hasError, setHasError] = useState(false);

    const handleImageError = (e: any) => {
        setHasError(true);

        if (onError) {
            onError(e);
        }
    };

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
            onError={handleImageError}
            loading="lazy"
            decoding="async"
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
    const [pedidosActivos, setPedidosActivos] =
        useState<any[]>(pedidosActivosProp);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(
        null,
    );
    const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
    const [pedidoEnviado, setPedidoEnviado] = useState(false);
    const [modalListaAbierto, setModalListaAbierto] = useState(false);

    useEffect(() => {
        if (platos && platos.length > 0) {
            const productosProcesados = platos.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                precio:
                    typeof p.precio === 'string'
                        ? parseFloat(p.precio)
                        : p.precio,
                categoria: p.categoria || '',
                imagen: p.imagen || '/img/productos/placeholder.jpeg',
                stock:
                    typeof p.stock === 'string' ? parseInt(p.stock) : p.stock,
                disponible: p.disponible === 1 || p.disponible === true,
            }));
            setProductos(productosProcesados);
        }
    }, [platos]);

    const urlParams = new URLSearchParams(window.location.search);
    const mesaInicial = urlParams.get('mesa') || '';
    const [mesa] = useState(mesaInicial);
    const [mesaInfo, setMesaInfo] = useState<MesaInfo | null>(mesaInfoProp);

    useSedeChannel('pedidos', {
        'pedido.creado': (pedido: any) => {
            if (
                pedido.mesa_id !== mesaInfo?.id ||
                pedido.estado !== 'pendiente'
            ) {
                return;
            }

            setPedidosActivos((current) =>
                current.some((item) => item.id === pedido.id)
                    ? current
                    : [pedido, ...current],
            );
        },
        'pedido.actualizado': (pedido: any) => {
            setPedidosActivos((current) =>
                ['pagado', 'cancelado'].includes(pedido.estado)
                    ? current.filter((item) => item.id !== pedido.id)
                    : current.map((item) =>
                          item.id === pedido.id ? { ...item, ...pedido } : item,
                      ),
            );
        },
    });

    // ============================================================
    // EFECTOS
    // ============================================================
    // Procesar productos desde props
    useEffect(() => {
        if (platos && platos.length > 0) {
            const productosProcesados = platos.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                precio:
                    typeof p.precio === 'string'
                        ? parseFloat(p.precio)
                        : p.precio,
                categoria: p.categoria || '',
                imagen: p.imagen || '',
                stock:
                    typeof p.stock === 'string' ? parseInt(p.stock) : p.stock,
                disponible: p.disponible === 1 || p.disponible === true,
            }));
            setProductos(productosProcesados);
        }
    }, [platos]);

    // Mantener pedidosActivos sincronizado con lo que devuelve el backend
    useEffect(() => {
        setPedidosActivos(pedidosActivosProp);
    }, [pedidosActivosProp]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                router.reload({
                    only: ['pedidosActivos', 'mesaInfo'],
                    preserveUrl: true,
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () =>
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
    }, []);

    // Obtener información de la mesa desde API si no viene en props
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');

        if (mesa && !mesaInfoProp) {
            axios
                .get(`/api/mesas/${mesa}`)
                .then((response) => setMesaInfo(response.data))
                .catch(() => {
                    /* Silencioso */
                });
        }
    }, [mesaInfoProp]);

    // ============================================================
    // FUNCIONES DE CARRITO
    // ============================================================
    const totalConIgv = carrito.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0,
    );
    const subtotalCarrito = Math.round((totalConIgv / 1.18) * 100) / 100;
    const igvCarrito = Math.round((totalConIgv - subtotalCarrito) * 100) / 100;
    const agregarProducto = (producto: Producto) => {
        if (!producto.disponible) {
            toast.warning('Este producto no está disponible');

            return;
        }

        if (producto.stock <= 0) {
            toast.warning('Este producto está agotado');

            return;
        }

        const existente = carrito.find((item) => item.id === producto.id);

        if (existente) {
            if (existente.cantidad + 1 > producto.stock) {
                toast.error('No hay suficiente stock');

                return;
            }

            setCarrito(
                carrito.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item,
                ),
            );
        } else {
            setCarrito([
                ...carrito,
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
        const existente = carrito.find((item) => item.id === id);

        if (existente && existente.cantidad > 1) {
            setCarrito(
                carrito.map((item) =>
                    item.id === id
                        ? { ...item, cantidad: item.cantidad - 1 }
                        : item,
                ),
            );
        } else {
            setCarrito(carrito.filter((item) => item.id !== id));
        }
    };

    // ============================================================
    // ENVIAR PEDIDO - CON VALIDACIÓN DE MESA
    // ============================================================
    const enviarPedido = () => {
        // ⭐ VALIDACIÓN: Verificar que haya una mesa seleccionada
        if (!mesaInfo || !mesaInfo.id) {
            toast.warning('Selecciona una mesa', {
                description:
                    'Para enviar un pedido, primero debes seleccionar una mesa desde el módulo de Mesas.',
                duration: 5000,
                style: {
                    background: 'var(--ink)',
                    color: 'var(--latte)',
                    border: '1px solid var(--gold)',
                },
                action: {
                    label: 'Ir a Mesas',
                    onClick: () => router.visit('/mesas'),
                },
            });

            return;
        }

        if (carrito.length === 0) {
            toast.warning('Agrega productos al pedido');

            return;
        }

        // Verificar stock
        const productosSinStock = carrito.filter((item) => {
            const producto = productos.find((p) => p.id === item.id);

            return producto && item.cantidad > producto.stock;
        });

        if (productosSinStock.length > 0) {
            toast.error('Algunos productos no tienen stock suficiente');

            return;
        }

        const productosConCategoria = carrito.map((item) => {
            const productoOriginal = productos.find((p) => p.id === item.id);

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

        const areaDetectada = detectarArea(productosConCategoria);

        router.post(
            '/pedidos',
            {
                mesa_id: mesaInfo.id, // ✅ Ya no puede ser null gracias a la validación
                cliente: 'Anónimo',
                productos: productosConCategoria,
                subtotal: subtotalCarrito,
                igv: igvCarrito,
                total: totalConIgv,
                area: areaDetectada,
                observaciones: '',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pedido enviado a cocina', {
                        description: `Mesa: ${mesaInfo?.numero || 'No asignada'} · Mesero: ${mesaInfo?.mesero || 'No asignado'} · Total: S/ ${totalConIgv.toFixed(2)} · Área: ${areaDetectada}`,
                        duration: 5000,
                        style: {
                            background: 'var(--ink)',
                            color: 'var(--latte)',
                            border: '1px solid var(--gold)',
                        },
                    });

                    setCarrito([]);
                },
                onError: (errors) => {
                    toast.error(
                        'Error al enviar pedido: ' +
                            Object.values(errors).join(' '),
                    );
                },
            },
        );
    };
    // ============================================================
    // FILTRADO DE PRODUCTOS
    // ============================================================
    const productosFiltrados = productos
        .filter((p) => p.stock > 0)
        .filter(
            (p) =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.categoria.toLowerCase().includes(busqueda.toLowerCase()),
        );

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <>
            <Head title="Ventas" />
            <div className="min-h-screen space-y-4 bg-cream p-4 md:p-6">
                {/* Información de la mesa */}
                {mesaInfo &&
                    carrito.length === 0 &&
                    pedidosActivos.length === 0 && (
                        <div className="relative rounded-2xl border border-black/5 bg-card p-4 shadow-sm sm:p-5">
                            <div className="absolute -top-2 -right-2">
                                <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm ${getEstadoConfig(mesaInfo.estado).solid}`}
                                >
                                    {getEstadoConfig(mesaInfo.estado).label}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                {/* Mesa */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-cream">
                                        <span className="text-lg font-bold text-chocolate">
                                            #{mesaInfo.numero}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold tracking-wider text-cocoa-soft uppercase">
                                            Mesa
                                        </p>
                                        <p className="text-sm font-medium text-chocolate">
                                            {mesaInfo.capacidad} personas
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden h-10 w-px bg-black/5 sm:block" />

                                {/* Mesero */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-roast/5">
                                        <UserRound
                                            className="h-5 w-5 text-chocolate"
                                            strokeWidth={2}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold tracking-wider text-cocoa-soft uppercase">
                                            Mesero
                                        </p>
                                        <p className="text-sm font-medium text-chocolate">
                                            {mesaInfo.mesero || 'No asignado'}
                                        </p>
                                    </div>
                                </div>

                                {/* Sillas */}
                                <div className="ml-auto flex items-center gap-2 rounded-full border border-black/5 bg-cream px-3 py-1.5">
                                    <Armchair
                                        className="h-4 w-4 text-cocoa-soft"
                                        strokeWidth={2}
                                    />
                                    <span className="text-sm font-medium text-chocolate">
                                        {mesaInfo.sillas} sillas
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* COLUMNA 1: Productos */}
                    <div className="lg:col-span-2">
                        {/* Buscador */}
                        <div className="relative mb-4">
                            <Search
                                className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-cocoa-soft"
                                strokeWidth={2}
                            />
                            <input
                                type="text"
                                placeholder="Buscar producto (ej: café, latte, sandwich...)"
                                className="w-full rounded-xl border border-wheat bg-card p-3 pl-10 text-chocolate shadow-sm outline-none placeholder:text-cocoa-soft focus:border-transparent focus:ring-2 focus:ring-roast/15"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {productosFiltrados.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-cocoa-soft">
                                    {busqueda
                                        ? 'No se encontraron productos'
                                        : 'No hay productos disponibles'}
                                </div>
                            ) : (
                                productosFiltrados.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-card transition hover:shadow-md ${
                                            producto.disponible &&
                                            producto.stock > 0
                                                ? 'cursor-pointer hover:border-gold/50 active:scale-[0.98]'
                                                : 'cursor-not-allowed opacity-70'
                                        }`}
                                        onClick={() => {
                                            if (
                                                producto.disponible &&
                                                producto.stock > 0
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
                                            producto.stock <= 0 && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50">
                                                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                                        Agotado
                                                    </span>
                                                </div>
                                            )}

                                        {/* Imagen */}
                                        <div className="flex h-32 items-center justify-center overflow-hidden bg-cream-pale">
                                            <ProductImage
                                                src={producto.imagen}
                                                alt={producto.nombre}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"

                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        '/img/productos/placeholder.jpeg';
                                                }}
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
                                                <span className="text-xs text-cocoa-soft">
                                                    Stock: {producto.stock}
                                                </span>
                                            </div>
                                            <p className="text-xs text-cocoa-soft">
                                                {producto.categoria}
                                            </p>

                                            {/* Botón Agregar */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    if (
                                                        producto.disponible &&
                                                        producto.stock > 0
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
                                                    producto.stock <= 0
                                                }
                                                className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition ${
                                                    producto.disponible &&
                                                    producto.stock > 0
                                                        ? 'bg-gold text-ink hover:bg-gold-deep'
                                                        : 'cursor-not-allowed bg-wheat text-cocoa'
                                                }`}
                                            >
                                                {producto.disponible &&
                                                producto.stock > 0
                                                    ? '+ Agregar'
                                                    : 'No disponible'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Carrito */}
                    <div className="h-fit rounded-2xl border border-black/5 bg-card p-4 shadow-sm">
                        <h2 className="mb-3 flex items-center gap-2 font-bold text-chocolate">
                            <ShoppingCart
                                className="h-4 w-4"
                                strokeWidth={2.25}
                            />
                            Pedido
                        </h2>

                        {carrito.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8">
                                <ShoppingBag
                                    className="h-8 w-8 text-cocoa-soft"
                                    strokeWidth={1.5}
                                />
                                <p className="text-sm text-cocoa-soft">
                                    Sin productos
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-64 space-y-2 overflow-y-auto">
                                {carrito.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between border-b border-black/5 py-2"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-cream-pale">
                                                <ProductImage
                                                    src={item.imagen}
                                                    alt={item.nombre}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).src =
                                                            '/img/productos/placeholder.jpeg';
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-chocolate">
                                                    {item.nombre}
                                                </p>
                                                <p className="text-xs text-cocoa-soft">
                                                    S/ {item.precio.toFixed(2)}{' '}
                                                    x {item.cantidad}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-shrink-0 items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    quitarProducto(item.id)
                                                }
                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-90"
                                            >
                                                <Minus
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2.5}
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

                                                    if (
                                                        producto &&
                                                        producto.stock >
                                                            item.cantidad
                                                    ) {
                                                        agregarProducto(
                                                            producto,
                                                        );
                                                    } else {
                                                        toast.error(
                                                            'Stock insuficiente',
                                                        );
                                                    }
                                                }}
                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-roast/5 text-chocolate transition hover:bg-roast/10 active:scale-90"
                                            >
                                                <Plus
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={2.5}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {carrito.length > 0 && (
                            <div className="mt-4 space-y-1 border-t border-black/5 pt-4">
                                <div className="flex justify-between text-sm text-cocoa">
                                    <span>Subtotal</span>
                                    <span>S/ {subtotalCarrito.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-cocoa">
                                    <span>IGV (18%)</span>
                                    <span>S/ {igvCarrito.toFixed(2)}</span>
                                </div>
                                <div className="flex items-baseline justify-between font-bold text-chocolate">
                                    <span className="text-sm">Total</span>
                                    <span className="text-lg text-gold">
                                        S/ {totalConIgv.toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={enviarPedido}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-roast py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-deep active:scale-95"
                                >
                                    <Send
                                        className="h-4 w-4"
                                        strokeWidth={2.25}
                                    />
                                    Enviar Pedido
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== PEDIDOS ACTIVOS: resumen de una sola tarjeta ===== */}
                {pedidosActivos.length > 0 &&
                    (() => {
                        const totalProductos = pedidosActivos.reduce(
                            (sum, p) => sum + (p.productos?.length || 0),
                            0,
                        );
                        const totalMonto = pedidosActivos.reduce(
                            (sum, p) => sum + Number(p.total || 0),
                            0,
                        );

                        return (
                            <div className="mt-4">
                                <div
                                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-sand bg-card p-4 shadow-sm transition hover:border-gold"
                                    onClick={() => setModalListaAbierto(true)}
                                >
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-chocolate">
                                        <Package className="h-4 w-4" />
                                        Mesa {mesaInfo?.numero || '?'} ·{' '}
                                        {totalProductos} producto
                                        {totalProductos !== 1 ? 's' : ''}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gold">
                                            S/ {totalMonto.toFixed(2)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setModalListaAbierto(true);
                                            }}
                                            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-gold-deep"
                                        >
                                            Ver pedidos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                {/* ===== MODAL: LISTA DE TICKETS DE LA MESA ===== */}
                {modalListaAbierto && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
                            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                                <h3 className="font-bold text-chocolate">
                                    Mesa {mesaInfo?.numero || '?'} ·{' '}
                                    {pedidosActivos.length} ticket
                                    {pedidosActivos.length !== 1 ? 's' : ''}
                                </h3>
                                <button
                                    onClick={() => setModalListaAbierto(false)}
                                    className="text-xl leading-none text-cocoa-soft hover:text-cocoa"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-2 overflow-y-auto p-4">
                                {pedidosActivos.map((pedido, index) => {
                                    const editable =
                                        pedido.estado === 'pendiente';
                                    const badgeColor: Record<string, string> = {
                                        pendiente:
                                            'bg-amber-100 text-amber-700 border-amber-200',
                                        preparando:
                                            'bg-blue-100 text-blue-700 border-blue-200',
                                        listo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                        entregado:
                                            'bg-green-100 text-green-700 border-green-200',
                                    };

                                    return (
                                        <div
                                            key={pedido.id ?? index}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-sand bg-cream p-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-medium text-chocolate">
                                                        {pedido.numero}
                                                    </p>
                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColor[pedido.estado] || badgeColor.pendiente}`}
                                                    >
                                                        {pedido.estado}
                                                    </span>
                                                </div>
                                                <p className="truncate text-xs text-cocoa-soft">
                                                    {pedido.productos
                                                        .map(
                                                            (prod: any) =>
                                                                `${prod.nombre} x${prod.cantidad}`,
                                                        )
                                                        .join(' · ')}
                                                    {' · '}S/{' '}
                                                    {Number(
                                                        pedido.total,
                                                    ).toFixed(2)}
                                                </p>
                                            </div>

                                            {editable ? (
                                                <button
                                                    onClick={() => {
                                                        setPedidoSeleccionado(
                                                            pedido,
                                                        );
                                                        setModalEdicionAbierto(
                                                            true,
                                                        );
                                                        setModalListaAbierto(
                                                            false,
                                                        );
                                                    }}
                                                    className="flex-shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-gold-deep"
                                                >
                                                    Editar
                                                </button>
                                            ) : (
                                                <span className="flex-shrink-0 text-[10px] text-cocoa-soft italic">
                                                    En cocina, no editable
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
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
                        onPedidoActualizado={(pedidoActualizado) => {
                            console.log(
                                '📥 Pedido recibido en Ventas:',
                                pedidoActualizado,
                            );

                            setPedidosActivos((prev) =>
                                prev.map((p) =>
                                    p.id === pedidoActualizado.id
                                        ? {
                                              ...pedidoActualizado,
                                              productos:
                                                  pedidoActualizado.productos,
                                          }
                                        : p,
                                ),
                            );
                            setModalEdicionAbierto(false);
                            setPedidoSeleccionado(null);
                            toast.success('Pedido actualizado');
                        }}
                        onPedidoCancelado={() => {
                            setModalEdicionAbierto(false);
                            setPedidoSeleccionado(null);
                            toast.success('Pedido cancelado');
                        }}
                    />
                )}
            </div>
        </>
    );
}

Ventas.layout = {
    breadcrumbs: [
        {
            title: 'Ventas',
            href: '/ventas',
        },
    ],
};
