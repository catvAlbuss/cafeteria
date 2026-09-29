import {
    X,
    Clock,
    CheckCircle2,
    Package,
    ShoppingBag,
    ChefHat,
} from 'lucide-react';

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
}: ModalVerTicketsProps) {
    if (!isOpen) {
        return null;
    }

    const ticketsListos = tickets.filter((t) => t.estado === 'listo');
    const todosEntregados = tickets.every((t) => t.estado === 'entregado');

    const getEstadoBadge = (estado: string) => {
        const estados: Record<
            string,
            { label: string; color: string; Icono: typeof CheckCircle2 }
        > = {
            pendiente: {
                label: 'Pendiente',
                color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
                Icono: Clock,
            },
            preparando: {
                label: 'Preparando',
                color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
                Icono: ChefHat,
            },
            listo: {
                label: 'Listo',
                color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
                Icono: CheckCircle2,
            },
            entregado: {
                label: 'Entregado',
                color: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
                Icono: CheckCircle2,
            },
        };

        return estados[estado as keyof typeof estados] || estados.pendiente;
    };

    return (
        <div className="animate-fadeIn fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="animate-slideUp flex max-h-[92vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-sand bg-card px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-roast to-espresso text-xl font-bold text-white shadow-lg">
                            {mesa.numero}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-chocolate">
                                Mesa #{mesa.numero}
                            </h2>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1 text-sm text-cocoa">
                                    <Package className="h-4 w-4" />
                                    {tickets.length} tickets totales
                                </span>
                                {ticketsListos.length > 0 && (
                                    <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                                        <ChefHat className="h-4 w-4" />
                                        {ticketsListos.length} listos
                                    </span>
                                )}
                                {todosEntregados && (
                                    <span className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Todos entregados
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                (window.location.href = `/ventas?mesa=${mesa.numero}`)
                            }
                            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-gold-deep hover:shadow-md"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Editar pedido
                        </button>

                        <button
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-cocoa-soft transition hover:bg-cream-pale hover:text-cocoa"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto bg-background/40 p-6">
                    {todosEntregados ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-chocolate">
                                ¡Todos los pedidos entregados!
                            </p>
                            <p className="mt-2 max-w-sm text-center text-cocoa">
                                La mesa está completa y lista para cobrar
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* ✅ Mostrar TODOS los tickets (incluyendo entregados) */}
                            {tickets.map((ticket) => {
                                const estado = getEstadoBadge(ticket.estado);
                                const isEntregado =
                                    ticket.estado === 'entregado';
                                const isListo = ticket.estado === 'listo';

                                return (
                                    <div
                                        key={ticket.id}
                                        className={`rounded-xl border bg-card p-4 transition-all ${
                                            isEntregado
                                                ? 'border-sand opacity-75'
                                                : 'border-sand hover:border-gold/50 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-chocolate">
                                                    Ticket #
                                                    {ticket.numero || ticket.id}
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${estado.color}`}
                                                >
                                                    <estado.Icono className="h-3 w-3" />
                                                    {estado.label}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-cocoa-soft">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(
                                                        ticket.created_at,
                                                    ).toLocaleTimeString(
                                                        'es-ES',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <span className="font-bold text-chocolate">
                                                S/ {ticket.total.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Productos */}
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                            {ticket.productos
                                                ?.slice(0, 4)
                                                .map((prod, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="rounded-full bg-cream-pale px-2.5 py-1 text-xs text-cocoa"
                                                    >
                                                        {prod.nombre ||
                                                            prod.producto
                                                                ?.nombre ||
                                                            'Producto'}
                                                        {prod.cantidad > 1 &&
                                                            ` x${prod.cantidad}`}
                                                    </span>
                                                ))}
                                            {ticket.productos?.length > 4 && (
                                                <span className="px-2.5 py-1 text-xs text-cocoa-soft">
                                                    +
                                                    {ticket.productos.length -
                                                        4}{' '}
                                                    más
                                                </span>
                                            )}
                                        </div>

                                        {/* BOTONES SEGÚN ESTADO */}
                                        {isListo && !isEntregado && (
                                            <button
                                                onClick={() =>
                                                    onEntregarTicket(ticket.id)
                                                }
                                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 hover:shadow-md"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Entregar pedido
                                            </button>
                                        )}

                                        {isEntregado && (
                                            <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 py-2.5 text-center text-sm font-medium text-green-600 dark:text-green-400">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Pedido entregado
                                            </div>
                                        )}

                                        {!isEntregado &&
                                            ticket.estado === 'pendiente' && (
                                                <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 py-2.5 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                                                    <Clock className="h-4 w-4" />
                                                    Esperando preparación
                                                </div>
                                            )}

                                        {!isEntregado &&
                                            ticket.estado === 'preparando' && (
                                                <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2.5 text-center text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    <ChefHat className="h-4 w-4" />
                                                    En preparación
                                                </div>
                                            )}
                                    </div>
                                );
                            })}

                            {todosEntregados && (
                                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 py-4">
                                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                                        <CheckCircle2 className="h-6 w-6 text-purple-500" />
                                    </div>
                                    <p className="text-lg font-bold text-chocolate">
                                        ¡Todos los pedidos entregados!
                                    </p>
                                    <p className="text-sm text-cocoa">
                                        La mesa está completa y lista para
                                        cobrar
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
