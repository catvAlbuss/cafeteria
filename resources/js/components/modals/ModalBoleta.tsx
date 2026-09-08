import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { X, CheckCircle, Printer, Receipt, KeyRound } from 'lucide-react';

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
        cliente: string;
        mesa: string | null;
        tipo: string;
        metodoPago: string;
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
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);
    const [authorizationPin, setAuthorizationPin] = useState('');
    const boletaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setExito(false);
            setCargando(false);
            setAuthorizationPin('');
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const { cliente, mesa, tipo, metodoPago, productos, subtotal, igv, total } = data;
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

    const handleImprimir = () => {
        if (authorizationPin.length !== 4) {
            alert('Ingresa el PIN de 4 dígitos');
            return;
        }

        setCargando(true);

        setTimeout(() => {
            setCargando(false);
            setExito(true);

            if (boletaRef.current) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Boleta de Venta</title>
                                <style>
                                    * { margin: 0; padding: 0; box-sizing: border-box; }
                                    body { 
                                        font-family: 'Segoe UI', Arial, sans-serif;
                                        background: #f5f5f5;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        min-height: 100vh;
                                        padding: 20px;
                                    }
                                    .boleta-print {
                                        width: 300px;
                                        padding: 20px 18px;
                                        background: white;
                                        border-radius: 8px;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                    }
                                    .text-center { text-align: center; }
                                    .text-right { text-align: right; }
                                    .font-bold { font-weight: 700; }
                                    .uppercase { text-transform: uppercase; }
                                    .mb-1 { margin-bottom: 4px; }
                                    .mb-2 { margin-bottom: 8px; }
                                    .mb-3 { margin-bottom: 12px; }
                                    .pb-1 { padding-bottom: 4px; }
                                    .pb-2 { padding-bottom: 8px; }
                                    .pb-3 { padding-bottom: 12px; }
                                    .pt-1 { padding-top: 4px; }
                                    .pt-2 { padding-top: 8px; }
                                    .pt-3 { padding-top: 12px; }
                                    .text-dark { color: #1a1a1a; }
                                    .text-gray { color: #555; }
                                    .text-muted { color: #777; }
                                    .text-sm { font-size: 11px; }
                                    .text-base { font-size: 13px; }
                                    .text-lg { font-size: 15px; }
                                    .text-xl { font-size: 18px; }
                                    .tracking-wide { letter-spacing: 1.5px; }
                                    .shop-name { 
                                        font-size: 18px; 
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 2px;
                                    }
                                    .shop-address {
                                        font-size: 11px;
                                        color: #444;
                                        margin-top: 2px;
                                    }
                                    .shop-phone {
                                        font-size: 11px;
                                        color: #444;
                                    }
                                    .title {
                                        font-size: 13px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1.5px;
                                    }
                                    .date-time {
                                        font-size: 11px;
                                        color: #555;
                                        margin-top: 2px;
                                    }
                                    .table-header {
                                        font-size: 12px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1px;
                                    }
                                    .product-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 13px;
                                        padding: 2px 0;
                                        color: #1a1a1a;
                                    }
                                    .product-name { flex: 1; color: #1a1a1a; }
                                    .product-price {
                                        font-weight: 600;
                                        min-width: 60px;
                                        text-align: right;
                                        color: #1a1a1a;
                                    }
                                    .total-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 16px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        padding: 4px 0;
                                    }
                                    .payment-row {
                                        display: flex;
                                        justify-content: space-between;
                                        font-size: 13px;
                                        padding: 3px 0;
                                        color: #1a1a1a;
                                    }
                                    .payment-label { color: #444; }
                                    .payment-value { font-weight: 600; color: #1a1a1a; }
                                    .payment-method-value {
                                        color: #1a1a1a;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                    }
                                    .footer-text {
                                        font-size: 14px;
                                        font-weight: 700;
                                        color: #1a1a1a;
                                        letter-spacing: 1.5px;
                                    }
                                    .footer-attended {
                                        font-size: 11px;
                                        color: #444;
                                        margin-top: 3px;
                                    }
                                    .divider-dashed {
                                        border: none;
                                        border-bottom: 1.5px dashed #ccc;
                                        margin: 6px 0;
                                    }
                                    .divider-dashed-thick {
                                        border: none;
                                        border-bottom: 2px dashed #ccc;
                                        margin: 8px 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="boleta-print">${boletaRef.current.innerHTML}</div>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            }
        }, 1000);
    };

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
                    {!exito && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-400 hover:text-gray-600"
                            disabled={cargando}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {!exito ? (
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">

                        {/* ===== BOLETA ===== */}
                        <div
                            ref={boletaRef}
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
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{cliente || 'Anónimo'}</span>
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
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    padding: '2px 0',
                                    color: '#666666'
                                }}>
                                    <span style={{ color: '#666666' }}>N° Operación</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>
                                        #OP-{String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}
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

                        {/* ===== BOTÓN IMPRIMIR ===== */}
                        <button
                            onClick={handleImprimir}
                            disabled={cargando || authorizationPin.length !== 4}
                            className={`w-full py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm ${cargando || authorizationPin.length !== 4
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white'
                                }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Printer className="w-4 h-4" />
                                    Imprimir Boleta
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">¡Boleta emitida! ✅</h3>
                        <p className="text-gray-500 mt-2">N° {numeroBoleta}</p>
                        <div className="mt-4 bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-[#C9A96E]">S/ {total.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-1">Comprobante impreso</p>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                onSuccess();
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