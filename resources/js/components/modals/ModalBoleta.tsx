import axios from 'axios';
import {
    X,
    Receipt,
    FileText,
    Banknote,
    CreditCard,
    Smartphone,
    KeyRound,
    Search,
    Loader2,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// ============================================================
// CONFIGURACIÓN DE LA EMPRESA
// ============================================================
const EMPRESA_NOMBRE = 'DOLCE CAFFE';
const EMPRESA_WHATSAPP = '+51 949 265 128';

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
export default function ModalBoleta({
    isOpen,
    onClose,
    onSuccess,
    data,
}: ModalBoletaProps) {
    // Estado del tipo de comprobante
    const [tipoComprobante, setTipoComprobante] =
        useState<TipoComprobante | null>(null);

    // Estados del formulario
    const [metodoPago, setMetodoPago] = useState<string>(
        () => data?.metodoPago || 'efectivo',
    );
    const [authorizationPin, setAuthorizationPin] = useState('');
    const [documento, setDocumento] = useState('');
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [emitiendo, setEmitiendo] = useState(false);

    // Estados para la pantalla post-emisión (enviar por WhatsApp)
    const [comprobanteEmitido, setComprobanteEmitido] = useState<{
        pdfUrl: string;
        facturaNumero: string | null;
        clienteNombre: string;
        total: number;
        tipoTexto: string;
    } | null>(null);
    const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
    const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);

    // Confirmación al cerrar el modal
    const [confirmandoSalida, setConfirmandoSalida] = useState(false);
    const [cancelandoVenta, setCancelandoVenta] = useState(false);

    // Reset cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setTipoComprobante(null);
            setMetodoPago(data?.metodoPago || 'efectivo');
            setAuthorizationPin('');
            setDocumento('');
            setNombre('');
            setDireccion('');
            setBuscando(false);
            setEmitiendo(false);
            setConfirmandoSalida(false);
            setCancelandoVenta(false);
            setComprobanteEmitido(null);
            setTelefonoWhatsapp('');
            setEnviandoWhatsapp(false);
        }
    }, [isOpen, data?.metodoPago]);

    if (!isOpen || !data) {
        return null;
    }

    const {
        pedidoIds,
        mesaId,
        cliente,
        mesa,
        tipo,
        productos,
        subtotal,
        igv,
        total,
    } = data;

    const tipoTexto =
        tipo === 'salon' ? 'Salón' : tipo === 'llevar' ? 'Llevar' : 'Delivery';

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
            const { data: response } = await axios.get(
                `/facturacion/buscar-ruc/${documento}`,
            );
            setNombre(response.razonSocial || response.nombre || '');
            setDireccion(response.direccion || '');
            toast.success('Datos encontrados');
        } catch {
            toast.error('No se encontraron datos para ese RUC');
        } finally {
            setBuscando(false);
        }
    };

    // ============================================================
    // AUTORELLENAR NOMBRE POR DNI (cliente registrado en el sistema)
    // ============================================================
    const buscarClientePorDni = async (dni: string) => {
        if (dni.length !== 8) {
            return;
        }

        try {
            const { data } = await axios.get('/clientes/buscar', {
                params: { tipo_documento: 'dni', documento: dni },
            });

            if (data?.nombre) {
                setNombre((prev) => (prev.trim() ? prev : data.nombre));
            }
        } catch {
            //
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
        }

        setEmitiendo(true);

        try {
            const esFactura = tipoComprobante === 'factura';
            const esBoletaConDni =
                tipoComprobante === 'boleta' && documento.length === 8;
            const nombreEscrito = nombre.trim();

            const payload: any = {
                pedido_ids: pedidoIds,
                tipo_documento: esFactura ? '01' : '03',
                documento: esFactura
                    ? documento
                    : esBoletaConDni
                      ? documento
                      : '00000000',
                nombre:
                    esFactura || esBoletaConDni
                        ? nombreEscrito
                        : 'CLIENTES VARIOS',
                direccion: esFactura ? direccion : '-',
                metodo_pago: metodoPago,
                authorization_pin: authorizationPin,
            };

            // Si es cobro de mesa, agregar mesa_id
            if (mesaId) {
                payload.mesa_id = mesaId;
            }

            const { data: response } = await axios.post(
                '/pedidos/emitir-comprobante',
                payload,
            );

            if (response.success) {
                toast.success(
                    tipoComprobante === 'factura'
                        ? 'Factura emitida correctamente'
                        : 'Boleta emitida correctamente',
                );

                // En vez de cerrar, mostramos la pantalla de envío
                setComprobanteEmitido({
                    pdfUrl: response.pdf_url ?? '',
                    facturaNumero: response.file ?? null,
                    clienteNombre:
                        esFactura || esBoletaConDni
                            ? nombreEscrito || 'Cliente'
                            : 'Cliente',
                    total: total,
                    tipoTexto:
                        tipoComprobante === 'factura' ? 'Factura' : 'Boleta',
                });
            } else {
                // Mostrar el error de SUNAT con más detalle
                toast.error('SUNAT rechazó el comprobante', {
                    description: response.error || 'Error desconocido',
                    duration: 10000,
                    style: {
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: '1px solid #FCA5A5',
                    },
                });
            }
        } catch (error: any) {
            const errorMsg =
                error.response?.data?.error ||
                'Error al conectar con el servidor';
            toast.error(errorMsg);
        } finally {
            setEmitiendo(false);
        }
    };

    // ============================================================
    // CANCELAR VENTA (restaura stock en el backend)
    // ============================================================
    const cancelarVenta = async () => {
        if (!pedidoIds || pedidoIds.length === 0) {
            setConfirmandoSalida(false);
            onClose();
            onSuccess();

            return;
        }

        setCancelandoVenta(true);

        try {
            const { data: response } = await axios.post(
                `/caja/${pedidoIds[0]}/cancelar`,
                {},
            );

            if (response.success) {
                toast.success(
                    response.message ||
                        'Venta cancelada; el stock fue restaurado',
                );
                setConfirmandoSalida(false);
                onClose();
                onSuccess();
            } else {
                toast.error(response.error || 'No se pudo cancelar la venta');
                setConfirmandoSalida(false);
            }
        } catch (error: any) {
            const errorMsg =
                error.response?.data?.error || 'Error al cancelar la venta';
            toast.error(errorMsg);
            setConfirmandoSalida(false);
        } finally {
            setCancelandoVenta(false);
        }
    };

    // ============================================================
    // ENVIAR POR WHATSAPP
    // ============================================================
    const enviarPorWhatsApp = () => {
        if (!comprobanteEmitido) {
            return;
        }

        if (!comprobanteEmitido.pdfUrl) {
            toast.error('No hay PDF disponible para enviar');

            return;
        }

        const soloDigitos = telefonoWhatsapp.replace(/\D/g, '');

        if (soloDigitos.length < 9) {
            toast.error('Ingresa un número de WhatsApp válido');

            return;
        }

        const numeroConPais = soloDigitos.startsWith('51')
            ? soloDigitos
            : `51${soloDigitos}`;

        // URL del PDF aislada en su propia línea
        const mensaje = [
            `Hola ${comprobanteEmitido.clienteNombre},`,
            '',
            `Aquí tienes tu ${comprobanteEmitido.tipoTexto} electrónica.`,
            'Haz clic aquí para descargarla:',
            comprobanteEmitido.pdfUrl,
            '',
            `Total: S/ ${comprobanteEmitido.total.toFixed(2)}`,
            '',
            '¡Gracias por tu preferencia!',
            '',
            EMPRESA_NOMBRE,
            `WhatsApp: ${EMPRESA_WHATSAPP}`,
        ].join('\n');

        // Forzar %0A explícito para que WhatsApp respete los saltos
        const mensajeCodificado = encodeURIComponent(mensaje).replace(
            /%0A/g,
            '%0A',
        );

        const url = `https://wa.me/${numeroConPais}?text=${mensajeCodificado}`;

        setEnviandoWhatsapp(true);
        window.open(url, '_blank');

        setTimeout(() => setEnviandoWhatsapp(false), 1000);
    };

    // ============================================================
    // CERRAR PANTALLA DE ENVÍO (finaliza el flujo)
    // ============================================================
    const finalizarEnvio = () => {
        setComprobanteEmitido(null);
        onClose();
        onSuccess();
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
                {/* ===== HEADER ===== */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-sand bg-cream px-5 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold">
                            {tipoComprobante === 'factura' ? (
                                <FileText className="h-4 w-4 text-white" />
                            ) : (
                                <Receipt className="h-4 w-4 text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-chocolate">
                                {EMPRESA_NOMBRE}
                            </p>
                            <p className="text-[10px] text-cocoa-soft">
                                {tipoComprobante === 'factura'
                                    ? 'Factura'
                                    : tipoComprobante === 'boleta'
                                      ? 'Boleta'
                                      : 'Cobrar'}{' '}
                                · Mesa #{mesa}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            mesaId ? onClose() : setConfirmandoSalida(true)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ===== CONTENIDO ===== */}
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {/* ===== PASO 3: COMPROBANTE EMITIDO → ENVIAR ===== */}
                    {comprobanteEmitido && (
                        <div className="space-y-4">
                            {/* Éxito */}
                            <div className="flex flex-col items-center rounded-xl bg-green-50 p-4 text-center">
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <p className="text-sm font-bold text-green-800">
                                    ¡{comprobanteEmitido.tipoTexto} emitida!
                                </p>
                                <p className="mt-1 text-xs text-green-700">
                                    {comprobanteEmitido.facturaNumero}
                                </p>
                                <p className="mt-2 text-lg font-bold text-gold">
                                    S/ {comprobanteEmitido.total.toFixed(2)}
                                </p>
                            </div>

                            {/* Input WhatsApp */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-cocoa">
                                    Número de WhatsApp del cliente{' '}
                                    <span className="text-cocoa-soft">
                                        (con código de país)
                                    </span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-sand px-3 py-2 text-sm font-medium text-chocolate">
                                        🇵🇪 +51
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="987654321"
                                        value={telefonoWhatsapp}
                                        onChange={(e) =>
                                            setTelefonoWhatsapp(
                                                e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 9),
                                            )
                                        }
                                        className="flex-1 rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                    />
                                </div>
                                <p className="mt-1 text-[10px] text-cocoa-soft">
                                    Se abrirá WhatsApp Web con el PDF adjunto
                                    como link.
                                </p>
                            </div>

                            {/* Botón enviar */}
                            <button
                                type="button"
                                onClick={enviarPorWhatsApp}
                                disabled={
                                    enviandoWhatsapp ||
                                    telefonoWhatsapp.replace(/\D/g, '').length <
                                        9
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Smartphone className="h-4 w-4" />
                                {enviandoWhatsapp
                                    ? 'Abriendo WhatsApp...'
                                    : 'Enviar por WhatsApp'}
                            </button>

                            {/* Botones secundarios */}
                            <div className="flex gap-2">
                                <a
                                    href={comprobanteEmitido.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sand py-2.5 text-xs font-medium text-chocolate transition hover:bg-wheat"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Ver PDF
                                </a>
                                <button
                                    type="button"
                                    onClick={finalizarEnvio}
                                    className="flex-1 rounded-xl bg-roast py-2.5 text-xs font-medium text-white transition hover:bg-ink"
                                >
                                    Finalizar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== PASO 1: SELECCIÓN DE TIPO ===== */}
                    {!comprobanteEmitido && !tipoComprobante && (
                        <div className="space-y-3">
                            <p className="mb-4 text-center text-sm font-medium text-cocoa">
                                ¿Qué comprobante desea emitir?
                            </p>

                            {/* BOTÓN BOLETA */}
                            <button
                                onClick={() => setTipoComprobante('boleta')}
                                className="flex w-full items-center gap-4 rounded-xl border-2 border-wheat p-4 transition-all hover:border-gold hover:bg-gold/5 active:scale-[0.98]"
                            >
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10">
                                    <Receipt className="h-6 w-6 text-gold" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-chocolate">
                                        BOLETA
                                    </p>
                                    <p className="text-xs text-cocoa">
                                        Para personas naturales
                                    </p>
                                </div>
                            </button>

                            {/* BOTÓN FACTURA */}
                            <button
                                onClick={() => setTipoComprobante('factura')}
                                className="flex w-full items-center gap-4 rounded-xl border-2 border-wheat p-4 transition-all hover:border-gold hover:bg-gold/5 active:scale-[0.98]"
                            >
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gold/10">
                                    <FileText className="h-6 w-6 text-gold" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-chocolate">
                                        FACTURA
                                    </p>
                                    <p className="text-xs text-cocoa">
                                        Para empresas con RUC
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ===== PASO 2: FORMULARIO ===== */}
                    {!comprobanteEmitido && tipoComprobante && (
                        <>
                            {/* RESUMEN DEL PEDIDO */}
                            <div className="rounded-xl bg-cream-soft p-4">
                                <p className="mb-2 text-xs font-bold text-cocoa uppercase">
                                    Resumen del pedido
                                </p>
                                <div className="space-y-1">
                                    {productos.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between text-sm"
                                        >
                                            <span className="text-chocolate">
                                                {item.cantidad}x {item.nombre}
                                            </span>
                                            <span className="font-medium">
                                                S/ {item.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 space-y-1 border-t border-sand pt-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-cocoa">
                                            Subtotal
                                        </span>
                                        <span className="font-medium">
                                            S/ {subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-cocoa">
                                            IGV (18%)
                                        </span>
                                        <span className="font-medium">
                                            S/ {igv.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-base font-bold">
                                    <span>TOTAL</span>
                                    <span className="text-gold">
                                        S/ {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* DNI OPCIONAL (solo boleta) */}
                            {tipoComprobante === 'boleta' && (
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-cocoa">
                                        DNI del cliente{' '}
                                        <span className="text-cocoa-soft">
                                            (opcional)
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={8}
                                            placeholder="Ej: 12345678"
                                            value={documento}
                                            onChange={(e) => {
                                                const valor = e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 8);
                                                setDocumento(valor);

                                                if (valor.length === 8) {
                                                    buscarClientePorDni(valor);
                                                }
                                            }}
                                            className="flex-1 rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                        />
                                    </div>
                                    {documento.length > 0 &&
                                        documento.length < 8 && (
                                            <p className="mt-1 text-[10px] text-red-500">
                                                El DNI debe tener 8 dígitos (
                                                {documento.length}/8)
                                            </p>
                                        )}
                                    {documento.length === 0 && (
                                        <p className="mt-1 text-[10px] text-cocoa-soft">
                                            Si no lo ingresa, se emitirá como
                                            CLIENTES VARIOS
                                        </p>
                                    )}

                                    {/* NOMBRE DEL CLIENTE (opcional, solo con DNI) */}
                                    {documento.length === 8 && (
                                        <div className="mt-3">
                                            <label className="mb-1 block text-xs font-medium text-cocoa">
                                                Nombre del cliente{' '}
                                                <span className="text-cocoa-soft">
                                                    (opcional)
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Juan Pérez"
                                                value={nombre}
                                                onChange={(e) =>
                                                    setNombre(e.target.value)
                                                }
                                                className="w-full rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                            />
                                            <p className="mt-1 text-[10px] text-cocoa-soft">
                                                El cliente se registra
                                                automáticamente por su DNI; si
                                                no pones nombre, quedará como
                                                «Cliente {documento}».
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DATOS DE LA FACTURA (solo factura) */}
                            {tipoComprobante === 'factura' && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-cocoa uppercase">
                                        Datos de la factura
                                    </p>

                                    {/* RUC */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-cocoa">
                                            RUC{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={11}
                                                placeholder="Ej: 20100070970"
                                                value={documento}
                                                onChange={(e) => {
                                                    const valor = e.target.value
                                                        .replace(/\D/g, '')
                                                        .slice(0, 11);
                                                    setDocumento(valor);
                                                }}
                                                className="flex-1 rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                            />
                                            <button
                                                type="button"
                                                onClick={buscarDocumento}
                                                disabled={
                                                    buscando ||
                                                    documento.length !== 11
                                                }
                                                className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-ink transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {buscando ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Search className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {documento.length > 0 &&
                                            documento.length !== 11 && (
                                                <p className="mt-1 text-[10px] text-red-500">
                                                    El RUC debe tener 11 dígitos
                                                    ({documento.length}/11)
                                                </p>
                                            )}
                                    </div>

                                    {/* RAZÓN SOCIAL */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-cocoa">
                                            Razón Social{' '}
                                            <span className="text-cocoa-soft">
                                                (opcional)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: BANCO INTERNACIONAL DEL PERU S.A.A."
                                            value={nombre}
                                            onChange={(e) =>
                                                setNombre(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                        />
                                        <p className="mt-1 text-[10px] text-cocoa-soft">
                                            Si no la pones, quedará como
                                            «Cliente {documento}».
                                        </p>
                                    </div>

                                    {/* DIRECCIÓN */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-cocoa">
                                            Dirección{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: AV. CARLOS VILLARAN 195, LIMA"
                                            value={direccion}
                                            onChange={(e) =>
                                                setDireccion(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-wheat bg-card px-3 py-2 text-sm text-chocolate outline-none placeholder:text-cocoa-soft focus:ring-2 focus:ring-gold"
                                        />
                                    </div>

                                    {/* NOTA */}
                                    <p className="text-[10px] text-cocoa">
                                        <span className="text-red-500">*</span>{' '}
                                        Todos los campos son obligatorios
                                    </p>
                                </div>
                            )}

                            {/* MÉTODO DE PAGO */}
                            <div>
                                <p className="mb-2 text-xs font-bold text-cocoa uppercase">
                                    Método de pago
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMetodoPago('efectivo')
                                        }
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${
                                            metodoPago === 'efectivo'
                                                ? 'bg-gold text-ink shadow-md'
                                                : 'bg-sand text-cocoa hover:bg-wheat'
                                        }`}
                                    >
                                        <Banknote className="h-4 w-4" />
                                        <span>Efectivo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('tarjeta')}
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${
                                            metodoPago === 'tarjeta'
                                                ? 'bg-gold text-ink shadow-md'
                                                : 'bg-sand text-cocoa hover:bg-wheat'
                                        }`}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        <span>Tarjeta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('yape')}
                                        className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition ${
                                            metodoPago === 'yape'
                                                ? 'bg-gold text-ink shadow-md'
                                                : 'bg-sand text-cocoa hover:bg-wheat'
                                        }`}
                                    >
                                        <Smartphone className="h-4 w-4" />
                                        <span>Yape/Plin</span>
                                    </button>
                                </div>
                            </div>

                            {/* PIN */}
                            <div>
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
                                        onChange={(e) =>
                                            setAuthorizationPin(
                                                e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 4),
                                            )
                                        }
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
                                    (tipoComprobante === 'factura' &&
                                        (documento.length !== 11 ||
                                            !nombre ||
                                            !direccion))
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-roast py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {emitiendo ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Emitiendo...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        {tipoComprobante === 'factura'
                                            ? 'Emitir Factura'
                                            : 'Emitir Boleta'}
                                    </>
                                )}
                            </button>

                            {/* VOLVER */}
                            <button
                                type="button"
                                onClick={() => setTipoComprobante(null)}
                                className="w-full py-2 text-xs text-cocoa transition hover:text-chocolate"
                            >
                                ← Volver a seleccionar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ===== CONFIRMACIÓN DE SALIDA ===== */}
            {confirmandoSalida && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                            <p className="text-base font-bold text-chocolate">
                                ¿Salir de la emisión?
                            </p>
                            <p className="mt-2 text-sm text-cocoa">
                                La venta ya fue registrada y el stock fue
                                descontado. Si sales sin emitir el comprobante,
                                se cancelará la venta y se restaurará el stock.
                            </p>

                            <div className="mt-5 w-full space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmandoSalida(false)}
                                    disabled={cancelandoVenta}
                                    className="w-full rounded-xl bg-gold py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-deep disabled:opacity-50"
                                >
                                    Continuar con la venta
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelarVenta}
                                    disabled={cancelandoVenta}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {cancelandoVenta ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cancelando...
                                        </>
                                    ) : (
                                        'Salir y cancelar la venta'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
