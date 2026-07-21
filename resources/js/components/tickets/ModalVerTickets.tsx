import { X, Clock, CheckCircle2, Package, ShoppingBag, ChefHat } from 'lucide-react';
import TarjetaTicket from './TarjetaTicket';

interface Ticket {
    id: number;
    numero?: string;
    estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
    productos: any[];
    created_at: string;
    total: number;
}

interface ModalVerTicketsProps {
    isOpen: boolean;
    mesa: { id: number; numero: string };
    tickets: Ticket[];
    onClose: () => void;
    onEntregarTicket: (ticketId: number) => void;
    onCobrarMesa?: () => void; 
}

export default function ModalVerTickets({
    isOpen,
    mesa,
    tickets,
    onClose,
    onEntregarTicket,
    onCobrarMesa
}: ModalVerTicketsProps) {
    if (!isOpen) return null;

    // ✅ AHORA: Mostrar TODOS los tickets (incluyendo entregados)
    const ticketsActivos = tickets; // Todos los tickets
    const ticketsNoEntregados = tickets.filter(t => t.estado !== 'entregado');
    const ticketsListos = tickets.filter(t => t.estado === 'listo');
    const todosEntregados = tickets.every(t => t.estado === 'entregado');

    // ✅ Badge para los estados
    const getEstadoBadge = (estado: string) => {
        const estados = {
            pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            preparando: { label: 'Preparando', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            listo: { label: 'Listo ✅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            entregado: { label: 'Entregado ✅', color: 'bg-green-100 text-green-700 border-green-200' },
        };
        return estados[estado as keyof typeof estados] || estados.pendiente;
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden transform transition-all animate-slideUp">

                {/* Header */}
                <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D1B1A] to-[#3F2A27] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {mesa.numero}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                                Mesa #{mesa.numero}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    {tickets.length} tickets totales
                                </span>
                                {ticketsListos.length > 0 && (
                                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                                        <ChefHat className="w-4 h-4" />
                                        {ticketsListos.length} listos
                                    </span>
                                )}
                                {todosEntregados && (
                                    <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                                        ✅ Todos entregados
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.location.href = `/ventas?mesa=${mesa.numero}`}
                            className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Editar pedido
                        </button>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    {todosEntregados ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-800">🎉 ¡Todos los pedidos entregados!</p>
                            <p className="text-gray-500 mt-2 text-center max-w-sm">
                                La mesa está completa y lista para cobrar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* ✅ Mostrar TODOS los tickets (incluyendo entregados) */}
                            {tickets.map(ticket => {
                                const estado = getEstadoBadge(ticket.estado);
                                const isEntregado = ticket.estado === 'entregado';
                                const isListo = ticket.estado === 'listo';

                                return (
                                    <div
                                        key={ticket.id}
                                        className={`bg-white rounded-xl p-4 border transition-all ${
                                            isEntregado 
                                                ? 'border-gray-100 opacity-75' 
                                                : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-gray-800">
                                                    Ticket #{ticket.numero || ticket.id}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                                                    {estado.label}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(ticket.created_at).toLocaleTimeString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-700">
                                                S/ {ticket.total.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Productos */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {ticket.productos?.slice(0, 4).map((prod, idx) => (
                                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                                    {prod.nombre || prod.producto?.nombre || 'Producto'}
                                                    {prod.cantidad > 1 && ` x${prod.cantidad}`}
                                                </span>
                                            ))}
                                            {ticket.productos?.length > 4 && (
                                                <span className="text-xs text-gray-400 px-2.5 py-1">
                                                    +{ticket.productos.length - 4} más
                                                </span>
                                            )}
                                        </div>

                                        {/* ✅ BOTONES SEGÚN ESTADO */}
                                        {isListo && !isEntregado && (
                                            <button
                                                onClick={() => onEntregarTicket(ticket.id)}
                                                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Entregar pedido
                                            </button>
                                        )}

                                        {isEntregado && (
                                            <div className="w-full mt-2 bg-green-50 text-green-600 py-2.5 rounded-xl text-sm font-medium text-center border border-green-200 flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                ✅ Pedido entregado
                                            </div>
                                        )}

                                        {!isEntregado && ticket.estado === 'pendiente' && (
                                            <div className="w-full mt-2 bg-amber-50 text-amber-600 py-2.5 rounded-xl text-sm font-medium text-center border border-amber-100">
                                                ⏳ Esperando preparación
                                            </div>
                                        )}

                                        {!isEntregado && ticket.estado === 'preparando' && (
                                            <div className="w-full mt-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-medium text-center border border-blue-100">
                                                👨‍🍳 En preparación
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}