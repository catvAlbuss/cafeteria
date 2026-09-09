import { useState } from 'react';
import { router } from '@inertiajs/react';
import { X, Plus, Minus, Package, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

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

interface ModalEditarPedidoProps {
    isOpen: boolean;
    pedido: any;
    productos: Producto[];
    onClose: () => void;
    onPedidoActualizado: (pedido: any) => void;
    onPedidoCancelado: (pedidoId: number) => void;
}

export default function ModalEditarPedido({
    isOpen,
    pedido,
    productos,
    onClose,
    onPedidoActualizado,
    onPedidoCancelado
}: ModalEditarPedidoProps) {

    const [pedidoEdit, setPedidoEdit] = useState<any>(() => ({
        ...pedido,
        total: Number(pedido.total) || 0,
        productos: pedido.productos.map((p: any) => ({
            ...p,
            precio: Number(p.precio) || 0,
            subtotal: Number(p.subtotal) || 0,
        })),
    }));
    const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
    const [busquedaAgregar, setBusquedaAgregar] = useState('');
    const [productosNuevos, setProductosNuevos] = useState<any[]>([]);
    const [guardando, setGuardando] = useState(false);

    if (!isOpen || !pedido) return null;


    const esEditableCompleto = pedido.estado === 'pendiente';
    const soloAgregar = pedido.estado === 'preparando';
    const totalNuevos = productosNuevos.reduce((sum, p) => sum + p.subtotal, 0);

    // Cambiar cantidad de un producto
    const cambiarCantidad = (index: number, delta: number) => {
        const nuevos = [...pedidoEdit.productos];
        const nuevaCant = Math.max(1, nuevos[index].cantidad + delta);
        nuevos[index].cantidad = nuevaCant;
        nuevos[index].subtotal = nuevaCant * nuevos[index].precio;
        const nuevoTotal = nuevos.reduce((sum: number, p: any) => sum + p.subtotal, 0);
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
    };

    // Eliminar producto del pedido
    const eliminarProducto = (index: number) => {
        if (!confirm('¿Eliminar este producto del pedido?')) return;
        const nuevos = pedidoEdit.productos.filter((_: any, i: number) => i !== index);
        const nuevoTotal = nuevos.reduce((sum: number, p: any) => sum + p.subtotal, 0);
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
    };

    // Agregar productos al pedido
    const agregarProductos = (producto: Producto) => {
        if (soloAgregar) {
            // El pedido ya está en cocina: los nuevos productos van aparte,
            // no se mezclan con lo que ya se envió.
            setProductosNuevos((prev) => {
                const existente = prev.find((p: any) => p.id === producto.id);
                if (existente) {
                    return prev.map((p: any) =>
                        p.id === producto.id ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio } : p
                    );
                }
                return [...prev, { ...producto, cantidad: 1, subtotal: producto.precio }];
            });
            toast.success(`✅ ${producto.nombre} agregado (pendiente de enviar)`);
            setModalAgregarAbierto(false);
            return;
        }

        const existente = pedidoEdit.productos.find((p: any) => p.id === producto.id);
        let nuevos;
        if (existente) {
            nuevos = pedidoEdit.productos.map((p: any) =>
                p.id === producto.id ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio } : p
            );
        } else {
            nuevos = [...pedidoEdit.productos, { ...producto, cantidad: 1, subtotal: producto.precio }];
        }
        const nuevoTotal = nuevos.reduce((sum: number, p: any) => sum + p.subtotal, 0);
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
        toast.success(`✅ ${producto.nombre} agregado`);
        setModalAgregarAbierto(false);
    };

    // Cantidad/eliminación de los productos NUEVOS (aún no enviados) — siempre editables
    const cambiarCantidadNuevo = (index: number, delta: number) => {
        setProductosNuevos((prev) => {
            const nuevos = [...prev];
            const nuevaCant = Math.max(1, nuevos[index].cantidad + delta);
            nuevos[index] = { ...nuevos[index], cantidad: nuevaCant, subtotal: nuevaCant * nuevos[index].precio };
            return nuevos;
        });
    };

    const eliminarProductoNuevo = (index: number) => {
        setProductosNuevos((prev) => prev.filter((_, i) => i !== index));
    };

    // Guardar cambios
    const guardarCambios = () => {
        if (soloAgregar) {
            if (productosNuevos.length === 0) {
                toast.warning('Agrega al menos un producto nuevo');
                return;
            }
            setGuardando(true);
            router.post(`/pedidos/${pedidoEdit.id}/agregar-productos`, {
                productos_nuevos: productosNuevos,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('✅ Productos agregados, enviados a cocina');
                    onPedidoActualizado(pedidoEdit.id);
                    onClose();
                },
                onError: (errors) => {
                    alert('Error al agregar productos: ' + Object.values(errors).join(' '));
                },
                onFinish: () => setGuardando(false),
            });
            return;
        }

        if (pedidoEdit.productos.length === 0) {
            alert('El pedido no puede quedar vacío');
            return;
        }

        setGuardando(true);
        router.put(`/pedidos/${pedidoEdit.id}`, {
            productos: pedidoEdit.productos,
            total: pedidoEdit.total,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('✅ Pedido actualizado');
                onPedidoActualizado(pedidoEdit.id);
                onClose();
            },
            onError: (errors) => {
                alert('Error al actualizar: ' + Object.values(errors).join(' '));
            },
            onFinish: () => setGuardando(false),
        });
    };

    const cancelarPedido = () => {
        if (!confirm('¿Seguro que deseas cancelar este pedido?')) return;
        router.patch(`/pedidos/${pedidoEdit.id}/cancelar`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('🗑️ Pedido cancelado');
                onPedidoCancelado(pedidoEdit.id);
                onClose();
            }
        });
    };

    return (
        <>
            {/* Modal principal de edición */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-6 py-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {soloAgregar ? '➕ Agregar productos' : '✏️ Editar Pedido'}
                            </h2>
                            <p className="text-gray-300 text-xs">{pedidoEdit.numero}</p>
                            {soloAgregar && (
                                <p className="text-[10px] text-amber-200 mt-0.5">
                                    Este pedido ya está en cocina. Solo puedes agregar productos nuevos.
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                        {/* Productos ya enviados a cocina */}
                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-semibold text-[#2D1B1A]">
                                {soloAgregar ? 'Ya enviado a cocina (no editable)' : 'Productos'}
                            </p>
                            {pedidoEdit.productos.map((item: any, idx: number) => (
                                <div key={idx} className={`flex items-center justify-between p-2 rounded-xl border ${soloAgregar ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>
                                        <p className="text-xs text-[#8D6B53]">S/ {Number(item.precio).toFixed(2)} c/u</p>
                                    </div>
                                    {esEditableCompleto ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => cambiarCantidad(idx, -1)}
                                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => cambiarCantidad(idx, 1)}
                                                className="w-6 h-6 rounded-full bg-[#C9A96E]/20 hover:bg-[#C9A96E]/30 text-[#C9A96E] flex items-center justify-center text-sm font-bold"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => eliminarProducto(idx)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold text-[#2D1B1A] px-2">x{item.cantidad}</span>
                                    )}
                                </div>
                            ))}
                            {pedidoEdit.productos.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No hay productos</p>
                            )}
                        </div>

                        {/* Productos nuevos (solo en modo agregar) */}
                        {soloAgregar && (
                            <div className="space-y-2 mb-4">
                                <p className="text-sm font-semibold text-[#2D1B1A]">Nuevos productos (por enviar)</p>
                                {productosNuevos.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">Aún no agregaste nada nuevo</p>
                                )}
                                {productosNuevos.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-[#FBF7F0] rounded-xl border border-[#C9A96E]/40">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>
                                            <p className="text-xs text-[#8D6B53]">S/ {Number(item.precio).toFixed(2)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => cambiarCantidadNuevo(idx, -1)}
                                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => cambiarCantidadNuevo(idx, 1)}
                                                className="w-6 h-6 rounded-full bg-[#C9A96E]/20 hover:bg-[#C9A96E]/30 text-[#C9A96E] flex items-center justify-center text-sm font-bold"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => eliminarProductoNuevo(idx)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botón Agregar productos */}
                        <button
                            onClick={() => setModalAgregarAbierto(true)}
                            className="w-full py-2 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Agregar productos
                        </button>

                        {/* Total */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#F3E1C8]">
                            <span className="font-bold text-[#2D1B1A]">
                                {soloAgregar ? 'Total nuevo (a agregar)' : 'Total'}
                            </span>
                            <span className="text-xl font-bold text-[#C9A96E]">
                                S/ {(soloAgregar ? totalNuevos : Number(pedidoEdit.total)).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-4 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={guardarCambios}
                            disabled={guardando}
                            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {soloAgregar ? 'Enviar a cocina' : 'Guardar'}
                        </button>
                        {esEditableCompleto && (
                            <button
                                onClick={cancelarPedido}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition flex items-center justify-center gap-1"
                            >
                                <Trash2 className="w-4 h-4" /> Cancelar
                            </button>
                        )}
                    </div>

                    {/* Cerrar contenedores del modal principal */}
                    </div>
                </div>

                    {/* Modal Agregar Productos */}
                    {modalAgregarAbierto && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">➕ Agregar Productos</h2>
                                    <button onClick={() => setModalAgregarAbierto(false)} className="text-white/60 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none mb-4"
                                        value={busquedaAgregar}
                                        onChange={(e) => setBusquedaAgregar(e.target.value)}
                                    />

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {productos
                                            .filter(p => p.stock > 0 && p.disponible)
                                            .filter(p => p.nombre.toLowerCase().includes(busquedaAgregar.toLowerCase()))
                                            .map((producto) => (
                                                <button
                                                    key={producto.id}
                                                    onClick={() => agregarProductos(producto)}
                                                    className="bg-gray-50 hover:bg-[#FBF7F0] border-2 border-gray-200 hover:border-[#C9A96E] rounded-xl px-3 py-2 text-left transition text-sm"
                                                >
                                                    <p className="font-medium text-[#2D1B1A]">{producto.nombre}</p>
                                                    <p className="text-[#C9A96E] font-bold">S/ {producto.precio.toFixed(2)}</p>
                                                    <p className="text-xs text-[#8D6B53]">Stock: {producto.stock}</p>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </>
        );
}
