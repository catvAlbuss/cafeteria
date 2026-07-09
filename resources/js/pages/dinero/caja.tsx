import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Search, 
    Plus, 
    Minus, 
    X, 
    Coffee,
    Users,
    MapPin,
    CreditCard,
    Receipt,
    Printer,
    Wallet,
    ArrowRight
} from 'lucide-react';

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    imagen: string;
}

interface ItemCarrito {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

interface Cliente {
    id: number;
    nombre: string;
    mesa: string;
}

export default function Caja() {
    // 📦 Productos del menú
    const productos: Producto[] = [
        { id: 1, nombre: 'Espresso', precio: 4.20, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' },
        { id: 2, nombre: 'Cappuccino', precio: 6.50, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' },
        { id: 3, nombre: 'Latte', precio: 5.80, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' },
        { id: 4, nombre: 'Americano', precio: 5.00, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500' },
        { id: 5, nombre: 'Mocha', precio: 7.00, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500' },
        { id: 6, nombre: 'Cold Brew', precio: 8.00, categoria: 'Café Frío', imagen: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' },
        { id: 7, nombre: 'Flat White', precio: 6.20, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500' },
        { id: 8, nombre: 'Caramel Macchiato', precio: 8.50, categoria: 'Café Premium', imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500' },
    ];

    // 🛒 Estado del carrito
    const [carrito, setCarrito] = useState<ItemCarrito[]>(() => {
        const saved = localStorage.getItem('carritoCaja');
        return saved ? JSON.parse(saved) : [];
    });

    const [busqueda, setBusqueda] = useState('');
    const [cliente, setCliente] = useState('');
    const [mesa, setMesa] = useState('');
    const [tipoPedido, setTipoPedido] = useState('salon');
    const [metodoPago, setMetodoPago] = useState('efectivo');

    //  Guardar carrito en localStorage
    useEffect(() => {
        localStorage.setItem('carritoCaja', JSON.stringify(carrito));
    }, [carrito]);

    // Filtrar productos
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.toLowerCase())
    );

    //  Agregar producto
    const agregarProducto = (producto: Producto) => {
        setCarrito(prev => {
            const existente = prev.find(item => item.id === producto.id);
            if (existente) {
                return prev.map(item =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    // ➖ Quitar producto
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

    // Eliminar producto
    const eliminarProducto = (id: number) => {
        setCarrito(prev => prev.filter(item => item.id !== id));
    };

    //  Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    //  Limpiar carrito
    const limpiarCarrito = () => {
        setCarrito([]);
        setCliente('');
        setMesa('');
    };

    // Realizar pedido
    const realizarPedido = () => {
        if (carrito.length === 0) {
            alert('Agrega productos al pedido');
            return;
        }
        alert(`✅ Pedido realizado con éxito\nTotal: S/ ${total.toFixed(2)}\nCliente: ${cliente || 'Anónimo'}\nMesa: ${mesa || 'No asignada'}`);
        limpiarCarrito();
    };

    return (
        <>
            <Head title="Caja" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 bg-[#FBF7F0]">
                
                {/* Título */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2D1B1A]"> Caja</h1>
                        <p className="text-[#5A3D2B] text-sm font-medium">Gestión de pedidos y cobros</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-white rounded-lg border">
                            Pedido #27362
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                            Abierta
                        </span>
                    </div>
                </div>

                {/* Layout Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* ============================================================ */}
                    {/* COLUMNA IZQUIERDA: Productos (2/3) */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-2">
                        
                        {/* Buscador */}
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-[#8D6B53]/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder=" Buscar productos por nombre o categoría..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#1A1A1A] placeholder-gray-400"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Categorías */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-[#C9A96E] rounded-2xl p-4 text-white cursor-pointer hover:opacity-90 transition">
                                <p className="text-xs opacity-80">Disponible</p>
                                <h3 className="text-lg font-bold mt-2">Café</h3>
                                <p className="text-sm mt-1">50 productos</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                                <p className="text-xs text-gray-400">Disponible</p>
                                <h3 className="text-lg font-bold mt-2 text-gray-800">Té</h3>
                                <p className="text-sm text-gray-500 mt-1">20 productos</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">Poco Stock</span>
                                <h3 className="text-lg font-bold mt-2 text-gray-800">Snacks</h3>
                                <p className="text-sm text-gray-500 mt-1">10 productos</p>
                            </div>
                        </div>

                        {/* Grid de productos */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {productosFiltrados.map((producto) => (
                                <div
                                    key={producto.id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                                    onClick={() => agregarProducto(producto)}
                                >
                                    <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            className="h-28 w-28 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/C9A96E/FFFFFF?text=Café';
                                            }}
                                        />
                                    </div>
                                    <div className="p-3">
                                        <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1">
                                            {producto.categoria}
                                        </span>
                                        <h4 className="font-bold text-gray-800 text-sm">{producto.nombre}</h4>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-lg font-bold text-[#C9A96E]">S/ {producto.precio.toFixed(2)}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); agregarProducto(producto); }}
                                                className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {productosFiltrados.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-400">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* COLUMNA DERECHA: Pedido (1/3) */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-[#8D6B53]/10 h-full flex flex-col">
                            
                            {/* Cabecera del pedido */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-800">🛒 Pedido</h2>
                                    <button
                                        onClick={limpiarCarrito}
                                        className="text-gray-400 hover:text-red-500 transition text-sm"
                                    >
                                        Limpiar
                                    </button>
                                </div>

                                {/* Tipo de pedido */}
                                <div className="grid grid-cols-3 gap-1 mt-3">
                                    <button
                                        onClick={() => setTipoPedido('salon')}
                                        className={`py-2 rounded-lg text-sm font-medium transition ${
                                            tipoPedido === 'salon'
                                                ? 'bg-[#C9A96E] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🪑 Salón
                                    </button>
                                    <button
                                        onClick={() => setTipoPedido('llevar')}
                                        className={`py-2 rounded-lg text-sm font-medium transition ${
                                            tipoPedido === 'llevar'
                                                ? 'bg-[#C9A96E] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        📦 Llevar
                                    </button>
                                    <button
                                        onClick={() => setTipoPedido('delivery')}
                                        className={`py-2 rounded-lg text-sm font-medium transition ${
                                            tipoPedido === 'delivery'
                                                ? 'bg-[#C9A96E] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🚚 Delivery
                                    </button>
                                </div>
                            </div>

                            {/* Cliente y Mesa */}
                            <div className="p-4 border-b border-gray-100 space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Cliente</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del cliente"
                                        className="mt-1 w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#C9A96E] outline-none"
                                        value={cliente}
                                        onChange={(e) => setCliente(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium">Mesa</label>
                                    <select
                                        className="mt-1 w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#C9A96E] outline-none"
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
                            </div>

                            {/* Lista de productos en el pedido */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px]">
                                {carrito.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8 text-sm">No hay productos en el pedido</p>
                                ) : (
                                    carrito.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800 text-sm">{item.nombre}</h4>
                                                <p className="text-xs text-gray-500">S/ {item.precio.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => quitarProducto(item.id)}
                                                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition"
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-bold text-sm">{item.cantidad}</span>
                                                <button
                                                    onClick={() => agregarProducto({ id: item.id, nombre: item.nombre, precio: item.precio, categoria: '', imagen: item.imagen })}
                                                    className="w-7 h-7 rounded-full bg-[#C9A96E] hover:bg-[#B8975D] text-white flex items-center justify-center text-sm font-bold transition"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => eliminarProducto(item.id)}
                                                    className="ml-1 text-red-400 hover:text-red-600 transition text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totales y acciones */}
                            <div className="border-t border-gray-100 p-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">IGV (18%)</span>
                                        <span className="font-medium">S/ {igv.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                                        <span>Total</span>
                                        <span className="text-[#C9A96E]">S/ {total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Método de pago */}
                                <div className="grid grid-cols-3 gap-1 mt-3">
                                    <button
                                        onClick={() => setMetodoPago('efectivo')}
                                        className={`py-2 rounded-lg text-xs font-medium transition ${
                                            metodoPago === 'efectivo'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        💵 Efectivo
                                    </button>
                                    <button
                                        onClick={() => setMetodoPago('tarjeta')}
                                        className={`py-2 rounded-lg text-xs font-medium transition ${
                                            metodoPago === 'tarjeta'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        💳 Tarjeta
                                    </button>
                                    <button
                                        onClick={() => setMetodoPago('yape')}
                                        className={`py-2 rounded-lg text-xs font-medium transition ${
                                            metodoPago === 'yape'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        📱 Yape
                                    </button>
                                </div>

                                <button
                                    onClick={realizarPedido}
                                    className="w-full mt-4 bg-[#C9A96E] hover:bg-[#B8975D] text-white py-3 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Receipt className="w-5 h-5" />
                                    Realizar Pedido
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}