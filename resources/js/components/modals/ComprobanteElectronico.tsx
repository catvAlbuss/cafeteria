import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, Loader2, CheckCircle } from 'lucide-react';

interface ComprobanteElectronicoProps {
    pedidoIds: number[];
    total: number;
    mesaId?: number;
    metodoPago?: string;
    authorizationPin?: string;
    onComprobanteEmitido: (respuesta: any) => void;
    onError?: (error: string) => void;
}

export default function ComprobanteElectronico({
    pedidoIds,
    total,
    mesaId,
    metodoPago,
    authorizationPin,
    onComprobanteEmitido,
    onError,
}: ComprobanteElectronicoProps) {
    const [deseaFactura, setDeseaFactura] = useState(false);
    const [documento, setDocumento] = useState('');
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [emitiendo, setEmitiendo] = useState(false);

    const buscarDocumento = async () => {
        if (!documento || documento.length !== 11) return;

        setBuscando(true);
        try {
            const { data } = await axios.get(`/facturacion/buscar-ruc/${documento}`);
            setNombre(data.razonSocial || data.nombre || '');
            setDireccion(data.direccion || '');
            toast.success('Datos encontrados');
        } catch (error) {
            toast.error('No se encontraron datos para ese RUC');
        } finally {
            setBuscando(false);
        }
    };

    const emitirComprobante = async () => {
        // Validaciones
        if (deseaFactura) {
            if (documento.length !== 11) {
                toast.error('Ingresa un RUC válido de 11 dígitos');
                return;
            }
            if (!nombre) {
                toast.error('Ingresa la razón social');
                return;
            }
        }

        if (mesaId && (!authorizationPin || authorizationPin.length !== 4)) {
            toast.error('Ingresa el PIN de 4 dígitos para confirmar el pago');
            return;
        }

        setEmitiendo(true);
        try {
            // Si es factura, usar los datos del formulario. Si es boleta, usar datos genéricos.
            const payload: any = {
                pedido_ids: pedidoIds,
                tipo_documento: deseaFactura ? '01' : '03',
                documento: deseaFactura ? documento : '00000000',
                nombre: deseaFactura ? nombre : 'CLIENTES VARIOS',
                direccion: deseaFactura ? direccion : '-',
            };

            // Si es cobro de mesa, agregar los datos de cobro
            if (mesaId) {
                payload.mesa_id = mesaId;
                payload.metodo_pago = metodoPago;
                payload.authorization_pin = authorizationPin;
            }

            const { data } = await axios.post('/pedidos/emitir-comprobante', payload);

            if (data.success) {
                toast.success(deseaFactura ? 'Factura emitida correctamente' : 'Boleta emitida correctamente');
                onComprobanteEmitido(data);
            } else {
                toast.error(data.error || 'Error al emitir comprobante');
                onError?.(data.error);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al conectar con el servidor';
            toast.error(errorMsg);
            onError?.(errorMsg);
        } finally {
            setEmitiendo(false);
        }
    };

    return (
        <div className="space-y-3 border-t border-gray-200 pt-3">
            {/* Checkbox: ¿Desea factura? */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={deseaFactura}
                    onChange={(e) => {
                        setDeseaFactura(e.target.checked);
                        setDocumento('');
                        setNombre('');
                        setDireccion('');
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#C9A96E] focus:ring-[#C9A96E]"
                />
                <span className="text-sm font-medium text-gray-700">
                    ¿Desea factura?
                </span>
            </label>

            {/* Campos solo si es factura */}
            {deseaFactura && (
                <div className="space-y-3 pl-6">
                    {/* Campo RUC */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            RUC
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={11}
                                placeholder="20123456789"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C9A96E]"
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
                    </div>

                    {/* Campo Razón Social */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Razón Social
                        </label>
                        <input
                            type="text"
                            placeholder="Razón social del cliente"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C9A96E]"
                        />
                    </div>

                    {/* Campo Dirección */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            placeholder="Dirección fiscal"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C9A96E]"
                        />
                    </div>
                </div>
            )}

            {/* Botón Emitir */}
            <button
                type="button"
                onClick={emitirComprobante}
                disabled={emitiendo || (deseaFactura && (!nombre || documento.length !== 11))}
                className="w-full py-2.5 rounded-lg bg-[#2D1B1A] text-white text-sm font-semibold hover:bg-[#1A0F0E] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
                {emitiendo ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Emitiendo...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        {deseaFactura ? 'Emitir Factura' : 'Emitir Boleta'}
                    </>
                )}
            </button>
        </div>
    );
}