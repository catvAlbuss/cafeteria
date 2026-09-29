import { X, Check, Package } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ModalInsumoProps {
    isOpen: boolean;
    onClose: () => void;
    insumo?: any;
    onSave: (data: any) => void;
}

export default function ModalInsumo({
    isOpen,
    onClose,
    insumo,
    onSave,
}: ModalInsumoProps) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        categoria: '',
        area: 'cocina',
        unidad: 'kg',
        stock: 0,
        stock_minimo: 5,
        fecha_vencimiento: '',
        precio: 0,
        proveedor: '',
        activo: true,
    });

    useEffect(() => {
        if (insumo) {
            setFormulario({
                nombre: insumo.nombre || '',
                categoria: insumo.categoria || '',
                area: insumo.area || 'cocina',
                unidad: insumo.unidad || 'kg',
                stock: insumo.stock || 0,
                stock_minimo: insumo.stock_minimo ?? 5,
                fecha_vencimiento: insumo.fecha_vencimiento?.slice(0, 10) || '',
                precio: insumo.precio || 0,
                proveedor: insumo.proveedor || '',
                activo: insumo.activo ?? true,
            });
        } else {
            setFormulario({
                nombre: '',
                categoria: '',
                area: 'cocina',
                unidad: 'kg',
                stock: 0,
                stock_minimo: 5,
                fecha_vencimiento: '',
                precio: 0,
                proveedor: '',
                activo: true,
            });
        }
    }, [insumo]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formulario);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card shadow-2xl">
                {/* HEADER */}
                <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b border-sand bg-card p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 shadow-lg">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-chocolate">
                                {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                            </h2>
                            <p className="text-xs text-cocoa">
                                {insumo
                                    ? 'Modifica los datos del insumo'
                                    : 'Registra un nuevo insumo'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="space-y-4 p-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={formulario.nombre}
                            onChange={(e) =>
                                setFormulario({
                                    ...formulario,
                                    nombre: e.target.value,
                                })
                            }
                            placeholder="Ej: Café molido"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Categoría
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.categoria}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        categoria: e.target.value,
                                    })
                                }
                                placeholder="Ej: Cafetería"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Unidad *
                            </label>
                            <select
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.unidad}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        unidad: e.target.value,
                                    })
                                }
                            >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="mL">mL</option>
                                <option value="unidades">unidades</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                            Área responsable *
                        </label>
                        <select
                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={formulario.area}
                            onChange={(e) =>
                                setFormulario({
                                    ...formulario,
                                    area: e.target.value,
                                })
                            }
                        >
                            <option value="cocina">Cocina</option>
                            <option value="bar">Bar</option>
                        </select>
                        <p className="mt-1 text-xs text-cocoa">
                            Administración define quién podrá visualizar este
                            insumo.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Stock mínimo
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.stock_minimo}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        stock_minimo:
                                            parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Fecha de vencimiento
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.fecha_vencimiento}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        fecha_vencimiento: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Precio (S/)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.precio}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        precio: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                Stock inicial
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={formulario.stock}
                                onChange={(e) =>
                                    setFormulario({
                                        ...formulario,
                                        stock: parseFloat(e.target.value) || 0,
                                    })
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                            Proveedor
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={formulario.proveedor}
                            onChange={(e) =>
                                setFormulario({
                                    ...formulario,
                                    proveedor: e.target.value,
                                })
                            }
                            placeholder="Nombre del proveedor"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                            Estado
                        </label>
                        <select
                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={formulario.activo ? '1' : '0'}
                            onChange={(e) =>
                                setFormulario({
                                    ...formulario,
                                    activo: e.target.value === '1',
                                })
                            }
                        >
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-3xl border-t border-sand bg-card p-6">
                    <button
                        onClick={onClose}
                        className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                    >
                        <Check className="h-4 w-4" />
                        {insumo ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    );
}
