import { X, Check, Clock, Coffee, Utensils, ChefHat } from 'lucide-react';

interface ProductoItem {
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
    area: 'cocina' | 'bar' | 'horno' | 'postres';
    estado: 'pendiente' | 'preparando' | 'listo';
}

interface Ticket {
    id: number;
    numero?: string;
    estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
    productos: ProductoItem[];
    created_at: string;
    total: number;
}

interface TarjetaTicketProps {
    ticket: Ticket;
    onEntregar: (ticketId: number) => void;
    onCerrar: () => void;
}

const areaIconos: Record<string, any> = {
    'cocina': ChefHat,
    'bar': Coffee,
    'horno': Utensils,
    'postres': Utensils,
};

const areaColores: Record<string, string> = {
    'cocina': 'bg-orange-100 text-orange-700',
    'bar': 'bg-blue-100 text-blue-700',
    'horno': 'bg-red-100 text-red-700',
    'postres': 'bg-pink-100 text-pink-700',
};

export default function TarjetaTicket({ ticket, onEntregar, onCerrar }: TarjetaTicketProps) {
    const todosListos = ticket.productos.every(p => p.estado === 'listo');
    const estaEntregado = ticket.estado === 'entregado';

    const productosPorArea = ticket.productos.reduce((acc, p) => {
        if (!acc[p.area]) acc[p.area] = { total: 0, listos: 0 };
        acc[p.area].total++;
        if (p.estado === 'listo') acc[p.area].listos++;
        return acc;
    }, {} as Record<string, { total: number; listos: number }>);

    const getEstadoLabel = () => {
        if (estaEntregado) return { texto: '✅ Entregado', color: 'bg-green-500 text-white' };
        if (todosListos) return { texto: '🟡 Listo para entregar', color: 'bg-yellow-400 text-[#2D1B1A]' };
        return { texto: '🔄 Preparando...', color: 'bg-gray-500 text-white' };
    };

    const estadoInfo = getEstadoLabel();
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-[#F3E1C8] overflow-hidden">
            {/* Header del Ticket */}
            <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-5 py-3 flex justify-between items-center">
                <div>
                    <h4 className="text-white font-semibold text-sm">
                        Ticket #{ticket.numero || ticket.id}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                        {estadoInfo.texto}
                    </span>
                </div>
                <button
                    onClick={onCerrar}
                    className="text-white/60 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body: Productos */}
            <div className="p-4 space-y-2 max-h-[250px] overflow-y-auto">
                {ticket.productos.map((producto, idx) => {
                    const Icono = areaIconos[producto.area] || Utensils;
                    const colorArea = areaColores[producto.area] || 'bg-gray-100 text-gray-700';
                    return (
                        <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-3 flex-1">
                                <span className={`p-1 rounded-lg ${colorArea}`}>
                                    <Icono className="w-3 h-3" />
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-[#2D1B1A]">
                                        {producto.cantidad}x {producto.nombre}
                                    </p>
                                    <p className="text-xs text-[#8D6B53]">
                                        {producto.area} · S/ {producto.precio.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                producto.estado === 'listo'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                            }`}>
                                {producto.estado === 'listo' ? '✅ Listo' : '⏳ Pendiente'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progreso por área */}
            {Object.keys(productosPorArea).length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {Object.entries(productosPorArea).map(([area, { total, listos }]) => (
                        <span key={area} className={`text-xs px-2 py-1 rounded-full ${areaColores[area] || 'bg-gray-100 text-gray-700'}`}>
                            {area}: {listos}/{total} listos
                        </span>
                    ))}
                </div>
            )}

            {/* Total del ticket */}
            <div className="px-4 pb-2 flex justify-end">
                <span className="text-sm font-bold text-[#C9A96E]">
                    Total: S/ {ticket.total.toFixed(2)}
                </span>
            </div>
            {/* Footer: Botón Entregar (solo si está listo y no entregado) */}
            {todosListos && !estaEntregado && (
                <div className="px-4 py-3 border-t border-gray-200 bg-[#FBF7F0]">
                    <button
                        onClick={() => onEntregar(ticket.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Entregar este ticket
                    </button>
                </div>
            )}
        </div>
    );
}