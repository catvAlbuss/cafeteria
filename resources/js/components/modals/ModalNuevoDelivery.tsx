import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { X, User, MapPin, Phone, Truck, Package, DollarSign, Clock, Calendar, Check, AlertCircle } from 'lucide-react';

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

export default function ModalDelivery({ isOpen, onClose, onSuccess }: ModalDeliveryProps) {
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
        { id: 1, nombre: 'Café Americano', precio: 8.00 },
        { id: 2, nombre: 'Cappuccino', precio: 14.00 },
        { id: 3, nombre: 'Matcha Latte', precio: 16.00 },
        { id: 4, nombre: 'Cheesecake', precio: 15.00 },
        { id: 5, nombre: 'Croissant', precio: 6.50 },
        { id: 6, nombre: 'Sándwich de Pollo', precio: 18.00 },
        { id: 7, nombre: 'Jugo Natural', precio: 10.00 },
        { id: 8, nombre: 'Café Latte', precio: 12.00 },
    ];

    // Calcular totales
    const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Agregar producto
    const agregarProducto = (producto: any) => {
        const existente = productos.find(p => p.id === producto.id);
        if (existente) {
            setProductos(productos.map(p =>
                p.id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
                    : p
            ));
        } else {
            setProductos([...productos, {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                subtotal: producto.precio
            }]);
        }
        setErrores(prev => ({ ...prev, productos: '' }));
    };

    // Quitar producto
    const quitarProducto = (id: number) => {
        const existente = productos.find(p => p.id === id);
        if (existente && existente.cantidad > 1) {
            setProductos(productos.map(p =>
                p.id === id
                    ? { ...p, cantidad: p.cantidad - 1, subtotal: (p.cantidad - 1) * p.precio }
                    : p
            ));
        } else {
            setProductos(productos.filter(p => p.id !== id));
        }
    };

    // Eliminar producto
    const eliminarProducto = (id: number) => {
        setProductos(productos.filter(p => p.id !== id));
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
            toast.warning('Completa los campos obligatorios antes de continuar', {
                description: Object.values(nuevosErrores).join('. '),
                duration: 3000,
            });
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
            productos: productos.map(p => ({
                nombre: p.nombre,
                cantidad: p.cantidad,
                precio: p.precio,
                subtotal: p.subtotal
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
                setCliente({ nombre: '', telefono: '', direccion: '', referencia: '' });
                setProductos([]);
                setStep(1);
            },
            onError: (errors) => {
                setCargando(false);
                alert('Error al crear delivery: ' + Object.values(errors).join(' '));
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* ===== HEADER ===== */}
                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C9A96E] rounded-xl flex items-center justify-center shadow-lg">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Nuevo Delivery</h2>
                            <p className="text-gray-300 text-xs">Registra un nuevo pedido a domicilio</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                        disabled={cargando}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ===== PASOS ===== */}
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FBF7F0] border-b border-[#F3E1C8]">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#C9A96E] text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
                        <span className="text-sm font-medium">Repartidor</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-[#C9A96E]' : 'bg-gray-200'}`} />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#C9A96E] text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                        <span className="text-sm font-medium">Cliente</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-[#C9A96E]' : 'bg-gray-200'}`} />
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-[#C9A96E] text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
                        <span className="text-sm font-medium">Productos</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 4 ? 'bg-[#C9A96E]' : 'bg-gray-200'}`} />
                    <div className={`flex items-center gap-2 ${step >= 4 ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 4 ? 'bg-[#C9A96E] text-white' : 'bg-gray-200 text-gray-500'}`}>4</span>
                        <span className="text-sm font-medium">Confirmar</span>
                    </div>
                </div>

                {/* ===== BODY ===== */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* PASO 1: Seleccionar Repartidor */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 mx-auto bg-[#C9A96E]/20 rounded-full flex items-center justify-center mb-3">
                                    <User className="w-8 h-8 text-[#C9A96E]" />
                                </div>
                                <h3 className="text-lg font-bold text-[#2D1B1A]">Seleccionar Repartidor</h3>
                                <p className="text-sm text-gray-500">Elige quién realizará la entrega</p>
                            </div>

                            {errores['repartidor'] && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {errores['repartidor']}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {repartidores.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => {
                                            setRepartidorSeleccionado(r.nombre);
                                            setErrores(prev => ({ ...prev, repartidor: '' }));
                                        }}
                                        className={`p-4 rounded-xl border-2 text-left transition ${repartidorSeleccionado === r.nombre
                                            ? 'border-[#C9A96E] bg-[#FBF7F0] ring-2 ring-[#C9A96E]/30'
                                            : 'border-gray-200 hover:border-[#C9A96E]/50 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#F3E1C8] flex items-center justify-center">
                                                <User className="w-5 h-5 text-[#5A3D2B]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#2D1B1A]">{r.nombre}</p>
                                                <p className="text-xs text-gray-400">Disponible</p>
                                            </div>
                                            {repartidorSeleccionado === r.nombre && (
                                                <div className="ml-auto text-[#C9A96E]">
                                                    <Check className="w-5 h-5" />
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
                            {Object.values(errores).some(e => e) && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Completa todos los campos obligatorios marcados
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <User className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white ${errores['nombre'] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        value={cliente.nombre}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                            setCliente({ ...cliente, nombre: value });
                                            if (value.trim()) setErrores(prev => ({ ...prev, nombre: '' }));
                                        }}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    {errores['nombre'] && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {errores['nombre']}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <Phone className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Teléfono *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white ${errores['telefono'] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        value={cliente.telefono}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setCliente({ ...cliente, telefono: value });
                                            if (value.trim()) setErrores(prev => ({ ...prev, telefono: '' }));
                                        }}
                                        placeholder="Ej: 987654321"
                                        maxLength={15}
                                    />
                                    {errores['telefono'] && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {errores['telefono']}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    <MapPin className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                    Dirección *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full border-2 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white ${errores['direccion'] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                    value={cliente.direccion}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,#-]/g, '');
                                        setCliente({ ...cliente, direccion: value });
                                        if (value.trim()) setErrores(prev => ({ ...prev, direccion: '' }));
                                    }}
                                    placeholder="Ej: Av. Principal 123, Urb. Las Flores"
                                />
                                {errores['direccion'] && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errores['direccion']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    <MapPin className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                    Referencia (opcional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={cliente.referencia}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,#-]/g, '');
                                        setCliente({ ...cliente, referencia: value });
                                    }}
                                    placeholder="Ej: Al lado del parque, casa verde"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <Clock className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Tipo de entrega
                                    </label>
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={delivery.tipo}
                                        onChange={(e) => setDelivery({ ...delivery, tipo: e.target.value })}
                                    >
                                        <option value="delivery">Delivery (a domicilio)</option>
                                        <option value="llevar">Para llevar (recoger en tienda)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                        <DollarSign className="w-4 h-4 inline mr-1.5 text-[#C9A96E]" />
                                        Método de pago
                                    </label>
                                    <select
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={delivery.metodo_pago}
                                        onChange={(e) => setDelivery({ ...delivery, metodo_pago: e.target.value })}
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="yape">Yape / Plin</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* PASO 2: Productos */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {errores['productos'] && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {errores['productos']}
                                </div>
                            )}
                            {/* Buscador de productos */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={busquedaProducto}
                                    onChange={(e) => setBusquedaProducto(e.target.value)}
                                />
                            </div>

                            {/* Lista de productos disponibles */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                {productosDisponibles
                                    .filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()))
                                    .map((producto) => (
                                        <button
                                            key={producto.id}
                                            onClick={() => agregarProducto(producto)}
                                            className="bg-gray-50 hover:bg-[#FBF7F0] border-2 border-gray-200 hover:border-[#C9A96E] rounded-xl px-3 py-2 text-left transition text-sm"
                                        >
                                            <p className="font-medium text-[#2D1B1A]">{producto.nombre}</p>
                                            <p className="text-[#C9A96E] font-bold">S/ {producto.precio.toFixed(2)}</p>
                                        </button>
                                    ))}
                            </div>

                            {/* Productos seleccionados */}
                            {productos.length > 0 ? (
                                <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                                    {productos.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>
                                                <p className="text-xs text-gray-500">S/ {item.precio.toFixed(2)} x {item.cantidad}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => quitarProducto(item.id)}
                                                    className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition flex items-center justify-center text-sm font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                                <button
                                                    onClick={() => agregarProducto({ id: item.id, nombre: item.nombre, precio: item.precio })}
                                                    className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E]/30 transition flex items-center justify-center text-sm font-bold"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => eliminarProducto(item.id)}
                                                    className="ml-1 text-red-400 hover:text-red-600 transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    No hay productos agregados
                                </div>
                            )}
                        </div>
                    )}
                    {/* PASO 3: Confirmación */}
                    {step === 4 && (
                        <div className="space-y-4">
                            {/* Resumen del cliente */}
                            <div className="bg-[#FBF7F0] rounded-xl p-4 border border-[#F3E1C8]">
                                <h4 className="text-sm font-semibold text-[#2D1B1A] mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#C9A96E]" />
                                    Datos del cliente
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Nombre:</span>
                                        <span className="font-medium ml-1">{cliente.nombre}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Teléfono:</span>
                                        <span className="font-medium ml-1">{cliente.telefono || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Dirección:</span>
                                        <span className="font-medium ml-1">{cliente.direccion}</span>
                                    </div>
                                    {cliente.referencia && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Referencia:</span>
                                            <span className="font-medium ml-1">{cliente.referencia}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resumen de productos */}
                            <div className="bg-[#FBF7F0] rounded-xl p-4 border border-[#F3E1C8]">
                                <h4 className="text-sm font-semibold text-[#2D1B1A] mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#C9A96E]" />
                                    Productos ({productos.length})
                                </h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {productos.map((p) => (
                                        <div key={p.id} className="flex justify-between text-sm border-b border-gray-200 pb-1 last:border-0">
                                            <span>{p.cantidad}x {p.nombre}</span>
                                            <span className="font-medium">S/ {p.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Totales */}
                            <div className="bg-[#FBF7F0] rounded-xl p-4 border border-[#F3E1C8]">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>S/ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">IGV (18%)</span>
                                        <span>S/ {igv.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                                        <span>Total</span>
                                        <span className="text-[#C9A96E]">S/ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">
                                    Observaciones (opcional)
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={delivery.observaciones}
                                    onChange={(e) => setDelivery({ ...delivery, observaciones: e.target.value })}
                                    placeholder="Ej: Sin cebolla, extra queso..."
                                />
                            </div>
                        </div>
                    )}
                </div>
                {/* ===== FOOTER ===== */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => {
                                    setErrores({});
                                    setStep(step - 1);
                                }}
                                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-medium text-sm transition"
                                disabled={cargando}
                            >
                                Anterior
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                        {step < 4 ? (
                            <button
                                onClick={validarYAvanzar}
                                className="px-5 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center gap-2 shadow-md"
                            >
                                {step === 1 && 'Siguiente → Cliente'}
                                {step === 2 && 'Siguiente → Productos'}
                                {step === 3 && 'Siguiente → Confirmar'}
                            </button>
                        ) : (
                            <button
                                onClick={enviarPedido}
                                disabled={cargando || productos.length === 0 || !repartidorSeleccionado}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-md ${cargando || productos.length === 0 || !repartidorSeleccionado
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                            >
                                {cargando ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
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