import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { X, CheckCircle, CreditCard, Banknote, Smartphone, Printer } from 'lucide-react';

// ============================================================
// INTERFACES
// ============================================================

interface ProductoPedido {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

interface Mesa {
    id: number;
    numero: string;
    capacidad: number;
    mesero?: string | null;
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

// ============================================================
// COMPONENTE
// ============================================================

export default function ModalCobro({ isOpen, mesa, pedido, onClose, onSuccess }: ModalCobroProps) {
    const [metodoPago, setMetodoPago] = useState<string>('efectivo');
    const [montoRecibido, setMontoRecibido] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && mesa) {
            setExito(false);
            setCargando(false);
            setMetodoPago('efectivo');
            setMontoRecibido('');
        }
    }, [isOpen, mesa?.id]);

    if (!isOpen || !mesa) return null;

    const total = typeof pedido?.total === 'number'
        ? pedido.total
        : parseFloat(pedido?.total as string) || 0;

    const productos = pedido?.productos
        ? (typeof pedido.productos === 'string' ? JSON.parse(pedido.productos) : pedido.productos)
        : [];

    const montoRecibidoNum = parseFloat(montoRecibido) || 0;
    const cambio = montoRecibidoNum - total;

    const handleCobrar = () => {
        setCargando(true);

        const ventaData = {
            mesa_id: mesa.id,
            mesa: `Mesa ${mesa.numero}`,
            cliente: 'Anónimo',
            productos: productos.map((item: ProductoPedido) => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.subtotal
            })),
            total: total,
            metodo_pago: metodoPago,
            tipo: 'mesa',
            estado: 'pagado',
        };

        console.log('📤 Registrando venta:', ventaData);

        router.post('/pedidos', ventaData, {
            onSuccess: () => {
                console.log('✅ Venta registrada correctamente');

                // ✅ Imprimir ticket
                if (ticketRef.current) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(`
                        <html>
                            <head>
                                <title>Comprobante de Pago</title>
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
                                    .ticket-print {
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
                                <div class="ticket-print">${ticketRef.current.innerHTML}</div>
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

                router.patch(`/mesas/${mesa.id}`, { estado: 'libre' }, {
                    onSuccess: () => {
                        setCargando(false);
                        setExito(true);

                        
                        setTimeout(() => {
                            onSuccess(); // el padre hace router.reload({ only: ['mesas','pedidos'] })
                        }, 1200);
                    },
                    onError: (error) => {
                        console.log('❌ Error al liberar mesa:', error);
                        setCargando(false);
                        alert('La venta se registró pero hubo un error al liberar la mesa.');
                    }
                });
            },
            onError: (errors) => {
                console.log('❌ Error al registrar la venta:', errors);
                setCargando(false);
                alert('Error al registrar la venta: ' + Object.values(errors).join(' '));
            }
        });
    };

    const handleClose = () => {
        if (!exito) onClose();
    };

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[95vh] flex flex-col">

                {/* ===== HEADER ===== */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-[#FBF7F0] flex-shrink-0">
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
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">

                        {/* ===== TICKET ===== */}
                        <div
                            ref={ticketRef}
                            className="bg-white rounded-xl p-4 border border-gray-200"
                            id="ticket-print"
                        >
                            {/* SHOP NAME */}
                            <div className="text-center pb-2 mb-2" style={{ borderBottom: '1.5px dashed #ccc' }}>
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
                                    COMPROBANTE DE PAGO
                                </p>
                                <p style={{ fontSize: '11px', color: '#444444', marginTop: '2px' }}>
                                    {fecha} {hora}
                                </p>
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
                                {productos.length > 0 ? (
                                    productos.map((item: ProductoPedido, index: number) => (
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
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>Sin productos</p>
                                )}
                            </div>

                            {/* TOTAL */}
                            <div className="pt-2 mb-2" style={{ borderTop: '2px dashed #ccc' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#000000',
                                    padding: '4px 0'
                                }}>
                                    <span style={{ color: '#000000' }}>TOTAL</span>
                                    <span style={{ color: '#000000' }}>{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* PAGO Y CAMBIO */}
                            {metodoPago === 'efectivo' && montoRecibidoNum > 0 && (
                                <div className="pt-2 mb-2" style={{ borderTop: '1.5px dashed #ccc' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        padding: '3px 0',
                                        color: '#000000'
                                    }}>
                                        <span style={{ color: '#333333' }}>Efectivo</span>
                                        <span style={{ fontWeight: 600, color: '#000000' }}>{montoRecibidoNum.toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        padding: '3px 0',
                                        color: '#000000'
                                    }}>
                                        <span style={{ color: '#333333' }}>Cambio</span>
                                        <span style={{ fontWeight: 700, color: '#000000' }}>{cambio.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

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

                            {/* APROBACIÓN (TARJETA) */}
                            {metodoPago === 'tarjeta' && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    padding: '4px 0',
                                    borderBottom: '1.5px dashed #ccc',
                                    marginBottom: '8px',
                                    color: '#000000'
                                }}>
                                    <span style={{ color: '#333333' }}>N° Aprobación</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>#123456</span>
                                </div>
                            )}

                            {/* FOOTER */}
                            <div className="text-center pt-2" style={{ borderTop: '2px dashed #ccc' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#000000', letterSpacing: '1.5px' }}>
                                    ¡GRACIAS POR SU VISITA!
                                </p>
                                <p style={{ fontSize: '11px', color: '#333333', marginTop: '3px' }}>
                                    {mesa.mesero ? `Atendido por: ${mesa.mesero}` : 'Esperamos verlo pronto'}
                                </p>
                            </div>
                        </div>

                        {/* ===== MÉTODO DE PAGO ===== */}
                        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                            <button
                                onClick={() => setMetodoPago('efectivo')}
                                className={`py-2 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-xs ${metodoPago === 'efectivo'
                                    ? 'bg-[#C9A96E] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Banknote className="w-4 h-4" />
                                <span>Efectivo</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('tarjeta')}
                                className={`py-2 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-xs ${metodoPago === 'tarjeta'
                                    ? 'bg-[#C9A96E] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Tarjeta</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('yape')}
                                className={`py-2 rounded-xl font-medium transition flex flex-col items-center gap-0.5 text-xs ${metodoPago === 'yape'
                                    ? 'bg-[#C9A96E] text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>Yape/Plin</span>
                            </button>
                        </div>

                        {/* ===== EFECTIVO RECIBIDO ===== */}
                        {metodoPago === 'efectivo' && (
                            <div className="flex-shrink-0">
                                <label className="text-xs font-medium text-gray-600 block mb-1">
                                    Efectivo recibido
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                                        S/
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 text-sm text-gray-900 placeholder-gray-500"
                                        value={montoRecibido}
                                        onChange={(e) => setMontoRecibido(e.target.value)}
                                    />
                                </div>
                                {montoRecibido && montoRecibidoNum > 0 && cambio >= 0 && (
                                    <div className="flex justify-between text-sm mt-1 px-1">
                                        <span className="text-gray-500">Cambio</span>
                                        <span className="font-bold text-[#C9A96E]">
                                            S/ {cambio.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {montoRecibidoNum > 0 && cambio < 0 && (
                                    <p className="text-xs text-red-500 mt-1">
                                        El monto recibido es menor al total
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ===== BOTÓN COBRAR ===== */}
                        <button
                            onClick={handleCobrar}
                            disabled={cargando || (metodoPago === 'efectivo' && montoRecibidoNum < total)}
                            className={`w-full py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm flex-shrink-0 ${cargando || (metodoPago === 'efectivo' && montoRecibidoNum < total)
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
                                    Cobrar e Imprimir
                                </>
                            )}
                        </button>
                    </div>
                ) : (
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