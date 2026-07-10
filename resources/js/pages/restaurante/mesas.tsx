import { Head, usePage, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ModalCobro from '@/components/modals/ModalCobro';
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
    Check, 
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
// COMPONENTE MODAL PARA MESERO
// ============================================================

interface ModalMeseroProps {
    isOpen: boolean;
    mesa: Mesa | null;
    onClose: () => void;
    onConfirm: (mesero: string) => void;
}

function ModalMesero({ isOpen, mesa, onClose, onConfirm }: ModalMeseroProps) {
    const [nombreMesero, setNombreMesero] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !mesa) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTrim = nombreMesero.trim();

        if (!nombreTrim) {
            setError('Por favor ingresa el nombre del mesero');
            return;
        }

        if (nombreTrim.length < 2) {
            setError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        setError('');
        onConfirm(nombreTrim);
        setNombreMesero('');
        onClose();
    };

    const handleClose = () => {
        setNombreMesero('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#C9A96E] rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">
                                    Tomar Pedido
                                </h3>
                                <p className="text-gray-300 text-[10px]">
                                    Mesa #{mesa.numero}
                                </p>
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

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                                Nombre del mesero
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ej: Fiorela, Angel..."
                                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 text-sm text-gray-900 placeholder-gray-400 ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                value={nombreMesero}
                                onChange={(e) => {
                                    setNombreMesero(e.target.value);
                                    if (error) setError('');
                                }}
                                autoFocus
                            />
                            {nombreMesero && (
                                <button
                                    type="button"
                                    onClick={() => setNombreMesero('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {error && (
                            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                <span>⚠</span>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Sugerencias rápidas */}
                    <div className="mb-4">
                        <p className="text-[10px] text-gray-400 mb-1.5">Sugerencias:</p>
                        <div className="flex gap-1.5 flex-wrap">
                            {['Fiorela', 'Angel', 'María', 'Carlos', 'Lucía'].map((nombre) => (
                                <button
                                    key={nombre}
                                    type="button"
                                    onClick={() => {
                                        setNombreMesero(nombre);
                                        setError('');
                                    }}
                                    className={`px-2.5 py-1 text-[10px] rounded-full border transition ${nombreMesero === nombre
                                        ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E] font-medium'
                                        : 'border-gray-200 text-gray-500 hover:border-[#C9A96E] hover:text-[#C9A96E]'
                                        }`}
                                >
                                    {nombre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-medium text-sm transition flex items-center justify-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Aceptar
                        </button>
                    </div>
                </form>
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
                <div className="px-5 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-medium text-sm transition"
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

interface Cliente {
    id: number;
    nombre: string;
    mesa: string;
    personas: number;
    estado: 'ocupada' | 'pendiente' | 'reserva' | 'libre';
    telefono?: string;
}

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
        <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1 justify-center flex-wrap">
                {Array.from({ length: arriba }).map((_, i) => (
                    <SillaDraggable key={i} mesaId={mesa.id} index={i} colorClass={colorClass} disabled={disabled} />
                ))}
            </div>
            <div className={`w-14 h-10 sm:w-12 sm:h-8 rounded-lg border-2 ${getEstadoConfig(mesa.estado).border} ${getEstadoConfig(mesa.estado).bg} flex items-center justify-center shadow-inner`}>
                <span className={`text-sm sm:text-xs font-bold ${getEstadoConfig(mesa.estado).text}`}>{mesa.capacidad}</span>
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
function MesaCard({ mesa, onCambiarEstado, onTomarPedido, onAbrirModalCobro, onVerPedido }: {
    mesa: Mesa;
    onCambiarEstado: (id: number, estado: string) => void;
    onTomarPedido: (mesa: Mesa) => void;
    onAbrirModalCobro: (mesa: Mesa) => void;
    onVerPedido?: (mesa: Mesa) => void;
}) {
    const config = getEstadoConfig(mesa.estado);
    const { setNodeRef, isOver } = useDroppable({ id: `mesa-${mesa.id}`, data: { mesaId: mesa.id } });
    const colorSilla =
        mesa.estado === 'ocupada' ? 'text-orange-400' :
            mesa.estado === 'pendiente' ? 'text-yellow-400' :
                mesa.estado === 'reserva' ? 'text-blue-400' :
                    mesa.estado === 'listo_cobrar' ? 'text-purple-400' :
                        'text-green-400';

    const dragDisabled = mesa.estado !== 'libre';

    return (
        <div
            ref={setNodeRef}
            className={`relative p-3 rounded-xl border-2 ${config.border} ${config.bg} shadow-sm hover:shadow-md transition-all duration-200
                ${isOver ? 'ring-4 ring-[#C9A96E] scale-[1.02]' : ''}`}
        >

            {mesa.pedido_listo && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
                    📨 Listo
                </div>
            )}

            {/* Encabezado */}
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 ${config.border} border text-gray-700`}>
                    Mesa #{mesa.numero}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${config.chip}`} />
            </div>

            {/* Plano de mesa + sillas */}
            <PlanoMesa mesa={mesa} colorClass={colorSilla} disabled={dragDisabled} />

            {/* Estado + mesero */}
            <div className="text-center mt-1">
                <p className={`text-xs font-medium ${config.text}`}>{config.label}</p>
                {mesa.estado === 'ocupada' && mesa.mesero && (
                    <p className="flex items-center justify-center gap-1 text-[11px] text-[#5A3D2B] font-medium mt-0.5">
                        <User className="w-3 h-3" /> {mesa.mesero}
                    </p>
                )}
            </div>

            {/* Botones rápidos de estado */}
            <div className="mt-2 grid grid-cols-3 gap-1">
                <button onClick={() => onCambiarEstado(mesa.id, 'libre')} className="py-2 sm:py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded text-[11px] font-medium transition">
                    Libre
                </button>
                <button onClick={() => onCambiarEstado(mesa.id, 'pendiente')} className="py-2 sm:py-1.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded text-[11px] font-medium transition">
                    Espera
                </button>
                {/*  Solo mostrar "Cobrar" si la mesa NO está en listo_cobrar */}
                {mesa.estado !== 'listo_cobrar' && (
                    <button onClick={() => onCambiarEstado(mesa.id, 'listo_cobrar')} className="py-2 sm:py-1.5 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white rounded text-[11px] font-medium transition">
                        Cobrar
                    </button>
                )}
            </div>

            {mesa.pedido_listo && (
                <button
                    onClick={() => {
                        router.post(`/mesas/${mesa.id}/entregar`, {}, {
                            onSuccess: () => router.reload()
                        });
                    }}
                    className="w-full mt-2 py-2.5 bg-orange-300 hover:bg-orange-400 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                    📨 Entregar
                </button>
            )}

            {/* Acción principal: Tomar Pedido / Ver Pedido — reemplaza al botón "Ocupar" */}
            {mesa.estado !== 'ocupada' && mesa.estado !== 'listo_cobrar' && (
                <button
                    onClick={() => onTomarPedido(mesa)}
                    className="w-full mt-2 py-2.5 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95"
                >
                    🍽️ Tomar Pedido
                </button>
            )}

            {mesa.estado === 'ocupada' && (
                <button
                    onClick={() => {

                        if (onVerPedido) onVerPedido(mesa);
                    }}
                    className="w-full mt-2 py-2.5 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95"
                >
                    📋 Ver Pedido
                </button>
            )}

            {mesa.estado === 'listo_cobrar' && (
                <button
                    onClick={() => onAbrirModalCobro(mesa)}
                    className="w-full mt-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 animate-pulse"
                >
                    💰 Cobrar
                </button>
            )}


        </div>
    );
}

// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------
export default function MesasDistribucion() {

    const { mesas: mesasIniciales, pedidos: pedidosIniciales, flash } = usePage<{
        mesas?: Mesa[];
        pedidos?: any[];
        flash?: FlashProps
    }>().props;

    const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales || []);

    const [clientes] = useState<Cliente[]>([
        { id: 1, nombre: 'María López', mesa: '01', personas: 2, estado: 'ocupada' },
        { id: 2, nombre: 'Carlos Ruiz', mesa: '02', personas: 4, estado: 'ocupada' },
        { id: 3, nombre: 'Disponible', mesa: '03', personas: 6, estado: 'libre' },
        { id: 4, nombre: 'José Pérez', mesa: '04', personas: 5, estado: 'reserva' },
    ]);

    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');


    const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
    const [mesaCobro, setMesaCobro] = useState<Mesa | null>(null);
    const [pedidoCobro, setPedidoCobro] = useState<any | null>(null);
    const [modalMeseroAbierto, setModalMeseroAbierto] = useState(false);
    const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

    const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(null);
    const pedidos = pedidosIniciales || [];

    const abrirModalCobro = (mesa: Mesa) => {

        const pedidoActivo = pedidos.find(p => p.mesa_id === mesa.id);


        setPedidoCobro(pedidoActivo || null);
        setMesaCobro(mesa);
        setModalCobroAbierto(true);
    };
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    );

    useEffect(() => {
        if (mesasIniciales) setMesas(mesasIniciales);
    }, [mesasIniciales]);

    // Aviso de capacidad excedida (viene del backend vía flash)
    useEffect(() => {
        const aviso = flash?.aviso_capacidad;
        if (!aviso) return;
        const confirmar = window.confirm(aviso.mensaje);
        if (confirmar) {
            router.patch(`/mesas/${aviso.mesero_origen_id}/transferir-silla/${aviso.mesa_destino_id}`, { forzar: true }, {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['mesas'] }),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);

    const clientesFiltrados = useMemo(() => clientes.filter(c => {
        const coincideBusqueda = c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.mesa.includes(busquedaCliente);
        if (filtroEstado === 'todas') return coincideBusqueda;
        return coincideBusqueda && c.estado === filtroEstado;
    }), [clientes, busquedaCliente, filtroEstado]);

    const cambiarEstado = (id: number, nuevoEstado: string) => {
        router.patch(`/mesas/${id}`, { estado: nuevoEstado }, {
            preserveScroll: true,
            onSuccess: () => {
                setMesas(prev => prev.map(m => m.id === id ? { ...m, estado: nuevoEstado as Mesa['estado'] } : m));
            },
            onError: (errors) => alert('Error al cambiar estado: ' + Object.values(errors).join(' ')),
        });
    };


    const tomarPedido = (mesa: Mesa) => {
        setMesaSeleccionada(mesa);
        setModalMeseroAbierto(true);
    };

    const confirmarMesero = (mesero: string) => {
        if (!mesaSeleccionada) return;

        router.patch(`/mesas/${mesaSeleccionada.id}`, { estado: 'ocupada', mesero }, {
            preserveScroll: true,
            onSuccess: () => {
                setMesas(prev => prev.map(m =>
                    m.id === mesaSeleccionada.id ? { ...m, estado: 'ocupada', mesero } : m
                ));
                window.location.href = `/ventas?mesa=${mesaSeleccionada.numero}`;
            },
            onError: (errors) => alert('Error al tomar pedido: ' + Object.values(errors).join(' ')),
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
            alert('No hay pedido para esta mesa');
        }
    };

    const crearMesa = () => {
        const numero = prompt('Ingrese el número de mesa:');
        if (!numero) return;
        const capacidad = prompt('Ingrese la capacidad (personas):');
        if (!capacidad) return;

        router.post('/mesas', { numero, capacidad: parseInt(capacidad), sillas: parseInt(capacidad) }, {
            onSuccess: () => router.reload(),
            onError: (errors) => alert('Error al crear mesa: ' + Object.values(errors).join(' ')),
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
            alert('Solo puedes mover sillas entre mesas libres');
            return;
        }
        if (origen.sillas <= 1) {
            alert('La mesa debe tener al menos 1 silla');
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
                alert('No se pudo mover la silla');
            },
        });
    };

    return (
        <>
            <Head title="Distribución de Mesas" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:p-4 bg-[#FBF7F0]">

                {/* TÍTULO + BOTÓN NUEVA MESA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#2D1B1A]">Gestión de Mesas</h1>
                        <p className="text-[#5A3D2B] text-xs sm:text-sm font-medium">Administración del restaurante</p>
                    </div>
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

                <p className="text-[11px] text-[#8D6B53] -mt-2">
                    Tip: arrastra una silla 🪑 a otra mesa libre para redistribuirlas.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* CLIENTES */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-[#8D6B53]/20 p-4 shadow-sm order-2 lg:order-1">
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['todas', 'libre', 'reserva', 'ocupada'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFiltroEstado(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize
                                        ${filtroEstado === f ? 'bg-[#2D1B1A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {f === 'todas' ? 'Todas' : f}
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full p-2.5 pl-9 rounded-lg border border-[#8D6B53]/20 text-sm text-[#1A1A1A] placeholder-gray-500 bg-[#FBF7F0] focus:ring-1 focus:ring-[#C9A96E] outline-none"
                                value={busquedaCliente}
                                onChange={(e) => setBusquedaCliente(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1">
                            {clientesFiltrados.map((cliente) => {
                                const config = getEstadoConfig(cliente.estado);
                                return (
                                    <div key={cliente.id} className={`p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-sm transition`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-[#2D1B1A] text-sm">{cliente.nombre}</p>
                                                <p className="text-xs text-[#8D6B53]">Mesa {cliente.mesa}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{cliente.personas} pers.</span>
                                                <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {clientesFiltrados.length === 0 && (
                                <div className="text-center py-4 text-gray-400 text-sm">No se encontraron clientes</div>
                            )}
                        </div>
                    </div>

                    {/* PLANO DE MESAS */}
                    <div className="lg:col-span-2 order-1 lg:order-2">
                        <h2 className="text-sm font-semibold text-[#5A3D2B] mb-3">Distribución de Mesas — tiempo real</h2>

                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                {mesas.map((mesa) => (
                                    <MesaCard
                                        key={mesa.id} mesa={mesa} onCambiarEstado={cambiarEstado} onTomarPedido={tomarPedido} onAbrirModalCobro={abrirModalCobro} onVerPedido={verPedido} />
                                ))}
                            </div>
                        </DndContext>

                    </div>
                </div>

                {modalPedidoAbierto && pedidoSeleccionado && (
                    <div className="relative z-50">
                        {modalPedidoAbierto && pedidoSeleccionado && (
                            <TarjetaPedido
                                pedido={pedidoSeleccionado}
                                mesaNumero={pedidoSeleccionado.mesa_numero}
                                mesero={pedidoSeleccionado.mesero || 'No asignado'}
                                onClose={() => {
                                    setModalPedidoAbierto(false);
                                    setPedidoSeleccionado(null);
                                }}
                            />
                        )}
                    </div>
                )}

                <ModalMesero
                    isOpen={modalMeseroAbierto}
                    mesa={mesaSeleccionada}
                    onClose={() => {
                        setModalMeseroAbierto(false);
                        setMesaSeleccionada(null);
                    }}
                    onConfirm={confirmarMesero}
                />
                <ModalCobro
                    isOpen={modalCobroAbierto}
                    mesa={mesaCobro}
                    pedido={pedidoCobro}
                    onClose={() => setModalCobroAbierto(false)}
                    onSuccess={() => {
                        setModalCobroAbierto(false);
                        router.reload();
                    }}
                />
            </div>
        </>
    );
}