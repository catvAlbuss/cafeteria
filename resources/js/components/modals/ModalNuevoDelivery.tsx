import { router } from '@inertiajs/react';
import {
    X,
    User,
    MapPin,
    Phone,
    Truck,
    Package,
    DollarSign,
    Clock,
    Calendar,
    Check,
    AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ModalDeliveryProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ProductoDelivery {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
}

export default function ModalDelivery({
    isOpen,
    onClose,
    onSuccess,
}: ModalDeliveryProps) {
    const [cargando, setCargando] = useState(false);
    const [step, setStep] = useState(1); // 1: Datos del pedido, 2: Productos, 3: Confirmación

    // Datos del cliente
    const [cliente, setCliente] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        referencia: '',
    });

    // Datos del delivery
    const [delivery, setDelivery] = useState({
        tipo: 'delivery', // delivery, llevar
        metodo_pago: 'efectivo',
        observaciones: '',
    });

    // Productos del pedido
    const [productos, setProductos] = useState<ProductoDelivery[]>([]);
    const handleClose = () => {
        setCliente({ nombre: '', telefono: '', direccion: '', referencia: '' });
        setProductos([]);
        setErrores({});
        setStep(1);
        onClose();
    };

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [repartidorSeleccionado, setRepartidorSeleccionado] = useState('');
    const [errores, setErrores] = useState<Record<string, string>>({});

    const repartidores = [
        { id: 1, nombre: 'Carlos Pérez' },
        { id: 2, nombre: 'María Gómez' },
        { id: 3, nombre: 'Juan López' },
        { id: 4, nombre: 'Ana Martínez' },
    ];

    // Productos disponibles (ejemplo)
    const productosDisponibles = [
        { id: 1, nombre: 'Café Americano', precio: 8.0 },
        { id: 2, nombre: 'Cappuccino', precio: 14.0 },
        { id: 3, nombre: 'Matcha Latte', precio: 16.0 },
        { id: 4, nombre: 'Cheesecake', precio: 15.0 },
        { id: 5, nombre: 'Croissant', precio: 6.5 },
        { id: 6, nombre: 'Sándwich de Pollo', precio: 18.0 },
        { id: 7, nombre: 'Jugo Natural', precio: 10.0 },
        { id: 8, nombre: 'Café Latte', precio: 12.0 },
    ];

    // Calcular totales (el precio del producto ya incluye IGV)
    const montoTotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const subtotal = Math.round((montoTotal / 1.18) * 100) / 100;
    const igv = Math.round((montoTotal - subtotal) * 100) / 100;
    const total = Math.round(montoTotal * 100) / 100;

    // Agregar producto
    const agregarProducto = (producto: any) => {
        const existente = productos.find((p) => p.id === producto.id);

        if (existente) {
            setProductos(
                productos.map((p) =>
                    p.id === producto.id
                        ? {
                              ...p,
                              cantidad: p.cantidad + 1,
                              subtotal: (p.cantidad + 1) * p.precio,
                          }
                        : p,
                ),
            );
        } else {
            setProductos([
                ...productos,
                {
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad: 1,
                    subtotal: producto.precio,
                },
            ]);
        }

        setErrores((prev) => ({ ...prev, productos: '' }));
    };

    // Quitar producto
    const quitarProducto = (id: number) => {
        const existente = productos.find((p) => p.id === id);

        if (existente && existente.cantidad > 1) {
            setProductos(
                productos.map((p) =>
                    p.id === id
                        ? {
                              ...p,
                              cantidad: p.cantidad - 1,
                              subtotal: (p.cantidad - 1) * p.precio,
                          }
                        : p,
                ),
            );
        } else {
            setProductos(productos.filter((p) => p.id !== id));
        }
    };

    // Eliminar producto
    const eliminarProducto = (id: number) => {
        setProductos(productos.filter((p) => p.id !== id));
    };

    // Validar paso actual y avanzar si es válido
    const validarYAvanzar = () => {
        const nuevosErrores: Record<string, string> = {};

        if (step === 1) {
            if (!repartidorSeleccionado) {
                nuevosErrores['repartidor'] = 'Selecciona un repartidor';
            }
        } else if (step === 2) {
            if (!cliente.nombre.trim()) {
                nuevosErrores['nombre'] = 'El nombre es obligatorio';
            }

            if (!cliente.telefono.trim()) {
                nuevosErrores['telefono'] = 'El teléfono es obligatorio';
            }

            if (!cliente.direccion.trim()) {
                nuevosErrores['direccion'] = 'La dirección es obligatoria';
            }
        } else if (step === 3) {
            if (productos.length === 0) {
                nuevosErrores['productos'] = 'Agrega al menos un producto';
            }
        }

        setErrores(nuevosErrores);

        if (Object.keys(nuevosErrores).length > 0) {
            toast.warning(
                'Completa los campos obligatorios antes de continuar',
                {
                    description: Object.values(nuevosErrores).join('. '),
                    duration: 3000,
                },
            );

            return;
        }

        setStep(step + 1);
    };

    // Enviar pedido
    const enviarPedido = () => {
        if (!cliente.nombre || !cliente.direccion || productos.length === 0) {
            alert('Complete todos los campos y agregue productos.');

            return;
        }

        setCargando(true);

        const pedidoData = {
            cliente: cliente.nombre,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            referencia: cliente.referencia,
            tipo: delivery.tipo,
            metodo_pago: delivery.metodo_pago,
            productos: productos.map((p) => ({
                nombre: p.nombre,
                cantidad: p.cantidad,
                precio: p.precio,
                subtotal: p.subtotal,
            })),
            subtotal: subtotal,
            igv: igv,
            total: total,
            observaciones: delivery.observaciones,
            estado: 'pendiente',
            tipo_pedido: 'delivery',
            repartidor: repartidorSeleccionado,
        };

        router.post('/delivery', pedidoData, {
            onSuccess: () => {
                setCargando(false);
                onSuccess();
                onClose();
                // Limpiar formulario
                setCliente({
                    nombre: '',
                    telefono: '',
                    direccion: '',
                    referencia: '',
                });
                setProductos([]);
                setStep(1);
            },
            onError: (errors) => {
                setCargando(false);
                alert(
                    'Error al crear delivery: ' +
                        Object.values(errors).join(' '),
                );
            },
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[95vh] w-full max-w-4xl animate-in overflow-hidden rounded-3xl bg-card shadow-2xl duration-200 fade-in zoom-in">
                {/* ===== HEADER ===== */}
                <div className="flex items-center justify-between bg-gradient-to-r from-roast to-espresso px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-lg">
                            <Truck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Nuevo Delivery
                            </h2>
                            <p className="text-xs text-white/60">
                                Registra un nuevo pedido a domicilio
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                        disabled={cargando}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ===== PASOS ===== */}
                <div className="flex items-center justify-center gap-2 border-b border-sand bg-cream px-6 py-3">
                    <div
                        className={`flex items-center gap-2 ${step >= 1 ? 'text-gold' : 'text-cocoa-soft'}`}
                    >
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-gold text-ink' : 'bg-sand/60 text-cocoa-soft'}`}
                        >
                            1
                        </span>
                        <span className="text-sm font-medium">Repartidor</span>
                    </div>
                    <div
                        className={`h-0.5 w-12 ${step >= 2 ? 'bg-gold' : 'bg-sand'}`}
                    />
                    <div
                        className={`flex items-center gap-2 ${step >= 2 ? 'text-gold' : 'text-cocoa-soft'}`}
                    >
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-gold text-ink' : 'bg-sand/60 text-cocoa-soft'}`}
                        >
                            2
                        </span>
                        <span className="text-sm font-medium">Cliente</span>
                    </div>
                    <div
                        className={`h-0.5 w-12 ${step >= 3 ? 'bg-gold' : 'bg-sand'}`}
                    />
                    <div
                        className={`flex items-center gap-2 ${step >= 3 ? 'text-gold' : 'text-cocoa-soft'}`}
                    >
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-gold text-ink' : 'bg-sand/60 text-cocoa-soft'}`}
                        >
                            3
                        </span>
                        <span className="text-sm font-medium">Productos</span>
                    </div>
                    <div
                        className={`h-0.5 w-12 ${step >= 4 ? 'bg-gold' : 'bg-sand'}`}
                    />
                    <div
                        className={`flex items-center gap-2 ${step >= 4 ? 'text-gold' : 'text-cocoa-soft'}`}
                    >
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 4 ? 'bg-gold text-ink' : 'bg-sand/60 text-cocoa-soft'}`}
                        >
                            4
                        </span>
                        <span className="text-sm font-medium">Confirmar</span>
                    </div>
                </div>

                {/* ===== BODY ===== */}
                <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
                    {/* PASO 1: Seleccionar Repartidor */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="py-4 text-center">
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
                                    <User className="h-8 w-8 text-gold" />
                                </div>
                                <h3 className="text-lg font-bold text-chocolate">
                                    Seleccionar Repartidor
                                </h3>
                                <p className="text-sm text-cocoa">
                                    Elige quién realizará la entrega
                                </p>
                            </div>

                            {errores['repartidor'] && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {errores['repartidor']}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {repartidores.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => {
                                            setRepartidorSeleccionado(r.nombre);
                                            setErrores((prev) => ({
                                                ...prev,
                                                repartidor: '',
                                            }));
                                        }}
                                        className={`rounded-xl border-2 p-4 text-left transition ${
                                            repartidorSeleccionado === r.nombre
                                                ? 'border-gold bg-cream ring-2 ring-gold/30'
                                                : 'border-wheat hover:border-gold/50 hover:bg-cream-soft'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand">
                                                <User className="h-5 w-5 text-cocoa" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-chocolate">
                                                    {r.nombre}
                                                </p>
                                                <p className="text-xs text-cocoa-soft">
                                                    Disponible
                                                </p>
                                            </div>
                                            {repartidorSeleccionado ===
                                                r.nombre && (
                                                <div className="ml-auto text-gold">
                                                    <Check className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 1: Datos del Cliente */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {Object.values(errores).some((e) => e) && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    Completa todos los campos obligatorios
                                    marcados
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <User className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full rounded-xl border-2 bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold ${errores['nombre'] ? 'border-red-400 bg-red-50' : 'border-wheat'}`}
                                        value={cliente.nombre}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
                                                    '',
                                                );
                                            setCliente({
                                                ...cliente,
                                                nombre: value,
                                            });

                                            if (value.trim()) {
                                                setErrores((prev) => ({
                                                    ...prev,
                                                    nombre: '',
                                                }));
                                            }
                                        }}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    {errores['nombre'] && (
                                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />{' '}
                                            {errores['nombre']}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <Phone className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Teléfono *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className={`w-full rounded-xl border-2 bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold ${errores['telefono'] ? 'border-red-400 bg-red-50' : 'border-wheat'}`}
                                        value={cliente.telefono}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                );
                                            setCliente({
                                                ...cliente,
                                                telefono: value,
                                            });

                                            if (value.trim()) {
                                                setErrores((prev) => ({
                                                    ...prev,
                                                    telefono: '',
                                                }));
                                            }
                                        }}
                                        placeholder="Ej: 987654321"
                                        maxLength={15}
                                    />
                                    {errores['telefono'] && (
                                        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3 w-3" />{' '}
                                            {errores['telefono']}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    <MapPin className="mr-1.5 inline h-4 w-4 text-gold" />
                                    Dirección *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full rounded-xl border-2 bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold ${errores['direccion'] ? 'border-red-400 bg-red-50' : 'border-wheat'}`}
                                    value={cliente.direccion}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(
                                            /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,#-]/g,
                                            '',
                                        );
                                        setCliente({
                                            ...cliente,
                                            direccion: value,
                                        });

                                        if (value.trim()) {
                                            setErrores((prev) => ({
                                                ...prev,
                                                direccion: '',
                                            }));
                                        }
                                    }}
                                    placeholder="Ej: Av. Principal 123, Urb. Las Flores"
                                />
                                {errores['direccion'] && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                        <AlertCircle className="h-3 w-3" />{' '}
                                        {errores['direccion']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    <MapPin className="mr-1.5 inline h-4 w-4 text-gold" />
                                    Referencia (opcional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={cliente.referencia}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(
                                            /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,#-]/g,
                                            '',
                                        );
                                        setCliente({
                                            ...cliente,
                                            referencia: value,
                                        });
                                    }}
                                    placeholder="Ej: Al lado del parque, casa verde"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <Clock className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Tipo de entrega
                                    </label>
                                    <select
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={delivery.tipo}
                                        onChange={(e) =>
                                            setDelivery({
                                                ...delivery,
                                                tipo: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="delivery">
                                            Delivery (a domicilio)
                                        </option>
                                        <option value="llevar">
                                            Para llevar (recoger en tienda)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <DollarSign className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Método de pago
                                    </label>
                                    <select
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={delivery.metodo_pago}
                                        onChange={(e) =>
                                            setDelivery({
                                                ...delivery,
                                                metodo_pago: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="efectivo">
                                            Efectivo
                                        </option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="yape">
                                            Yape / Plin
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* PASO 2: Productos */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {errores['productos'] && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {errores['productos']}
                                </div>
                            )}
                            {/* Buscador de productos */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={busquedaProducto}
                                    onChange={(e) =>
                                        setBusquedaProducto(e.target.value)
                                    }
                                />
                            </div>

                            {/* Lista de productos disponibles */}
                            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
                                {productosDisponibles
                                    .filter((p) =>
                                        p.nombre
                                            .toLowerCase()
                                            .includes(
                                                busquedaProducto.toLowerCase(),
                                            ),
                                    )
                                    .map((producto) => (
                                        <button
                                            key={producto.id}
                                            onClick={() =>
                                                agregarProducto(producto)
                                            }
                                            className="rounded-xl border-2 border-wheat bg-cream-soft px-3 py-2 text-left text-sm transition hover:border-gold hover:bg-cream"
                                        >
                                            <p className="font-medium text-chocolate">
                                                {producto.nombre}
                                            </p>
                                            <p className="font-bold text-gold">
                                                S/ {producto.precio.toFixed(2)}
                                            </p>
                                        </button>
                                    ))}
                            </div>

                            {/* Productos seleccionados */}
                            {productos.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto rounded-xl bg-cream-soft p-3">
                                    {productos.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between border-b border-sand py-2 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-chocolate">
                                                    {item.nombre}
                                                </p>
                                                <p className="text-xs text-cocoa">
                                                    S/ {item.precio.toFixed(2)}{' '}
                                                    x {item.cantidad}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        quitarProducto(item.id)
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 transition hover:bg-red-200"
                                                >
                                                    -
                                                </button>
                                                <span className="w-4 text-center text-sm font-bold">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        agregarProducto({
                                                            id: item.id,
                                                            nombre: item.nombre,
                                                            precio: item.precio,
                                                        })
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold transition hover:bg-gold/30"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        eliminarProducto(
                                                            item.id,
                                                        )
                                                    }
                                                    className="ml-1 text-red-400 transition hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-sm text-cocoa-soft">
                                    <Package className="mx-auto mb-2 h-8 w-8 text-cocoa-soft" />
                                    No hay productos agregados
                                </div>
                            )}
                        </div>
                    )}
                    {/* PASO 3: Confirmación */}
                    {step === 4 && (
                        <div className="space-y-4">
                            {/* Resumen del cliente */}
                            <div className="rounded-xl border border-sand bg-cream p-4">
                                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-chocolate">
                                    <User className="h-4 w-4 text-gold" />
                                    Datos del cliente
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-cocoa">
                                            Nombre:
                                        </span>
                                        <span className="ml-1 font-medium">
                                            {cliente.nombre}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-cocoa">
                                            Teléfono:
                                        </span>
                                        <span className="ml-1 font-medium">
                                            {cliente.telefono || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-cocoa">
                                            Dirección:
                                        </span>
                                        <span className="ml-1 font-medium">
                                            {cliente.direccion}
                                        </span>
                                    </div>
                                    {cliente.referencia && (
                                        <div className="col-span-2">
                                            <span className="text-cocoa">
                                                Referencia:
                                            </span>
                                            <span className="ml-1 font-medium">
                                                {cliente.referencia}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resumen de productos */}
                            <div className="rounded-xl border border-sand bg-cream p-4">
                                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-chocolate">
                                    <Package className="h-4 w-4 text-gold" />
                                    Productos ({productos.length})
                                </h4>
                                <div className="max-h-32 space-y-1 overflow-y-auto">
                                    {productos.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex justify-between border-b border-sand pb-1 text-sm last:border-0"
                                        >
                                            <span>
                                                {p.cantidad}x {p.nombre}
                                            </span>
                                            <span className="font-medium">
                                                S/ {p.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Totales */}
                            <div className="rounded-xl border border-sand bg-cream p-4">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-cocoa">
                                            Subtotal
                                        </span>
                                        <span>S/ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-cocoa">
                                            IGV (18%)
                                        </span>
                                        <span>S/ {igv.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t border-sand pt-2 text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-gold">
                                            S/ {total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Observaciones */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Observaciones (opcional)
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-2.5 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={delivery.observaciones}
                                    onChange={(e) =>
                                        setDelivery({
                                            ...delivery,
                                            observaciones: e.target.value,
                                        })
                                    }
                                    placeholder="Ej: Sin cebolla, extra queso..."
                                />
                            </div>
                        </div>
                    )}
                </div>
                {/* ===== FOOTER ===== */}
                <div className="flex items-center justify-between border-t border-sand bg-cream-soft/50 px-6 py-4">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => {
                                    setErrores({});
                                    setStep(step - 1);
                                }}
                                className="rounded-xl border-2 border-wheat px-4 py-2 text-sm font-medium text-cocoa transition hover:bg-sand"
                                disabled={cargando}
                            >
                                Anterior
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="rounded-xl border-2 border-wheat px-5 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                        {step < 4 ? (
                            <button
                                onClick={validarYAvanzar}
                                className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep"
                            >
                                {step === 1 && 'Siguiente → Cliente'}
                                {step === 2 && 'Siguiente → Productos'}
                                {step === 3 && 'Siguiente → Confirmar'}
                            </button>
                        ) : (
                            <button
                                onClick={enviarPedido}
                                disabled={
                                    cargando ||
                                    productos.length === 0 ||
                                    !repartidorSeleccionado
                                }
                                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition ${
                                    cargando ||
                                    productos.length === 0 ||
                                    !repartidorSeleccionado
                                        ? 'cursor-not-allowed bg-wheat'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {cargando ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Confirmar Delivery
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
