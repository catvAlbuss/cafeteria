import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { X, CheckCircle, CreditCard, Banknote, Smartphone, Printer } from 'lucide-react';

interface Mesa {
    id: number;
    numero: string;
    capacidad: number;
    mesero?: string | null;
}

interface ProductoPedido {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

interface Pedido {
    id: number;
    numero: string;
    mesa_id: number;
    cliente: string;
    productos: ProductoPedido[] | string;
    total: number | string;
    hora_pedido: string;
    estado: string;
}

interface ModalCobroProps {
    isOpen: boolean;
    mesa: Mesa | null;
    pedido?: Pedido | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalCobro({ isOpen, mesa, pedido, onClose, onSuccess }: ModalCobroProps) {
    const [metodoPago, setMetodoPago] = useState<string>('efectivo');
    const [montoRecibido, setMontoRecibido] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);

    // ✅ useEffect DECLARADO ANTES DEL EARLY RETURN
    useEffect(() => {
        if (exito) {
            const timer = setTimeout(() => {
                onClose();
                router.reload();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [exito, onClose]);

    // ✅ Early return DESPUÉS de todos los hooks
    if (!isOpen || !mesa) return null;

    const total = typeof pedido?.total === 'number' 
        ? pedido.total 
        : parseFloat(pedido?.total as string) || 0;

    const productos = pedido?.productos 
        ? (typeof pedido.productos === 'string' ? JSON.parse(pedido.productos) : pedido.productos) 
        : [];

    const handleCobrar = () => {
        setCargando(true);
        setTimeout(() => {
            setCargando(false);
            setExito(true);
            router.patch(`/mesas/${mesa.id}`, { estado: 'libre' }, {
                onSuccess: () => {
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                        router.reload();
                    }, 1500);
                }
            });
        }, 1500);
    };

    const handleClose = () => {
        if (!exito) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                
                {/* ===== HEADER ===== */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-[#FBF7F0]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#C9A96E] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {mesa.numero}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#2D1B1A]">DOLCE CAFE</p>
                            <p className="text-[10px] text-gray-400">Mesa #{mesa.numero}</p>
                        </div>
                    </div>
                    {!exito && (
                        <button
                            onClick={handleClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600"
                            disabled={cargando}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {!exito ? (
                    <div className="p-5 space-y-4">
                        
                        {/* ===== TIKET ===== */}
                        <div className="bg-[#FBF7F0] rounded-xl p-4 border border-dashed border-[#C9A96E]/30">
                            <div className="text-center border-b border-dashed border-[#C9A96E]/30 pb-2 mb-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Comprobante de consumo</p>
                                <p className="text-xs text-gray-400">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                            </div>
                            
                            <div className="space-y-1">
                                {productos.length > 0 ? (
                                    productos.map((item: ProductoPedido, index: number) => (
                                        <div key={index} className="flex justify-between text-sm py-0.5 border-b border-gray-100/50">
                                            <span className="text-gray-700">{item.cantidad}x {item.nombre}</span>
                                            <span className="text-gray-600 font-medium">S/ {item.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 text-center">Sin productos</p>
                                )}
                            </div>

                            <div className="border-t-2 border-dashed border-[#C9A96E]/30 pt-2 mt-2 flex justify-between font-bold">
                                <span className="text-[#2D1B1A]">TOTAL</span>
                                <span className="text-[#C9A96E] text-lg">S/ {total.toFixed(2)}</span>
                            </div>

                            <div className="text-center mt-2">
                                <p className="text-[8px] text-gray-400 uppercase tracking-[0.15em]">
                                    {mesa.mesero ? `Atendido por: ${mesa.mesero}` : 'Gracias por su visita'}
                                </p>
                            </div>
                        </div>

                        {/* ===== MÉTODO DE PAGO ===== */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setMetodoPago('efectivo')}
                                className={`py-2.5 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-sm ${
                                    metodoPago === 'efectivo'
                                        ? 'bg-[#C9A96E] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <Banknote className="w-5 h-5" />
                                <span>Efectivo</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('tarjeta')}
                                className={`py-2.5 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-sm ${
                                    metodoPago === 'tarjeta'
                                        ? 'bg-[#C9A96E] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span>Tarjeta</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('yape')}
                                className={`py-2.5 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-sm ${
                                    metodoPago === 'yape'
                                        ? 'bg-[#C9A96E] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <Smartphone className="w-5 h-5" />
                                <span>Yape/Plin</span>
                            </button>
                        </div>

                        {/* ===== EFECTIVO RECIBIDO ===== */}
                        {metodoPago === 'efectivo' && (
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-1">
                                    Efectivo recibido
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        S/
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 text-sm text-gray-900 placeholder-gray-500"
                                        value={montoRecibido}
                                        onChange={(e) => setMontoRecibido(e.target.value)}
                                    />
                                </div>
                                {montoRecibido && parseFloat(montoRecibido) > 0 && (
                                    <div className="flex justify-between text-sm mt-1 px-1">
                                        <span className="text-gray-500">Cambio</span>
                                        <span className="font-bold text-[#C9A96E]">
                                            S/ {(parseFloat(montoRecibido) - total).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== BOTÓN COBRAR ===== */}
                        <button
                            onClick={handleCobrar}
                            disabled={cargando}
                            className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                                cargando
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white'
                            }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Printer className="w-4 h-4" />
                                    Cobrar e Imprimir
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    /* ===== PANTALLA DE ÉXITO ===== */
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">¡Cobro exitoso! 🎉</h3>
                        <p className="text-gray-500 mt-2">Mesa #{mesa.numero} liberada</p>
                        <div className="mt-4 bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Total cobrado</p>
                            <p className="text-2xl font-bold text-[#C9A96E]">S/ {total.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-1">Comprobante impreso</p>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                router.reload();
                            }}
                            className="mt-6 w-full py-3 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-xl font-semibold transition"
                        >
                            ✅ Aceptar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}