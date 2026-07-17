import { Head, usePage, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import ModalCobro from '@/components/modals/ModalCobro';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import { swalError, swalSuccess, errorsToText } from '@/lib/swal';

import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    Armchair,
    Search,
    Plus,
    User,
    X,
    ClipboardList,
    Users,
    Utensils,
    Receipt,
    Package,
    ChefHat,
    CircleCheck,
    CircleX,
    ShoppingCart,
    Calendar,
    AlertCircle,
    Eye
} from 'lucide-react';
// ============================================================
// COMPONENTE MODAL DE PIN (identificación rápida del mesero)
// ============================================================

interface ModalPinProps {
    isOpen: boolean;
    mesa: Mesa | null;
    onClose: () => void;
    onConfirm: (userId: number) => void;
}

function ModalPin({ isOpen, mesa, onClose, onConfirm }: ModalPinProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [verificando, setVerificando] = useState(false);

    if (!isOpen || !mesa) return null;

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    const agregarDigito = (digito: string) => {
        if (pin.length >= 4) return;
        setError('');
        setPin(prev => prev + digito);
    };

    const borrarDigito = () => setPin(prev => prev.slice(0, -1));

    const confirmar = async () => {
        if (pin.length !== 4) {
            setError('Ingresa los 4 dígitos de tu PIN');
            return;
        }

        setVerificando(true);
        setError('');

        try {
            const { data } = await axios.post('/pin/verificar', { pin });
            setPin('');
            onClose();
            await swalSuccess(`¡Hola, ${data.user.name}!`, 'PIN verificado correctamente');
            onConfirm(data.user.id);
        } catch {
            setPin('');
            swalError('PIN incorrecto', 'Verifica los 4 dígitos e intenta nuevamente');
        } finally {
            setVerificando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#C9A96E] rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Tomar Pedido</h3>
                                <p className="text-gray-300 text-[10px]">Mesa #{mesa.numero} · Ingresa tu PIN</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex justify-center gap-3 mb-4">
                        {[0, 1, 2, 3].map((i) => (
                            <span
                                key={i}
                                className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-[#C9A96E] border-[#C9A96E]' : 'border-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-center text-xs text-red-500 mb-3 flex items-center justify-center gap-1">
                            <span>⚠</span> {error}
                        </p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => agregarDigito(n)}
                                className="py-3 rounded-xl bg-gray-50 hover:bg-[#C9A96E]/10 border border-gray-200 text-lg font-semibold text-[#2D1B1A] transition active:scale-95"
                            >
                                {n}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={borrarDigito}
                            className="py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-500 transition active:scale-95"
                        >
                            Borrar
                        </button>
                        <button
                            type="button"
                            onClick={() => agregarDigito('0')}
                            className="py-3 rounded-xl bg-gray-50 hover:bg-[#C9A96E]/10 border border-gray-200 text-lg font-semibold text-[#2D1B1A] transition active:scale-95"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={verificando}
                            className="py-3 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white text-sm font-semibold transition active:scale-95 disabled:opacity-50"
                        >
                            {verificando ? '...' : 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE TARJETA DE PEDIDO (MODAL FLOTANTE)
// ============================================================

interface TarjetaPedidoProps {
    pedido: any;
    mesaNumero: string;
    mesero: string;
    onClose: () => void;
}

function TarjetaPedido({ pedido, mesaNumero, mesero, onClose }: TarjetaPedidoProps) {
    const productos = typeof pedido.productos === 'string'
        ? JSON.parse(pedido.productos)
        : pedido.productos;

    const total = typeof pedido.total === 'number'
        ? pedido.total
        : parseFloat(pedido.total) || 0;

    const fecha = new Date(pedido.created_at).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C9A96E] rounded-full flex items-center justify-center">
                            <span className="text-lg">📋</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">Detalle del Pedido</h3>
                            <p className="text-gray-300 text-xs">Mesa #{mesaNumero} · {fecha}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {/* Mesero */}
                    <div className="flex items-center gap-2 bg-[#FBF7F0] rounded-lg px-3 py-2 mb-4">
                        <User className="w-4 h-4 text-[#C9A96E]" />
                        <span className="text-sm text-[#2D1B1A]">
                            <span className="font-medium">Mesero:</span> {mesero || 'No asignado'}
                        </span>
                    </div>

                    {/* Productos */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase text-[#8D6B53] tracking-wider">Productos</p>
                        <div className="border-t border-[#8D6B53]/20 pt-2">
                            {productos && productos.length > 0 ? (
                                productos.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between py-2 border-b border-[#8D6B53]/10 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-[#2D1B1A]">
                                                {item.cantidad}x {item.nombre}
                                            </p>
                                            <p className="text-xs text-[#8D6B53]">S/ {item.precio.toFixed(2)} c/u</p>
                                        </div>
                                        <p className="text-sm font-bold text-[#C9A96E]">S/ {item.subtotal.toFixed(2)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">Sin productos en este pedido</p>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-[#C9A96E]/30">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-[#2D1B1A] uppercase">Total</span>
                            <span className="text-xl font-bold text-[#C9A96E]">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Estado */}
                    {pedido.estado && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${pedido.estado === 'entregado' ? 'bg-green-100 text-green-700' :
                                pedido.estado === 'cocina' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {pedido.estado === 'cocina' ? '👨‍🍳 En cocina' :
                                    pedido.estado === 'entregado' ? '✅ Entregado' :
                                        pedido.estado || 'Pendiente'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={() => {
                            window.location.href = `/ventas?mesa=${mesaNumero}`;
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-medium text-sm transition"
                    >
                        ✏️ Editar pedido
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

interface Mesa {
    id: number;
    numero: string;
    capacidad: number;
    sillas: number;
    estado: 'libre' | 'pendiente' | 'ocupada' | 'reserva' | 'listo_cobrar';
    cliente?: string | null;
    personas?: number | null;
    mesero?: string | null;
    pedido_listo?: boolean;
}

const toArray = <T,>(value: T[] | { data?: T[] } | Record<string, T> | null | undefined): T[] => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray((value as { data?: T[] }).data)) return (value as { data: T[] }).data;
    if (value && typeof value === 'object') return Object.values(value as Record<string, T>);
    return [];
};


interface FlashProps {
    success?: string;
    error?: string;
    aviso_capacidad?: {
        mesero_origen_id: number;
        mesa_destino_id: number;
        mensaje: string;
    };
}


// -----------------------------------------------------------------------
// Config visual por estado (colores + etiqueta)
// -----------------------------------------------------------------------
const getEstadoConfig = (estado: string) => {
    switch (estado) {
        case 'libre': return { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600', chip: 'bg-green-400', label: 'Libre' };
        case 'pendiente': return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-600', chip: 'bg-yellow-400', label: 'Pendiente' };
        case 'ocupada': return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', chip: 'bg-orange-400', label: 'Ocupada' };
        case 'reserva': return { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600', chip: 'bg-blue-400', label: 'Reserva' };
        case 'listo_cobrar': return { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600', chip: 'bg-purple-400', label: 'Cobrar' };
        default: return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', chip: 'bg-gray-400', label: 'Estado' };
    }
};

// -----------------------------------------------------------------------
// Silla arrastrable. id único: chair-{mesaId}-{index}
// -----------------------------------------------------------------------
function SillaDraggable({ mesaId, index, colorClass, disabled }: { mesaId: number; index: number; colorClass: string; disabled: boolean }) {
    const id = `chair-${mesaId}-${index}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data: { mesaOrigenId: mesaId },
        disabled,
    });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
        : undefined;

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            disabled={disabled}
            title={disabled ? 'Solo se pueden mover sillas entre mesas libres' : 'Arrastra para mover esta silla a otra mesa'}
            className={`touch-none p-1 rounded-md transition
                ${isDragging ? 'opacity-40 scale-110' : 'opacity-100'}
                ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-110'}
            `}
        >
            <Armchair className={`w-5 h-5 sm:w-4 sm:h-4 ${colorClass}`} />
        </button>
    );
}

// -----------------------------------------------------------------------
// Layout de sillas alrededor de la mesa (plano tipo "vista de arriba")
// -----------------------------------------------------------------------
function PlanoMesa({ mesa, colorClass, disabled }: { mesa: Mesa; colorClass: string; disabled: boolean }) {
    const total = Math.min(mesa.sillas, 8); // tope visual razonable
    const arriba = Math.ceil(total / 2);
    const abajo = total - arriba;

    return (
        <div className="flex min-h-[104px] flex-col items-center justify-center gap-1">
            <div className="flex gap-1 justify-center flex-wrap">
                {Array.from({ length: arriba }).map((_, i) => (
                    <SillaDraggable key={i} mesaId={mesa.id} index={i} colorClass={colorClass} disabled={disabled} />
                ))}
            </div>
            <div className={`flex h-12 w-16 items-center justify-center rounded-xl border-2 ${getEstadoConfig(mesa.estado).border} ${getEstadoConfig(mesa.estado).bg} shadow-inner`}>
                <span className={`text-lg font-extrabold ${getEstadoConfig(mesa.estado).text}`}>{mesa.capacidad}</span>
            </div>
            <div className="flex gap-1 justify-center flex-wrap">
                {Array.from({ length: abajo }).map((_, i) => (
                    <SillaDraggable key={arriba + i} mesaId={mesa.id} index={arriba + i} colorClass={colorClass} disabled={disabled} />
                ))}
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------
// Tarjeta de mesa (también es zona "droppable" para recibir sillas)
// -----------------------------------------------------------------------
function MesaCard({ mesa, onCambiarEstado, onTomarPedido, onAbrirModalCobro, onVerPedido, pedidos }: {
    mesa: Mesa;
    onCambiarEstado: (id: number, estado: string) => void;
    onTomarPedido: (mesa: Mesa) => void;
    onAbrirModalCobro: (mesa: Mesa) => void;
    onVerPedido?: (mesa: Mesa) => void;
    pedidos: any[];
}) {
    const config = getEstadoConfig(mesa.estado);
    const { setNodeRef, isOver } = useDroppable({ id: `mesa-${mesa.id}`, data: { mesaId: mesa.id } });
    const colorSilla =
        mesa.estado === 'ocupada' ? 'text-orange-500' :
            mesa.estado === 'pendiente' ? 'text-yellow-500' :
                mesa.estado === 'reserva' ? 'text-blue-500' :
                    mesa.estado === 'listo_cobrar' ? 'text-purple-500' :
                        'text-green-500';

    const dragDisabled = mesa.estado !== 'libre';

    const renderPrimaryAction = () => {
        if (mesa.estado === 'listo_cobrar') {
            return (
                <button
                    onClick={() => onAbrirModalCobro(mesa)}
                    className="mt-2 flex w-full animate-pulse items-center justify-center rounded-lg bg-purple-600 py-2.5 text-xs font-extrabold text-white transition hover:bg-purple-700"
                >
                    Cobrar
                </button>
            );
        }

        if (mesa.estado === 'ocupada') {
            return (
                <button
                    onClick={() => onVerPedido?.(mesa)}
                    className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#C9A96E] py-2.5 text-xs font-extrabold text-white transition hover:bg-[#B8975D] active:scale-95"
                >
                    Ver pedido
                </button>
            );
        }

        return (
            <button
                onClick={() => onTomarPedido(mesa)}
                className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#C9A96E] py-2.5 text-xs font-extrabold text-white transition hover:bg-[#B8975D] active:scale-95"
            >
                Tomar pedido
            </button>
        );
    };

    const estadoActions = [
        { value: 'libre', label: 'Libre', icon: CircleCheck, activeClass: 'bg-green-500 text-white border-green-500', idleClass: 'bg-white/90 text-green-600 border-green-200 hover:bg-green-50' },
        { value: 'pendiente', label: 'Espera', icon: AlertCircle, activeClass: 'bg-yellow-500 text-white border-yellow-500', idleClass: 'bg-white/90 text-yellow-600 border-yellow-200 hover:bg-yellow-50' },
        { value: 'ocupada', label: 'Ocupada', icon: Users, activeClass: 'bg-orange-500 text-white border-orange-500', idleClass: 'bg-white/90 text-orange-600 border-orange-200 hover:bg-orange-50' },
        { value: 'reserva', label: 'Reserva', icon: Calendar, activeClass: 'bg-blue-500 text-white border-blue-500', idleClass: 'bg-white/90 text-blue-600 border-blue-200 hover:bg-blue-50' },
        { value: 'listo_cobrar', label: 'Cobrar', icon: Receipt, activeClass: 'bg-purple-500 text-white border-purple-500', idleClass: 'bg-white/90 text-purple-600 border-purple-200 hover:bg-purple-50' },
    ];

    return (
        <div
            ref={setNodeRef}
            className={`group relative min-h-[236px] rounded-xl border-2 ${config.border} ${config.bg} p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${isOver ? 'scale-[1.02] ring-4 ring-[#C9A96E]' : ''}`}
        >
            {mesa.pedido_listo && (
                <div className="absolute -right-2 -top-2 z-10 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold text-[#2D1B1A] shadow-lg">
                    Listo
                </div>
            )}

            <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`min-w-0 truncate rounded-full border bg-white/90 px-2 py-1 text-[11px] font-extrabold text-gray-800 ${config.border}`}>
                    Mesa #{mesa.numero}
                </span>
                <span className={`h-3 w-3 shrink-0 rounded-full ${config.chip}`} />
            </div>

            <PlanoMesa mesa={mesa} colorClass={colorSilla} disabled={dragDisabled} />

            <div className="mt-2 text-center">
                <p className={`text-xs font-extrabold uppercase tracking-wide ${config.text}`}>{config.label}</p>
                {mesa.estado === 'ocupada' && mesa.mesero && (
                    <p className="mt-0.5 flex items-center justify-center gap-1 truncate text-[11px] font-semibold text-[#5A3D2B]">
                        <User className="h-3 w-3" /> {mesa.mesero}
                    </p>
                )}
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
                {estadoActions.map(({ value, label, icon: Icon, activeClass, idleClass }) => {
                    const isActive = mesa.estado === value;

                    return (
                        <button
                            key={value}
                            type="button"
                            title={label}
                            aria-label={`Cambiar mesa ${mesa.numero} a ${label}`}
                            aria-pressed={isActive}
                            onClick={() => {
                                if (!isActive) onCambiarEstado(mesa.id, value);
                            }}
                            className={`flex h-8 items-center justify-center rounded-lg border transition active:scale-95 ${isActive ? activeClass : idleClass}`}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>

            {mesa.pedido_listo && (
                <button
                    onClick={() => {
                        router.post(`/mesas/${mesa.id}/entregar`, {}, {
                            onSuccess: () => router.reload(),
                            onError: (errors) => swalError('No se pudo confirmar la entrega', errorsToText(errors)),
                        });
                    }}
                    className="mt-2 flex w-full items-center justify-center rounded-lg bg-orange-400 py-2 text-xs font-extrabold text-white transition hover:bg-orange-500"
                >
                    Entregar
                </button>
            )}

            {renderPrimaryAction()}
        </div>
    );
}
// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------
export default function MesasDistribucion() {

    const { mesas: mesasIniciales, pedidos: pedidosIniciales, flash } = usePage<{
        mesas?: Mesa[] | { data?: Mesa[] } | Record<string, Mesa>;
        pedidos?: any[] | { data?: any[] } | Record<string, any>;
        flash?: FlashProps
    }>().props;

    const [mesas, setMesas] = useState<Mesa[]>(() => toArray<Mesa>(mesasIniciales));



    const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
    const [mesaCobro, setMesaCobro] = useState<Mesa | null>(null);
    const [pedidoCobro, setPedidoCobro] = useState<any | null>(null);
    const [modalPinAbierto, setModalPinAbierto] = useState(false);
    const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

    const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(null);
    const pedidos = toArray<any>(pedidosIniciales);
    const [isClient, setIsClient] = useState(false);


    const cambiarEstado = (id: number, nuevoEstado: string) => {
        const mesasAnteriores = mesas;

        setMesas(prev => prev.map(m =>
            m.id === id ? { ...m, estado: nuevoEstado as Mesa['estado'] } : m
        ));

        router.patch(`/mesas/${id}`, { estado: nuevoEstado }, {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => {
                setMesas(mesasAnteriores); // revertir solo si falla
                swalError('Error al cambiar estado', errorsToText(errors));
            },
        });
    };

    const abrirModalCobro = (mesa: Mesa) => {
        const pedidosDeLaMesa = pedidos.filter(p => p.mesa_id === mesa.id);
        setPedidoCobro(pedidosDeLaMesa);
        setMesaCobro(mesa);
        setModalCobroAbierto(true);
    };
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    );

    useEffect(() => {
        setMesas(toArray<Mesa>(mesasIniciales));
    }, [mesasIniciales]);
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Tiempo real: el mapa de mesas se actualiza sin recargar la página
    useSedeChannel('mesas', {
        'mesa.actualizada': (payload: any) => {
            setMesas(prev => prev.map(m => (m.id === payload.id ? { ...m, ...payload } : m)));
        },
    });

    // Aviso de capacidad excedida (viene del backend vía flash)
    useEffect(() => {
        const aviso = flash?.aviso_capacidad;
        if (!aviso) return;
        Swal.fire({
            icon: 'warning',
            title: 'Capacidad excedida',
            text: aviso.mensaje,
            showCancelButton: true,
            confirmButtonText: 'Agregar silla',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#C9A96E',
            cancelButtonColor: '#6B7280',
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(`/mesas/${aviso.mesero_origen_id}/transferir-silla/${aviso.mesa_destino_id}`, { forzar: true }, {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['mesas'] }),
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);




    const tomarPedido = (mesa: Mesa) => {
        setMesaSeleccionada(mesa);
        setModalPinAbierto(true);
    };

    const confirmarPin = (userId: number) => {
        if (!mesaSeleccionada) return;
        const mesa = mesaSeleccionada;

        router.patch(`/mesas/${mesa.id}`, { estado: 'ocupada', user_id: userId }, {
            preserveScroll: true,
            onSuccess: () => {
                setMesas(prev => prev.map(m =>
                    m.id === mesa.id ? { ...m, estado: 'ocupada' } : m
                ));
                window.location.href = `/ventas?mesa=${mesa.numero}`;
            },
            onError: (errors) => swalError('Error al tomar pedido', errorsToText(errors)),
        });
    };

    const verPedido = (mesa: Mesa) => {

        // Buscar el pedido activo de esta mesa
        const pedido = pedidos.find(p => p.mesa_id === mesa.id);
        if (pedido) {
            // Crear un objeto con los datos necesarios incluyendo el número de mesa
            const pedidoConMesa = {
                ...pedido,
                mesa_numero: mesa.numero,
                mesero: mesa.mesero || 'No asignado'
            };
            // Guardar el pedido seleccionado y abrir la tarjeta
            setPedidoSeleccionado(pedidoConMesa);
            setModalPedidoAbierto(true);
        } else {
            swalError('Sin pedido activo', 'No hay pedido para esta mesa.');
        }
    };

    const crearMesa = async () => {
        const result = await Swal.fire({
            title: 'Nueva mesa',
            html: `
                <div class="text-left space-y-3">
                    <label class="block text-sm font-semibold text-gray-700">
                        Numero de mesa
                        <input id="swal-mesa-numero" class="swal2-input !mx-0 !mt-1 !w-full" placeholder="Ej: 12" />
                    </label>
                    <label class="block text-sm font-semibold text-gray-700">
                        Capacidad
                        <input id="swal-mesa-capacidad" type="number" min="1" class="swal2-input !mx-0 !mt-1 !w-full" placeholder="Personas" />
                    </label>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear mesa',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#C9A96E',
            cancelButtonColor: '#6B7280',
            preConfirm: () => {
                const numero = (document.getElementById('swal-mesa-numero') as HTMLInputElement | null)?.value.trim();
                const capacidadValue = (document.getElementById('swal-mesa-capacidad') as HTMLInputElement | null)?.value;
                const capacidad = Number.parseInt(capacidadValue || '', 10);

                if (!numero) {
                    Swal.showValidationMessage('Ingresa el numero de mesa');
                    return false;
                }

                if (!Number.isInteger(capacidad) || capacidad < 1) {
                    Swal.showValidationMessage('Ingresa una capacidad valida');
                    return false;
                }

                return { numero, capacidad };
            },
        });

        if (!result.isConfirmed || !result.value) return;

        const { numero, capacidad } = result.value;

        router.post('/mesas', { numero, capacidad, sillas: capacidad }, {
            onSuccess: () => {
                swalSuccess('Mesa creada', `Mesa #${numero} registrada correctamente.`);
                router.reload({ only: ['mesas'] });
            },
            onError: (errors) => swalError('Error al crear mesa', errorsToText(errors)),
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const mesaOrigenId = active.data.current?.mesaOrigenId as number | undefined;
        const mesaDestinoId = over.data.current?.mesaId as number | undefined;
        if (!mesaOrigenId || !mesaDestinoId || mesaOrigenId === mesaDestinoId) return;

        const origen = mesas.find(m => m.id === mesaOrigenId);
        const destino = mesas.find(m => m.id === mesaDestinoId);
        if (!origen || !destino) return;

        if (origen.estado !== 'libre' || destino.estado !== 'libre') {
            swalError('Movimiento no permitido', 'Solo puedes mover sillas entre mesas libres.');
            return;
        }
        if (origen.sillas <= 1) {
            swalError('Movimiento no permitido', 'La mesa debe tener al menos 1 silla.');
            return;
        }

        // Actualización optimista para que se sienta instantáneo en tablet
        setMesas(prev => prev.map(m => {
            if (m.id === mesaOrigenId) return { ...m, sillas: m.sillas - 1 };
            if (m.id === mesaDestinoId) return { ...m, sillas: m.sillas + 1 };
            return m;
        }));

        router.patch(`/mesas/${mesaOrigenId}/transferir-silla/${mesaDestinoId}`, {}, {
            preserveScroll: true,
            onError: () => {
                // revertir si falla
                setMesas(prev => prev.map(m => {
                    if (m.id === mesaOrigenId) return { ...m, sillas: m.sillas + 1 };
                    if (m.id === mesaDestinoId) return { ...m, sillas: m.sillas - 1 };
                    return m;
                }));
                swalError('No se pudo mover la silla');
            },
        });
    };

    return (
        <>
            <Head title="Distribución de Mesas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:p-4 bg-[#FBF7F0]">

                <div className="flex justify-end gap-3">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <button
                            onClick={crearMesa}
                            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-4 sm:px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Mesa
                        </button>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-white/80 rounded-xl border border-[#8D6B53]/20 text-xs">
                            <span className="flex items-center gap-1 text-gray-700"><span className="w-3 h-3 rounded-full bg-green-400" /> Libre</span>
                            <span className="flex items-center gap-1 text-gray-700"><span className="w-3 h-3 rounded-full bg-yellow-400" /> Pendiente</span>
                            <span className="flex items-center gap-1 text-gray-700"><span className="w-3 h-3 rounded-full bg-orange-400" /> Ocupada</span>
                            <span className="flex items-center gap-1 text-gray-700"><span className="w-3 h-3 rounded-full bg-blue-400" /> Reserva</span>
                            <span className="flex items-center gap-1 text-gray-700"><span className="w-3 h-3 rounded-full bg-purple-400" /> Cobrar</span>
                        </div>
                    </div>
                </div>

                {/* 👇 PLANO DE MESAS - SIN BARRA LATERAL */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#5A3D2B]">Distribucion de mesas - tiempo real</h2>
                        <span className="text-xs text-[#8D6B53]">
                            {mesas.filter(m => m.estado === 'ocupada').length} ocupadas / {mesas.length} total
                        </span>
                    </div>

                    {isClient && (
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                                {mesas.map((mesa) => (
                                    <MesaCard
                                        key={mesa.id}
                                        mesa={mesa}
                                        onCambiarEstado={cambiarEstado}
                                        onTomarPedido={tomarPedido}
                                        onAbrirModalCobro={abrirModalCobro}
                                        onVerPedido={verPedido}
                                        pedidos={pedidos}
                                    />
                                ))}
                            </div>
                        </DndContext>
                    )}
                </div>

                {/* TARJETA DE PEDIDO */}
                {modalPedidoAbierto && pedidoSeleccionado && (
                    <div className="mt-4">
                        <TarjetaPedido
                            pedido={pedidoSeleccionado}
                            mesaNumero={pedidoSeleccionado.mesa_numero}
                            mesero={pedidoSeleccionado.mesero || 'No asignado'}
                            onClose={() => {
                                setModalPedidoAbierto(false);
                                setPedidoSeleccionado(null);
                            }}
                        />
                    </div>
                )}

                {/* MODALES */}
                <ModalPin
                    isOpen={modalPinAbierto}
                    mesa={mesaSeleccionada}
                    onClose={() => {
                        setModalPinAbierto(false);
                        setMesaSeleccionada(null);
                    }}
                    onConfirm={confirmarPin}
                />
                <ModalCobro
                    isOpen={modalCobroAbierto}
                    mesa={mesaCobro}
                    pedido={pedidoCobro}
                    onClose={() => setModalCobroAbierto(false)}
                    onSuccess={() => {
                        setModalCobroAbierto(false);
                        router.reload({ only: ['mesas', 'pedidos'], preserveUrl: true });
                    }}
                />
            </div>
        </>
    );
}

MesasDistribucion.layout = {
    breadcrumbs: [
        {
            title: 'Mesas',
            href: '/mesas',
        },
    ],
};
