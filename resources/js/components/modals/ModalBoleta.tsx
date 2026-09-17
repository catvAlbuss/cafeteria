import { useState, useEffect } from 'react';
import { X, Receipt, FileText, Banknote, CreditCard, Smartphone, KeyRound, Search, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// ============================================================
// INTERFACES
// ============================================================

interface ProductoBoleta {
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

interface ModalBoletaProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    data: {
        pedidoIds?: number[];
        mesaId?: number;
        cliente: string;
        mesa: string | null;
        tipo: string;
        metodoPago?: string;
        productos: ProductoBoleta[];
        subtotal: number;
        igv: number;
        total: number;
    } | null;
}

type TipoComprobante = 'boleta' | 'factura';

// ============================================================
// COMPONENTE
// ============================================================
export default function ModalBoleta({ isOpen, onClose, onSuccess, data }: ModalBoletaProps) {
    // Estado del tipo de comprobante
    const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante | null>(null);

    // Estados del formulario
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [authorizationPin, setAuthorizationPin] = useState('');
    const [documento, setDocumento] = useState('');
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [emitiendo, setEmitiendo] = useState(false);

    // Reset cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setTipoComprobante(null);
            setMetodoPago('efectivo');
            setAuthorizationPin('');
            setDocumento('');
            setNombre('');
            setDireccion('');
            setBuscando(false);
            setEmitiendo(false);
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const { pedidoIds, mesaId, cliente, mesa, tipo, productos, subtotal, igv, total } = data;

    const tipoTexto = tipo === 'salon' ? '🪑 Salón' : tipo === 'llevar' ? '📦 Llevar' : '🚚 Delivery';

    // ============================================================
    // BUSCAR RUC (solo para factura)
    // ============================================================
    const buscarDocumento = async () => {
        if (!documento || documento.length !== 11) {
            toast.error('Ingresa un RUC válido de 11 dígitos');
            return;
        }

        setBuscando(true);
        try {
            const { data: response } = await axios.get(`/facturacion/buscar-ruc/${documento}`);
            setNombre(response.razonSocial || response.nombre || '');
            setDireccion(response.direccion || '');
            toast.success('Datos encontrados');
        } catch (error) {
            toast.error('No se encontraron datos para ese RUC');
        } finally {
            setBuscando(false);
        }
    };

    // ============================================================
    // EMITIR COMPROBANTE
    // ============================================================
    const emitirComprobante = async () => {
        // Validaciones
        if (!tipoComprobante) {
            toast.error('Selecciona el tipo de comprobante');
            return;
        }

        if (authorizationPin.length !== 4) {
            toast.error('Ingresa el PIN de 4 dígitos');
            return;
        }

        if (tipoComprobante === 'factura') {
            if (documento.length !== 11) {
                toast.error('Ingresa un RUC válido de 11 dígitos');
                return;
            }
            if (!nombre) {
                toast.error('Ingresa la razón social');
                return;
            }
        }

        setEmitiendo(true);
        try {
            const payload: any = {
                pedido_ids: pedidoIds,
                tipo_documento: tipoComprobante === 'factura' ? '01' : '03',
                documento: tipoComprobante === 'factura'
                    ? documento
                    : (documento.length === 8 ? documento : '00000000'),
                nombre: tipoComprobante === 'factura'
                    ? nombre
                    : 'CLIENTES VARIOS',
                direccion: tipoComprobante === 'factura' ? direccion : '-',
                metodo_pago: metodoPago,
                authorization_pin: authorizationPin,
            };

            // Si es cobro de mesa, agregar mesa_id
            if (mesaId) {
                payload.mesa_id = mesaId;
            }

            const { data: response } = await axios.post('/pedidos/emitir-comprobante', payload);

            if (response.success) {
                toast.success(tipoComprobante === 'factura' ? 'Factura emitida correctamente' : 'Boleta emitida correctamente');
                if (response.pdf_url) {
                    window.open(response.pdf_url, '_blank');
                }
                setTimeout(() => {
                    onClose();
                    onSuccess();
                }, 1500);
            } else {
                toast.error(response.error || 'Error al emitir comprobante');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al conectar con el servidor';
            toast.error(errorMsg);
        } finally {
            setEmitiendo(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">

                {/* ===== HEADER ===== */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-[#FBF7F0] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#C9A96E] rounded-full flex items-center justify-center">
                            {tipoComprobante === 'factura' ? (
                                <FileText className="w-4 h-4 text-white" />
                            ) : (
                                <Receipt className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#2D1B1A]">DOLCE CAFFE</p>
                            <p className="text-[10px] text-gray-400">
                                {tipoComprobante === 'factura' ? 'Factura' : tipoComprobante === 'boleta' ? 'Boleta' : 'Cobrar'} · Mesa #{mesa}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ===== CONTENIDO ===== */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1">

                    {/* ===== PASO 1: SELECCIÓN DE TIPO ===== */}
                    {!tipoComprobante && (
                        <div className="space-y-3">
                            <p className="text-center text-sm font-medium text-gray-600 mb-4">
                                ¿Qué comprobante desea emitir?
                            </p>

                            {/* BOTÓN BOLETA */}
                            <button
                                onClick={() => setTipoComprobante('boleta')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                                    <Receipt className="w-6 h-6 text-[#C9A96E]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[#2D1B1A]">BOLETA</p>
                                    <p className="text-xs text-gray-500">Para personas naturales</p>
                                </div>
                            </button>

                            {/* BOTÓN FACTURA */}
                            <button
                                onClick={() => setTipoComprobante('factura')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-[#C9A96E]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[#2D1B1A]">FACTURA</p>
                                    <p className="text-xs text-gray-500">Para empresas con RUC</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ===== PASO 2: FORMULARIO ===== */}
                    {tipoComprobante && (
                        <>
                            {/* RESUMEN DEL PEDIDO */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Resumen del pedido</p>
                                <div className="space-y-1">
                                    {productos.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{item.cantidad}x {item.nombre}</span>
                                            <span className="font-medium">S/ {item.subtotal.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-base font-bold">
                                    <span>TOTAL</span>
                                    <span className="text-[#C9A96E]">S/ {total.toFixed(2)}</span>
                                </div>
                            </div>
                            {/* DNI OPCIONAL (solo boleta) */}
                            {tipoComprobante === 'boleta' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        DNI del cliente <span className="text-gray-400">(opcional)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            placeholder="Ej: 12345678"
                                            value={documento}
                                            onChange={(e) => {
                                                const valor = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                setDocumento(valor);
                                            }}
                                            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                        />
                                    </div>
                                    {documento.length > 0 && documento.length < 8 && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            El DNI debe tener 8 dígitos ({documento.length}/8)
                                        </p>
                                    )}
                                    {documento.length === 0 && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Si no lo ingresa, se emitirá como CLIENTES VARIOS
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* DATOS DE LA FACTURA (solo factura) */}
                            {tipoComprobante === 'factura' && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Datos de la factura</p>

                                    {/* RUC */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            RUC <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={11}
                                                placeholder="Ej: 20100070970"
                                                value={documento}
                                                onChange={(e) => {
                                                    const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                    setDocumento(valor);
                                                }}
                                                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                            />
                                            <button
                                                type="button"
                                                onClick={buscarDocumento}
                                                disabled={buscando || documento.length !== 11}
                                                className="px-3 py-2 rounded-lg bg-[#C9A96E] text-white text-xs font-medium hover:bg-[#B8975D] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {documento.length > 0 && documento.length !== 11 && (
                                            <p className="text-[10px] text-red-500 mt-1">
                                                El RUC debe tener 11 dígitos ({documento.length}/11)
                                            </p>
                                        )}
                                    </div>

                                    {/* RAZÓN SOCIAL */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Razón Social <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: BANCO INTERNACIONAL DEL PERU S.A.A."
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                        />
                                    </div>

                                    {/* DIRECCIÓN */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Dirección <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: AV. CARLOS VILLARAN 195, LIMA"
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C9A96E]"
                                        />
                                    </div>

                                    {/* NOTA */}
                                    <p className="text-[10px] text-gray-500">
                                        <span className="text-red-500">*</span> Todos los campos son obligatorios
                                    </p>
                                </div>
                            )}

                            {/* MÉTODO DE PAGO */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Método de pago</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('efectivo')}
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${metodoPago === 'efectivo'
                                            ? 'bg-[#C9A96E] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Banknote className="h-4 w-4" />
                                        <span>Efectivo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('tarjeta')}
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${metodoPago === 'tarjeta'
                                            ? 'bg-[#C9A96E] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        <span>Tarjeta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('yape')}
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${metodoPago === 'yape'
                                            ? 'bg-[#C9A96E] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Smartphone className="h-4 w-4" />
                                        <span>Yape/Plin</span>
                                    </button>
                                </div>
                            </div>

                            {/* PIN */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">PIN de autorización</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        autoComplete="off"
                                        placeholder="••••"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-center text-sm tracking-[0.5em] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={authorizationPin}
                                        onChange={(e) => setAuthorizationPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    />
                                </div>
                            </div>

                            {/* BOTÓN EMITIR */}
                            <button
                                type="button"
                                onClick={emitirComprobante}
                                disabled={
                                    emitiendo ||
                                    authorizationPin.length !== 4 ||
                                    (tipoComprobante === 'factura' && (
                                        documento.length !== 11 ||
                                        !nombre ||
                                        !direccion
                                    ))
                                }
                                className="w-full py-3 rounded-xl bg-[#2D1B1A] text-white text-sm font-semibold hover:bg-[#1A0F0E] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {emitiendo ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Emitiendo...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        {tipoComprobante === 'factura' ? 'Emitir Factura' : 'Emitir Boleta'}
                                    </>
                                )}
                            </button>

                            {/* VOLVER */}
                            <button
                                type="button"
                                onClick={() => setTipoComprobante(null)}
                                className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition"
                            >
                                ← Volver a seleccionar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}