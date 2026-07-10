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
import { Armchair, Search, Plus, User } from 'lucide-react';

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
function MesaCard({ mesa, onCambiarEstado, onTomarPedido, onAbrirModalCobro }: {
    mesa: Mesa;
    onCambiarEstado: (id: number, estado: string) => void;
    onTomarPedido: (mesa: Mesa) => void;
    onAbrirModalCobro: (mesa: Mesa) => void;
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
                {/* ✅ Solo mostrar "Cobrar" si la mesa NO está en listo_cobrar */}
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
                    onClick={() => { window.location.href = `/ventas?mesa=${mesa.numero}`; }}
                    className="w-full mt-2 py-2.5 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95"
                >
                    🍽️ Ver Pedido
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
    console.log('📦 Pedidos desde usePage:', pedidosIniciales);
    console.log('📦 Mesas desde usePage:', mesasIniciales);
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
    const pedidos = pedidosIniciales || [];

    const abrirModalCobro = (mesa: Mesa) => {
        console.log('🪑 ID de mesa:', mesa.id);
        console.log('📦 pedidos disponibles:', pedidos);

        const pedidoActivo = pedidos.find(p => p.mesa_id === mesa.id);
        console.log('✅ Pedido encontrado:', pedidoActivo);
        console.log('📋 Productos:', pedidoActivo?.productos);

        // ✅ PRIMERO establecer el pedido
        setPedidoCobro(pedidoActivo || null);
        // ✅ LUEGO la mesa
        setMesaCobro(mesa);
        // ✅ FINALMENTE abrir el modal
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

    // Un solo flujo: tomar pedido = ocupar + asignar mesero + pintar naranja
    const tomarPedido = (mesa: Mesa) => {
        const mesero = prompt('Nombre del mesero que atiende la mesa:');
        if (!mesero) return;

        router.patch(`/mesas/${mesa.id}`, { estado: 'ocupada', mesero }, {
            preserveScroll: true,
            onSuccess: () => {
                setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, estado: 'ocupada', mesero } : m));
                window.location.href = `/ventas?mesa=${mesa.numero}`;
            },
            onError: (errors) => alert('Error al tomar pedido: ' + Object.values(errors).join(' ')),
        });
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

    // Drag & drop de sillas entre mesas
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
                                        key={mesa.id} mesa={mesa} onCambiarEstado={cambiarEstado} onTomarPedido={tomarPedido} onAbrirModalCobro={abrirModalCobro} />
                                ))}
                            </div>
                        </DndContext>
                    </div>
                </div>
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