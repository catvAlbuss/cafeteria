import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { User, Armchair } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

interface MesaInfo {
    id: number;
    numero: string;
    capacidad: number;
    sillas: number;
    estado: string;
    mesero?: string | null;
}

interface Mesa {
    id: number;
    numero: string;
}

export default function Ventas() {
    //  Recibir mesas desde el controlador
    const { mesas: mesasIniciales } = usePage<{ mesas?: Mesa[] }>().props;

    // Productos del menú
    const productos: Producto[] = [
        { id: 1, nombre: 'Café Americano', precio: 8.00, categoria: 'Bebidas Calientes', imagen: '/img/productos/cafe_americano.png' },
        { id: 2, nombre: 'Café Latte', precio: 12.00, categoria: 'Bebidas Calientes', imagen: '/img/productos/latte.jpg' },
        { id: 3, nombre: 'Cappuccino', precio: 14.00, categoria: 'Bebidas Calientes', imagen: '/img/productos/cappuccino.png' },
        { id: 4, nombre: 'Matcha Latte', precio: 16.00, categoria: 'Bebidas Frías', imagen: '/img/productos/matcha.png' },
        { id: 5, nombre: 'Croissant', precio: 6.50, categoria: 'Panadería', imagen: '/img/productos/Croissant.png' },
        { id: 6, nombre: 'Cheesecake', precio: 15.00, categoria: 'Postres', imagen: '/img/productos/Cheesecake.png' },
        { id: 7, nombre: 'Sándwich de Pollo', precio: 18.00, categoria: 'Salados', imagen: '/img/productos/SandwichDePollo.png' },
        { id: 8, nombre: 'Jugo Natural', precio: 10.00, categoria: 'Bebidas Frías', imagen: '/img/productos/JugoNatural.png' },
    ];

    // Estado del carrito
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [pedidoEnviado, setPedidoEnviado] = useState(false);


    // Leer el número de mesa de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const mesaInicial = urlParams.get('mesa') || '';
    const [mesa, setMesa] = useState(mesaInicial);
    const [mesaInfo, setMesaInfo] = useState<MesaInfo | null>(null);

    //  Usar mesas desde la BD
    const [mesas] = useState<Mesa[]>(mesasIniciales || []);

    // Cargar datos completos de la mesa
    useEffect(() => {
        if (mesa) {
            axios.get(`/api/mesas/${mesa}`)
                .then(response => {
                    setMesaInfo(response.data);
                })
                .catch(error => {

                });
        }
    }, [mesa]);

    // Total del carrito
    const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Filtrar productos
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Agregar producto al carrito
    const agregarProducto = (producto: Producto) => {
        const existente = carrito.find(item => item.id === producto.id);
        if (existente) {
            setCarrito(carrito.map(item =>
                item.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
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


    const enviarPedido = () => {
        if (carrito.length === 0) {
            alert('Agrega productos al pedido');
            return;
        }

        router.post('/pedidos', {
            mesa_id: mesaInfo?.id || null,
            cliente: 'Anónimo',
            productos: carrito.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.precio * item.cantidad
            })),
            total: totalCarrito,
            observaciones: '',
        }, {
            onSuccess: () => {
                // Ocultar la información de la mesa
                setPedidoEnviado(true);

                // Mostrar toast de éxito
                toast.success('✅ Pedido enviado a cocina', {
                    description: `Mesa: ${mesa || 'No asignada'} | Mesero: ${mesaInfo?.mesero || 'No asignado'} | Total: S/ ${totalCarrito.toFixed(2)}`,
                    duration: 5000,
                    style: {
                        background: '#2D1B1A',
                        color: '#FBF3E7',
                        border: '1px solid #C9A96E',
                    },
                });

                // Limpiar carrito
                setCarrito([]);

                // ❌ ELIMINÉ EL setTimeout QUE REDIRIGÍA A /mesas
            },
            onError: (errors) => {
                alert('❌ Error al enviar pedido: ' + Object.values(errors).join(' '));
            }
        });
    };

    return (
        <>
            <Head title="Ventas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 bg-[#FBF7F0]">

                {/* Título */}
                <h1 className="text-2xl font-bold text-[#4A2C2A]">☕ Tomar Pedido</h1>
                <p className="text-[#8D6B53] text-sm">Busca productos y arma el pedido</p>
                {/* Información de la mesa - Solo aparece si hay una mesa seleccionada */}
                {mesaInfo && !pedidoEnviado && (
                    <div className="relative bg-white rounded-xl p-5 shadow-md border-l-4 border-[#C9A96E]">
                        <div className="absolute -top-2 -right-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${mesaInfo.estado === 'ocupada' ? 'bg-orange-500' :
                                    mesaInfo.estado === 'pendiente' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                }`}>
                                {mesaInfo.estado || 'Libre'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            {/* Mesa */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#FBF7F0] border-2 border-[#C9A96E] flex items-center justify-center">
                                    <span className="text-xl font-bold text-[#2D1B1A]">
                                        #{mesaInfo.numero}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-[#8D6B53] font-medium tracking-wider">
                                        Mesa
                                    </p>
                                    <p className="text-sm text-[#2D1B1A] font-medium">
                                        {mesaInfo.capacidad} personas
                                    </p>
                                </div>
                            </div>

                            {/* Separador */}
                            <div className="hidden sm:block w-px h-10 bg-[#8D6B53]/20"></div>

                            {/* Mesero */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#C9A96E]" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-[#8D6B53] font-medium tracking-wider">
                                        Mesero
                                    </p>
                                    <p className="text-sm text-[#2D1B1A] font-medium">
                                        {mesaInfo.mesero || 'No asignado'}
                                    </p>
                                </div>
                            </div>

                            {/* Sillas */}
                            <div className="flex items-center gap-2 ml-auto">
                                <Armchair className="w-4 h-4 text-[#8D6B53]" />
                                <span className="text-sm text-[#2D1B1A] font-medium">
                                    {mesaInfo.sillas} sillas
                                </span>
                            </div>
                        </div>
                    </div>
                )}



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* COLUMNA 1: Buscador y productos */}
                    <div className="lg:col-span-2">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder=" Buscar producto (ej: café, latte, sandwich...)"
                                className="w-full p-3 rounded-xl border border-[#8D6B53]/30 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#1A1A1A] placeholder-gray-500 bg-white shadow-sm"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Lista de productos */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {productosFiltrados.map((producto) => (
                                <div
                                    key={producto.id}
                                    className="bg-white rounded-xl border border-[#8D6B53]/20 hover:shadow-md transition cursor-pointer hover:border-[#C9A96E] overflow-hidden group"
                                    onClick={() => agregarProducto(producto)}
                                >
                                    <div className="h-32 bg-[#F5EDE3] flex items-center justify-center overflow-hidden">
                                        <img
                                            src={producto.imagen}
                                            alt={producto.nombre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/img/productos/placeholder.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="font-medium text-[#4A2C2A] text-sm">{producto.nombre}</p>
                                        <p className="text-[#C9A96E] font-bold">S/ {producto.precio.toFixed(2)}</p>
                                        <p className="text-xs text-[#8D6B53]">{producto.categoria}</p>
                                    </div>
                                </div>
                            ))}
                            {productosFiltrados.length === 0 && (
                                <div className="col-span-full text-center py-8 text-[#8D6B53]">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Carrito */}
                    <div className="bg-white rounded-xl border border-[#8D6B53]/20 p-4">
                        <h2 className="font-bold text-[#4A2C2A] mb-3">🛒 Pedido</h2>

                        {carrito.length === 0 ? (
                            <p className="text-[#8D6B53] text-sm text-center py-8">Sin productos</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {carrito.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between border-b border-[#8D6B53]/10 py-2">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={item.imagen}
                                                alt={item.nombre}
                                                className="w-10 h-10 rounded-lg object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/img/productos/placeholder.jpg';
                                                }}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-[#4A2C2A]">{item.nombre}</p>
                                                <p className="text-xs text-[#8D6B53]">S/ {item.precio.toFixed(2)} x {item.cantidad}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => quitarProducto(item.id)}
                                                className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition text-sm flex items-center justify-center font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-bold text-[#4A2C2A]">{item.cantidad}</span>
                                            <button
                                                onClick={() => agregarProducto({ id: item.id, nombre: item.nombre, precio: item.precio, categoria: '', imagen: item.imagen })}
                                                className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E]/30 transition text-sm flex items-center justify-center font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {carrito.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#8D6B53]/20">
                                <div className="flex justify-between font-bold text-[#4A2C2A]">
                                    <span>Total:</span>
                                    <span className="text-[#C9A96E]">S/ {totalCarrito.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={enviarPedido}
                                    className="w-full mt-3 py-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg font-medium transition"
                                >
                                    📨 Enviar Pedido
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}