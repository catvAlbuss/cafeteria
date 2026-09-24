import { router } from '@inertiajs/react';
import { X, Plus, Minus, Package, Trash2, Save } from 'lucide-react';
import { useState } from 'react';
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
    onPedidoCancelado,
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

    if (!isOpen || !pedido) {
        return null;
    }

    const esEditableCompleto = pedido.estado === 'pendiente';
    const soloAgregar = pedido.estado === 'preparando';
    const totalNuevos = productosNuevos.reduce((sum, p) => sum + p.subtotal, 0);

    // Cambiar cantidad de un producto
    const cambiarCantidad = (index: number, delta: number) => {
        const nuevos = [...pedidoEdit.productos];
        const nuevaCant = Math.max(1, nuevos[index].cantidad + delta);
        nuevos[index].cantidad = nuevaCant;
        nuevos[index].subtotal = nuevaCant * nuevos[index].precio;
        const nuevoTotal = nuevos.reduce(
            (sum: number, p: any) => sum + p.subtotal,
            0,
        );
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
    };

    // Eliminar producto del pedido
    const eliminarProducto = (index: number) => {
        if (!confirm('¿Eliminar este producto del pedido?')) {
            return;
        }

        const nuevos = pedidoEdit.productos.filter(
            (_: any, i: number) => i !== index,
        );
        const nuevoTotal = nuevos.reduce(
            (sum: number, p: any) => sum + p.subtotal,
            0,
        );
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
                        p.id === producto.id
                            ? {
                                  ...p,
                                  cantidad: p.cantidad + 1,
                                  subtotal: (p.cantidad + 1) * p.precio,
                              }
                            : p,
                    );
                }

                return [
                    ...prev,
                    { ...producto, cantidad: 1, subtotal: producto.precio },
                ];
            });
            toast.success(`${producto.nombre} agregado (pendiente de enviar)`);
            setModalAgregarAbierto(false);

            return;
        }

        const existente = pedidoEdit.productos.find(
            (p: any) => p.id === producto.id,
        );
        let nuevos;

        if (existente) {
            nuevos = pedidoEdit.productos.map((p: any) =>
                p.id === producto.id
                    ? {
                          ...p,
                          cantidad: p.cantidad + 1,
                          subtotal: (p.cantidad + 1) * p.precio,
                      }
                    : p,
            );
        } else {
            nuevos = [
                ...pedidoEdit.productos,
                { ...producto, cantidad: 1, subtotal: producto.precio },
            ];
        }

        const nuevoTotal = nuevos.reduce(
            (sum: number, p: any) => sum + p.subtotal,
            0,
        );
        setPedidoEdit({ ...pedidoEdit, productos: nuevos, total: nuevoTotal });
        toast.success(`${producto.nombre} agregado`);
        setModalAgregarAbierto(false);
    };

    // Cantidad/eliminación de los productos NUEVOS (aún no enviados) — siempre editables
    const cambiarCantidadNuevo = (index: number, delta: number) => {
        setProductosNuevos((prev) => {
            const nuevos = [...prev];
            const nuevaCant = Math.max(1, nuevos[index].cantidad + delta);
            nuevos[index] = {
                ...nuevos[index],
                cantidad: nuevaCant,
                subtotal: nuevaCant * nuevos[index].precio,
            };

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
            router.post(
                `/pedidos/${pedidoEdit.id}/agregar-productos`,
                {
                    productos_nuevos: productosNuevos,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Productos agregados, enviados a cocina');
                        onPedidoActualizado(pedidoEdit.id);
                        onClose();
                    },
                    onError: (errors) => {
                        alert(
                            'Error al agregar productos: ' +
                                Object.values(errors).join(' '),
                        );
                    },
                    onFinish: () => setGuardando(false),
                },
            );

            return;
        }

        if (pedidoEdit.productos.length === 0) {
            alert('El pedido no puede quedar vacío');

            return;
        }

        setGuardando(true);
        router.put(
            `/pedidos/${pedidoEdit.id}`,
            {
                productos: pedidoEdit.productos,
                total: pedidoEdit.total,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pedido actualizado');
                    onPedidoActualizado(pedidoEdit.id);
                    onClose();
                },
                onError: (errors) => {
                    alert(
                        'Error al actualizar: ' +
                            Object.values(errors).join(' '),
                    );
                },
                onFinish: () => setGuardando(false),
            },
        );
    };

    const cancelarPedido = () => {
        if (!confirm('¿Seguro que deseas cancelar este pedido?')) {
            return;
        }

        router.patch(
            `/pedidos/${pedidoEdit.id}/cancelar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pedido cancelado');
                    onPedidoCancelado(pedidoEdit.id);
                    onClose();
                },
            },
        );
    };

    return (
        <>
            {/* Modal principal de edición */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-roast to-espresso px-6 py-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {soloAgregar
                                    ? 'Agregar productos'
                                    : 'Editar Pedido'}
                            </h2>
                            <p className="text-xs text-white/60">
                                {pedidoEdit.numero}
                            </p>
                            {soloAgregar && (
                                <p className="mt-0.5 text-[10px] text-amber-200">
                                    Este pedido ya está en cocina. Solo puedes
                                    agregar productos nuevos.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
                        {/* Productos ya enviados a cocina */}
                        <div className="mb-4 space-y-2">
                            <p className="text-sm font-semibold text-chocolate">
                                {soloAgregar
                                    ? 'Ya enviado a cocina (no editable)'
                                    : 'Productos'}
                            </p>
                            {pedidoEdit.productos.map(
                                (item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between rounded-xl border p-2 ${soloAgregar ? 'border-wheat bg-sand opacity-70' : 'border-wheat bg-cream-soft'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-chocolate">
                                                {item.nombre}
                                            </p>
                                            <p className="text-xs text-cocoa-soft">
                                                S/{' '}
                                                {Number(item.precio).toFixed(2)}{' '}
                                                c/u
                                            </p>
                                        </div>
                                        {esEditableCompleto ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        cambiarCantidad(idx, -1)
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-sand text-sm font-bold text-cocoa hover:bg-wheat"
                                                >
                                                    -
                                                </button>
                                                <span className="w-4 text-center text-sm font-bold">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        cambiarCantidad(idx, 1)
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold hover:bg-gold/30"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        eliminarProducto(idx)
                                                    }
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="px-2 text-sm font-bold text-chocolate">
                                                x{item.cantidad}
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                            {pedidoEdit.productos.length === 0 && (
                                <p className="py-4 text-center text-sm text-cocoa-soft">
                                    No hay productos
                                </p>
                            )}
                        </div>

                        {/* Productos nuevos (solo en modo agregar) */}
                        {soloAgregar && (
                            <div className="mb-4 space-y-2">
                                <p className="text-sm font-semibold text-chocolate">
                                    Nuevos productos (por enviar)
                                </p>
                                {productosNuevos.length === 0 && (
                                    <p className="py-2 text-center text-xs text-cocoa-soft">
                                        Aún no agregaste nada nuevo
                                    </p>
                                )}
                                {productosNuevos.map(
                                    (item: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-xl border border-gold/40 bg-cream p-2"
                                        >
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-chocolate">
                                                    {item.nombre}
                                                </p>
                                                <p className="text-xs text-cocoa-soft">
                                                    S/{' '}
                                                    {Number(
                                                        item.precio,
                                                    ).toFixed(2)}{' '}
                                                    c/u
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        cambiarCantidadNuevo(
                                                            idx,
                                                            -1,
                                                        )
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-sand text-sm font-bold text-cocoa hover:bg-wheat"
                                                >
                                                    -
                                                </button>
                                                <span className="w-4 text-center text-sm font-bold">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        cambiarCantidadNuevo(
                                                            idx,
                                                            1,
                                                        )
                                                    }
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold hover:bg-gold/30"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        eliminarProductoNuevo(
                                                            idx,
                                                        )
                                                    }
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        {/* Botón Agregar productos */}
                        <button
                            onClick={() => setModalAgregarAbierto(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep"
                        >
                            <Plus className="h-4 w-4" /> Agregar productos
                        </button>

                        {/* Total */}
                        <div className="mt-3 flex items-center justify-between border-t border-sand pt-3">
                            <span className="font-bold text-chocolate">
                                {soloAgregar
                                    ? 'Total nuevo (a agregar)'
                                    : 'Total'}
                            </span>
                            <span className="text-xl font-bold text-gold">
                                S/{' '}
                                {(soloAgregar
                                    ? totalNuevos
                                    : Number(pedidoEdit.total)
                                ).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 border-t border-sand px-6 py-4">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border-2 border-wheat py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={guardarCambios}
                            disabled={guardando}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />{' '}
                            {soloAgregar ? 'Enviar a cocina' : 'Guardar'}
                        </button>
                        {esEditableCompleto && (
                            <button
                                onClick={cancelarPedido}
                                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                                <Trash2 className="h-4 w-4" /> Cancelar
                            </button>
                        )}
                    </div>

                    {/* Cerrar contenedores del modal principal */}
                </div>
            </div>

            {/* Modal Agregar Productos */}
            {modalAgregarAbierto && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl">
                        <div className="flex items-center justify-between bg-gradient-to-r from-roast to-espresso px-6 py-4">
                            <h2 className="text-xl font-bold text-white">
                                Agregar Productos
                            </h2>
                            <button
                                onClick={() => setModalAgregarAbierto(false)}
                                className="text-white/60 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                className="mb-4 w-full rounded-xl border-2 border-wheat px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={busquedaAgregar}
                                onChange={(e) =>
                                    setBusquedaAgregar(e.target.value)
                                }
                            />

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                {productos
                                    .filter((p) => p.stock > 0 && p.disponible)
                                    .filter((p) =>
                                        p.nombre
                                            .toLowerCase()
                                            .includes(
                                                busquedaAgregar.toLowerCase(),
                                            ),
                                    )
                                    .map((producto) => (
                                        <button
                                            key={producto.id}
                                            onClick={() =>
                                                agregarProductos(producto)
                                            }
                                            className="rounded-xl border-2 border-wheat bg-cream-soft px-3 py-2 text-left text-sm transition hover:border-gold hover:bg-cream"
                                        >
                                            <p className="font-medium text-chocolate">
                                                {producto.nombre}
                                            </p>
                                            <p className="font-bold text-gold">
                                                S/ {producto.precio.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-cocoa-soft">
                                                Stock: {producto.stock}
                                            </p>
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
