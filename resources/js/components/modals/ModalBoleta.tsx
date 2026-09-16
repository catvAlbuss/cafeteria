import { useState, useEffect } from 'react';
import { X, CheckCircle, Receipt, KeyRound, Banknote, CreditCard, Smartphone } from 'lucide-react';
import ComprobanteElectronico from './ComprobanteElectronico';

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

// ============================================================
// COMPONENTE
// ============================================================
export default function ModalBoleta({ isOpen, onClose, onSuccess, data }: ModalBoletaProps) {
    const [authorizationPin, setAuthorizationPin] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [comprobanteEmitido, setComprobanteEmitido] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            setAuthorizationPin('');
            setMetodoPago(data?.metodoPago || 'efectivo');
            setComprobanteEmitido(null);
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const { pedidoIds, mesaId, cliente, mesa, tipo, productos, subtotal, igv, total } = data;
    const numeroBoleta = 'B001-' + String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const hora = now.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const tipoTexto = tipo === 'salon' ? '🪑 Salón' : tipo === 'llevar' ? '📦 Llevar' : '🚚 Delivery';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[95vh] flex flex-col">

                {/* ===== HEADER ===== */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-[#FBF7F0] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#C9A96E] rounded-full flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#2D1B1A]">DOLCE CAFEE</p>
                            <p className="text-[10px] text-gray-400">Boleta de Venta</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto flex-1">

                    {/* ===== BOLETA ===== */}
                    <div
                        className="bg-white rounded-xl p-3 border border-gray-200"
                        id="boleta-print"
                    >
                        {/* SHOP NAME CON LOGO */}
                        <div className="text-center pb-2 mb-2" style={{ borderBottom: '1.5px dashed #ccc' }}>
                            <img
                                src="/img/logoTiket.png"
                                alt="DOLCE CAFE"
                                style={{
                                    maxWidth: '90px',
                                    margin: '0 auto 6px auto',
                                    display: 'block'
                                }}
                            />
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#000000', letterSpacing: '2px' }}>
                                DOLCE CAFE
                            </p>
                            <p style={{ fontSize: '11px', color: '#333333', marginTop: '2px' }}>
                                Av. Principal 123, Lima
                            </p>
                            <p style={{ fontSize: '11px', color: '#333333' }}>
                                Telp. 11223344
                            </p>
                        </div>

                        {/* TITLE */}
                        <div className="text-center pb-2 mb-2" style={{ borderBottom: '1.5px dashed #ccc' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#000000', letterSpacing: '1.5px' }}>
                                BOLETA DE VENTA
                            </p>
                            <p style={{ fontSize: '11px', color: '#444444', marginTop: '2px' }}>
                                N° {numeroBoleta}
                            </p>
                            <p style={{ fontSize: '11px', color: '#444444' }}>
                                {fecha} {hora}
                            </p>
                        </div>

                        {/* CLIENTE */}
                        <div className="pb-2 mb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                padding: '2px 0',
                                color: '#000000'
                            }}>
                                <span style={{ color: '#333333' }}>Cliente</span>
                                <span style={{ fontWeight: 600, color: '#000000' }}>
                                    {cliente && cliente !== 'Anónimo' ? cliente : 'CLIENTES VARIOS'}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                padding: '2px 0',
                                color: '#000000'
                            }}>
                                <span style={{ color: '#333333' }}>Tipo</span>
                                <span style={{ fontWeight: 600, color: '#000000' }}>{tipoTexto}</span>
                            </div>
                            {mesa && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    padding: '2px 0',
                                    color: '#000000'
                                }}>
                                    <span style={{ color: '#333333' }}>Mesa</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{mesa}</span>
                                </div>
                            )}
                        </div>

                        {/* PRODUCTOS */}
                        <div className="mb-2">
                            <div className="flex justify-between pb-1 mb-1" style={{ borderBottom: '1.5px solid #ddd' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000', letterSpacing: '1px' }}>
                                    DESCRIPCIÓN
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000', letterSpacing: '1px' }}>
                                    PRECIO
                                </span>
                            </div>
                            {productos.map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '13px',
                                    padding: '2px 0',
                                    color: '#000000'
                                }}>
                                    <span style={{ flex: 1, color: '#000000' }}>
                                        {item.cantidad}x {item.nombre}
                                    </span>
                                    <span style={{ fontWeight: 600, minWidth: '60px', textAlign: 'right', color: '#000000' }}>
                                        {item.subtotal.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* TOTALES */}
                        <div className="pt-2 mb-2" style={{ borderTop: '2px dashed #ccc' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '3px 0',
                                color: '#000000'
                            }}>
                                <span style={{ color: '#333333' }}>Subtotal</span>
                                <span style={{ fontWeight: 600, color: '#000000' }}>{subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '3px 0',
                                color: '#000000'
                            }}>
                                <span style={{ color: '#333333' }}>IGV (18%)</span>
                                <span style={{ fontWeight: 600, color: '#000000' }}>{igv.toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#000000',
                                padding: '4px 0',
                                borderTop: '2px solid #000000'
                            }}>
                                <span style={{ color: '#000000' }}>TOTAL</span>
                                <span style={{ color: '#000000' }}>{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* MÉTODO DE PAGO */}
                        <div className="pt-2 mb-2" style={{ borderTop: '1.5px dashed #ccc' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                padding: '3px 0',
                                color: '#000000'
                            }}>
                                <span style={{ color: '#333333' }}>Método de pago</span>
                                <span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>
                                    {metodoPago}
                                </span>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="text-center pt-2" style={{ borderTop: '2px dashed #ccc' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#000000', letterSpacing: '1.5px' }}>
                                ¡GRACIAS POR SU VISITA!
                            </p>
                            <p style={{ fontSize: '11px', color: '#333333', marginTop: '3px' }}>
                                Atendido por: Sistema
                            </p>
                            <p style={{ fontSize: '9px', color: '#666666', marginTop: '2px' }}>
                                Este comprobante es válido como boleta de venta
                            </p>
                        </div>
                    </div>

                    {/* ===== MÉTODO DE PAGO ===== */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setMetodoPago('efectivo')}
                            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${metodoPago === 'efectivo'
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
                            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${metodoPago === 'tarjeta'
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
                            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${metodoPago === 'yape'
                                    ? 'bg-[#C9A96E] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Smartphone className="h-4 w-4" />
                            <span>Yape/Plin</span>
                        </button>
                    </div>

                    {/* ===== PIN ===== */}
                    <div className="flex-shrink-0">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                            PIN de autorización
                        </label>
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
                                onChange={event => setAuthorizationPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                        </div>
                    </div>

                    {/* ===== COMPROBANTE ELECTRÓNICO ===== */}
                    {pedidoIds && pedidoIds.length > 0 && (
                        <ComprobanteElectronico
                            pedidoIds={pedidoIds}
                            total={total}
                            mesaId={mesaId}
                            metodoPago={metodoPago}
                            authorizationPin={authorizationPin}
                            onComprobanteEmitido={(respuesta) => {
                                setComprobanteEmitido(respuesta);
                                if (respuesta.pdf_url) {
                                    window.open(respuesta.pdf_url, '_blank');
                                }
                                setTimeout(() => {
                                    onClose();
                                    onSuccess();
                                }, 2000);
                            }}
                            onError={(error) => {
                                console.error('Error al emitir comprobante:', error);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}