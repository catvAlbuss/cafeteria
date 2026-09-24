import { router } from '@inertiajs/react';
import {
    X,
    CheckCircle,
    CreditCard,
    Banknote,
    Smartphone,
    Printer,
    KeyRound,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
    subtotal?: number | string | null;
    igv?: number | string | null;
    total: number | string;
    hora_pedido: string;
    estado: string;
}
interface ModalCobroProps {
    isOpen: boolean;
    mesa: Mesa | null;
    pedido?: Pedido[];
    onClose: () => void;
    onSuccess: () => void;
}

// ============================================================
// COMPONENTE
// ============================================================
export default function ModalCobro({
    isOpen,
    mesa,
    pedido,
    onClose,
    onSuccess,
}: ModalCobroProps) {
    const [metodoPago, setMetodoPago] = useState<string>('efectivo');
    const [montoRecibido, setMontoRecibido] = useState<string>('');
    const [authorizationPin, setAuthorizationPin] = useState('');
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);
    const [comprobanteEmitido, setComprobanteEmitido] = useState<any>(null);
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && mesa) {
            setExito(false);
            setCargando(false);
            setMetodoPago('efectivo');
            setMontoRecibido('');
            setAuthorizationPin('');
        }
    }, [isOpen, mesa?.id]);

    if (!isOpen || !mesa) {
        return null;
    }

    const pedidosArray = pedido || [];
    const toNum = (v: number | string | null | undefined) =>
        typeof v === 'number' ? v : parseFloat(v as string) || 0;
    const total = pedidosArray.reduce((sum, p) => sum + toNum(p.total), 0);
    const subtotal = pedidosArray.reduce(
        (sum, p) => sum + toNum(p.subtotal),
        0,
    );
    const igv = pedidosArray.reduce((sum, p) => sum + toNum(p.igv), 0);
    const igvCalculado =
        total > 0 && subtotal === 0 && igv === 0 ? total - total / 1.18 : igv;
    const subtotalMostrado = subtotal > 0 ? subtotal : total - igvCalculado;
    const productos = pedidosArray.flatMap((p) =>
        typeof p.productos === 'string' ? JSON.parse(p.productos) : p.productos,
    );

    const montoRecibidoNum = parseFloat(montoRecibido) || 0;
    const cambio = montoRecibidoNum - total;

    const handleCobrar = () => {
        setCargando(true);

        const pedidosACobrar = pedidosArray.filter(
            (p) => !['pagado', 'cancelado'].includes(p.estado || ''),
        );

        if (pedidosACobrar.length === 0) {
            alert('No hay pedidos disponibles para cobrar.');
            setCargando(false);

            return;
        }

        const ventaData = {
            metodo_pago: metodoPago,
            pedido_ids: pedidosACobrar.map((p) => p.id),
            authorization_pin: authorizationPin,
        };

        router.patch(`/mesas/${mesa.id}/cobrar`, ventaData, {
            onSuccess: () => {
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
                                    background: white;
                                    display: flex;
                                    justify-content: center;
                                    align-items: flex-start;
                                    min-height: 100vh;
                                    padding: 10px;
                                    margin: 0;
                                    }
                                    .ticket-print {
                                    width: 80mm;
                                    min-height: 220mm;
                                    padding: 8px 6px;
                                    background: white;
                                    border-radius: 8px;
                                    ox-shadow: none;
                                    margin: 0 auto;
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

                setCargando(false);
                setExito(true);
                setTimeout(() => {
                    onSuccess();
                }, 1200);
            },
            onError: (errors) => {
                console.log('❌ Error al registrar la venta:', errors);
                setCargando(false);
                alert(
                    'Error al registrar la venta: ' +
                        Object.values(errors).join(' '),
                );
            },
        });
    };

    const handleClose = () => {
        if (!exito) {
            onClose();
        }
    };
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const hora = now.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[95vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
                {/* ===== HEADER ===== */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-sand bg-cream px-5 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                            {mesa.numero}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-chocolate">
                                DOLCE CAFEE
                            </p>
                            <p className="text-[10px] text-cocoa-soft">
                                Mesa #{mesa.numero}
                            </p>
                        </div>
                    </div>
                    {!exito && (
                        <button
                            onClick={handleClose}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                            disabled={cargando}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {!exito ? (
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
{/* ===== TICKET ===== */}
                            <div
                                ref={ticketRef}
                                className="rounded-xl border border-black/10 bg-white p-4"
                                id="ticket-print"
                            >
                            {/* SHOP NAME - SIN IMAGEN */}
                            <div
                                className="mb-1 pb-1 text-center"
                                style={{ borderBottom: '1.5px dashed #ccc' }}
                            >
                                <p
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#000000',
                                        letterSpacing: '2px',
                                    }}
                                >
                                    DOLCE CAFE
                                </p>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#333333',
                                    }}
                                >
                                    Av. Principal 123, Lima
                                </p>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#333333',
                                    }}
                                >
                                    Telp. 11223344
                                </p>
                            </div>

                            {/* TITLE */}
                            <div
                                className="mb-1 pb-1 text-center"
                                style={{ borderBottom: '1.5px dashed #ccc' }}
                            >
                                <p
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#000000',
                                        letterSpacing: '1.5px',
                                    }}
                                >
                                    COMPROBANTE DE PAGO
                                </p>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#444444',
                                    }}
                                >
                                    {fecha} {hora}
                                </p>
                            </div>

                            {/* PRODUCTOS */}
                            <div className="mb-1">
                                <div
                                    className="mb-0.5 flex justify-between pb-0.5"
                                    style={{ borderBottom: '1.5px solid #ddd' }}
                                >
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: '#000000',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        DESCRIPCIÓN
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: '#000000',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        PRECIO
                                    </span>
                                </div>
                                {productos.length > 0 ? (
                                    productos.map(
                                        (
                                            item: ProductoPedido,
                                            index: number,
                                        ) => (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    fontSize: '13px',
                                                    padding: '1px 0',
                                                    color: '#000000',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        flex: 1,
                                                        color: '#000000',
                                                    }}
                                                >
                                                    {item.cantidad}x{' '}
                                                    {item.nombre}
                                                </span>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        minWidth: '60px',
                                                        textAlign: 'right',
                                                        color: '#000000',
                                                    }}
                                                >
                                                    {item.subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <p
                                        style={{
                                            textAlign: 'center',
                                            color: '#666',
                                            fontSize: '12px',
                                        }}
                                    >
                                        Sin productos
                                    </p>
                                )}
                            </div>
                            {/* TOTAL */}
                            <div
                                className="mb-1 pt-1"
                                style={{ borderTop: '2px dashed #ccc' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        padding: '1px 0',
                                        color: '#000000',
                                    }}
                                >
                                    <span style={{ color: '#333333' }}>
                                        Subtotal
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            color: '#000000',
                                        }}
                                    >
                                        {subtotalMostrado.toFixed(2)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        padding: '1px 0',
                                        color: '#000000',
                                    }}
                                >
                                    <span style={{ color: '#333333' }}>
                                        IGV (18%)
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            color: '#000000',
                                        }}
                                    >
                                        {igvCalculado.toFixed(2)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#000000',
                                        padding: '2px 0',
                                    }}
                                >
                                    <span style={{ color: '#000000' }}>
                                        TOTAL
                                    </span>
                                    <span style={{ color: '#000000' }}>
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* PAGO Y CAMBIO - SOLO SI ES EFECTIVO */}
                            {metodoPago === 'efectivo' &&
                                montoRecibidoNum > 0 && (
                                    <div
                                        className="mb-1 pt-1"
                                        style={{
                                            borderTop: '1.5px dashed #ccc',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '13px',
                                                padding: '1px 0',
                                                color: '#000000',
                                            }}
                                        >
                                            <span style={{ color: '#333333' }}>
                                                Efectivo
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    color: '#000000',
                                                }}
                                            >
                                                {montoRecibidoNum.toFixed(2)}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '13px',
                                                padding: '1px 0',
                                                color: '#000000',
                                            }}
                                        >
                                            <span style={{ color: '#333333' }}>
                                                Cambio
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color: '#000000',
                                                }}
                                            >
                                                {cambio.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                            {/* MÉTODO DE PAGO */}
                            <div
                                className="mb-1 pt-1"
                                style={{ borderTop: '1.5px dashed #ccc' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        padding: '1px 0',
                                        color: '#000000',
                                    }}
                                >
                                    <span style={{ color: '#333333' }}>
                                        Método de pago
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: '#000000',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {metodoPago}
                                    </span>
                                </div>
                            </div>
                            {/* FOOTER */}
                            <div
                                className="pt-1 text-center"
                                style={{ borderTop: '2px dashed #ccc' }}
                            >
                                <p
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#000000',
                                        letterSpacing: '1.5px',
                                    }}
                                >
                                    ¡GRACIAS POR SU VISITA!
                                </p>
                                <p
                                    style={{
                                        fontSize: '11px',
                                        color: '#333333',
                                    }}
                                >
                                    {mesa.mesero
                                        ? `Atendido por: ${mesa.mesero}`
                                        : 'Esperamos verlo pronto'}
                                </p>
                            </div>
                        </div>

                        {/* ===== MÉTODO DE PAGO ===== */}
                        <div className="grid flex-shrink-0 grid-cols-3 gap-2">
                            <button
                                onClick={() => setMetodoPago('efectivo')}
                                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                                    metodoPago === 'efectivo'
                                        ? 'bg-gold text-ink shadow-md'
                                        : 'bg-sand text-cocoa hover:bg-wheat'
                                }`}
                            >
                                <Banknote className="h-4 w-4" />
                                <span>Efectivo</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('tarjeta')}
                                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                                    metodoPago === 'tarjeta'
                                        ? 'bg-gold text-ink shadow-md'
                                        : 'bg-sand text-cocoa hover:bg-wheat'
                                }`}
                            >
                                <CreditCard className="h-4 w-4" />
                                <span>Tarjeta</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('yape')}
                                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                                    metodoPago === 'yape'
                                        ? 'bg-gold text-ink shadow-md'
                                        : 'bg-sand text-cocoa hover:bg-wheat'
                                }`}
                            >
                                <Smartphone className="h-4 w-4" />
                                <span>Yape/Plin</span>
                            </button>
                        </div>

                        {/* ===== EFECTIVO RECIBIDO ===== */}
                        {metodoPago === 'efectivo' && (
                            <div className="flex-shrink-0">
                                <label className="mb-1 block text-xs font-medium text-cocoa">
                                    Efectivo recibido
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-cocoa-soft">
                                        S/
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-wheat bg-cream-soft py-2 pr-4 pl-8 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={montoRecibido}
                                        onChange={(e) =>
                                            setMontoRecibido(e.target.value)
                                        }
                                    />
                                </div>
                                {montoRecibido &&
                                    montoRecibidoNum > 0 &&
                                    cambio >= 0 && (
                                        <div className="mt-1 flex justify-between px-1 text-sm">
                                            <span className="text-cocoa">
                                                Cambio
                                            </span>
                                            <span className="font-bold text-gold">
                                                S/ {cambio.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                {montoRecibidoNum > 0 && cambio < 0 && (
                                    <p className="mt-1 text-xs text-red-500">
                                        El monto recibido es menor al total
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ===== PIN ===== */}
                        <div className="flex-shrink-0">
                            <label className="mb-1 block text-xs font-medium text-cocoa">
                                PIN de autorización
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoComplete="off"
                                    placeholder="••••"
                                    className="w-full rounded-xl border border-wheat bg-cream-soft py-2 pr-4 pl-9 text-center text-sm tracking-[0.5em] text-chocolate outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={authorizationPin}
                                    onChange={(event) =>
                                        setAuthorizationPin(
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 4),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {/* ===== BOTÓN COBRAR ===== */}
                        <button
                            onClick={handleCobrar}
                            disabled={
                                cargando ||
                                authorizationPin.length !== 4 ||
                                (metodoPago === 'efectivo' &&
                                    montoRecibidoNum < total)
                            }
                            className={`flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                                cargando ||
                                (metodoPago === 'efectivo' &&
                                    montoRecibidoNum < total)
                                    ? 'cursor-not-allowed bg-wheat'
                                    : 'bg-roast text-white hover:bg-ink'
                            }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Printer className="h-4 w-4" />
                                    Cobrar e Imprimir
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-chocolate">
                            ¡Cobro exitoso!
                        </h3>
                        <p className="mt-2 text-cocoa">
                            Mesa #{mesa.numero} liberada
                        </p>
                        <div className="mt-4 rounded-xl bg-cream-soft p-4">
                            <p className="text-sm text-cocoa">Total cobrado</p>
                            <p className="text-2xl font-bold text-gold">
                                S/ {total.toFixed(2)}
                            </p>
                            <p className="mt-1 text-xs text-cocoa-soft">
                                Comprobante impreso
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                router.reload();
                            }}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 font-semibold text-ink transition hover:bg-gold-deep"
                        >
                            <CheckCircle className="h-5 w-5" />
                            Aceptar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
