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

    if (!isOpen || !pedido) return null;

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
        console.log('🔄 Productos en el modal DESPUÉS de agregar:', nuevos);
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
        toast.success(`✅ ${producto.nombre} agregado`);
        setModalAgregarAbierto(false);
    };

    // Guardar cambios
    const guardarCambios = () => {
        if (pedidoEdit.productos.length === 0) {
            alert('El pedido no puede quedar vacío');
            return;
        }

        router.put(`/pedidos/${pedidoEdit.id}`, {
            productos: pedidoEdit.productos,
            total: pedidoEdit.total,
        }, {
            preserveScroll: true,
            onSuccess: (response) => {
                console.log('✅ Respuesta del backend:', response);
                toast.success('✅ Pedido actualizado');

               
                onPedidoActualizado({
                    ...pedidoEdit,
                    productos: pedidoEdit.productos
                });
                onClose();
            },
            onError: (errors) => {
                alert('Error al actualizar: ' + Object.values(errors).join(' '));
            }
        });
    };

    // Cancelar pedido
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
                            <h2 className="text-xl font-bold text-white">✏️ Editar Pedido</h2>
                            <p className="text-gray-300 text-xs">{pedidoEdit.numero}</p>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                        {/* Productos actuales */}
                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-semibold text-[#2D1B1A]">Productos</p>
                            {pedidoEdit.productos.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#2D1B1A]">{item.nombre}</p>

                                        <p className="text-xs text-[#8D6B53]">S/ {Number(item.precio).toFixed(2)} c/u</p>
                                    </div>
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
                                </div>
                            ))}
                            {pedidoEdit.productos.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No hay productos</p>
                            )}
                        </div>

                        {/* Botón Agregar productos */}
                        <button
                            onClick={() => setModalAgregarAbierto(true)}
                            className="w-full py-2 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Agregar productos
                        </button>

                        {/* Total */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#F3E1C8]">
                            <span className="font-bold text-[#2D1B1A]">Total</span>
                            <span className="text-xl font-bold text-[#C9A96E]">S/ {Number(pedidoEdit.total).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-4 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={guardarCambios}
                            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition flex items-center justify-center gap-1"
                        >
                            <Save className="w-4 h-4" /> Guardar
                        </button>
                        <button
                            onClick={cancelarPedido}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition flex items-center justify-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" /> Cancelar
                        </button>
                    </div>
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