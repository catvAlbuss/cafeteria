import { X, Check, Package } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ModalInsumoProps {
    isOpen: boolean;
    onClose: () => void;
    insumo?: any;
    onSave: (data: any) => void;
}

export default function ModalInsumo({ isOpen, onClose, insumo, onSave }: ModalInsumoProps) {
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

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formulario);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8] sticky top-0 bg-white rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#2D1B1A]">
                                {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                            </h2>
                            <p className="text-xs text-[#5A3D2B]">
                                {insumo ? 'Modifica los datos del insumo' : 'Registra un nuevo insumo'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Nombre *</label>
                        <input
                            type="text"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                            value={formulario.nombre}
                            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                            placeholder="Ej: Café molido"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Categoría</label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                value={formulario.categoria}
                                onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                                placeholder="Ej: Cafetería"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Unidad *</label>
                            <select
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                value={formulario.unidad}
                                onChange={(e) => setFormulario({ ...formulario, unidad: e.target.value })}
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
                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Área responsable *</label>
                        <select
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50"
                            value={formulario.area}
                            onChange={(e) => setFormulario({ ...formulario, area: e.target.value })}
                        >
                            <option value="cocina">Cocina</option>
                            <option value="bar">Bar</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Administración define quién podrá visualizar este insumo.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Stock mínimo</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50"
                                value={formulario.stock_minimo}
                                onChange={(e) => setFormulario({ ...formulario, stock_minimo: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Fecha de vencimiento</label>
                            <input
                                type="date"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50"
                                value={formulario.fecha_vencimiento}
                                onChange={(e) => setFormulario({ ...formulario, fecha_vencimiento: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Precio (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                value={formulario.precio}
                                onChange={(e) => setFormulario({ ...formulario, precio: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Stock inicial</label>
                            <input
                                type="number"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                value={formulario.stock}
                                onChange={(e) => setFormulario({ ...formulario, stock: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Proveedor</label>
                        <input
                            type="text"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                            value={formulario.proveedor}
                            onChange={(e) => setFormulario({ ...formulario, proveedor: e.target.value })}
                            placeholder="Nombre del proveedor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Estado</label>
                        <select
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                            value={formulario.activo ? '1' : '0'}
                            onChange={(e) => setFormulario({ ...formulario, activo: e.target.value === '1' })}
                        >
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Check className="w-4 h-4" />
                        {insumo ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    );
}
