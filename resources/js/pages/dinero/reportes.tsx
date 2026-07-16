import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Download,
    FileSpreadsheet,
    Printer,
    TrendingUp,
    TrendingDown,
    Users,
    Truck,
    DollarSign,
    Coffee,
    CreditCard,
    Calendar,
    Search,
    ArrowUp,
    ArrowDown,
    Receipt,
    Store,
    Package,
    Clock,
    ChevronRight,
    Pizza,
    Cake,
    IceCream,
    Sandwich,
    Soup,
    Salad,
    Beef,
    Fish,
    Egg,
    CupSoda,
    GlassWater,
    Martini,
    ChefHat,
    Cookie,
    Croissant,
    Utensils,
    Banknote,
    Smartphone,
    Landmark,
    Wallet
} from 'lucide-react';

interface VentaDiaria {
    fecha: string;
    tickets: number;
    ventas: number;
    gastos: number;
    ganancia: number;
}
interface VentaDetalle {
    fecha: string;
    mesa: string;
    producto: string;
    total: number;
    metodo_pago: string;
}

interface ProductoVendido {
    nombre: string;
    cantidad: number;
    icono?: string;
}

interface MetodoPago {
    metodo: string;
    total: number;
    porcentaje?: number;
}

interface TicketMesa {
    mesa: string;
    tickets: number;
}

export default function Reportes() {
    const { props } = usePage();
    const {
        resumen: resumenData = {
            ventasDia: 0,
            ventasCambio: 0,
            clientes: 0,
            clientesNuevos: 0,
            deliverys: 0,
            deliverysEnRuta: 0,
            gananciaNeta: 0,
            gananciaCambio: 0,
            ticketsHoy: 0,
            mesasOcupadas: 0,
            mesasLibres: 0,
            totalMesas: 0,
            totalCobradoHoy: 0,
            cajaAbierta: false,
            cajaEmpleado: null,
        },
        ventasDiarias: ventasDiariasData = [],
        ventasDelDiaDetalle: ventasDelDiaDetalleData = [],
        productosMasVendidos: productosMasVendidosData = [],
        metodosPago: metodosPagoData = [],
        totales: totalesData = {
            totalVentas: 0,
            totalTickets: 0,
            totalGastos: 0,
            totalGanancia: 0,
            ticketPromedio: 0,
            margenGanancia: 0,
        },
        ventasPorTipo: ventasPorTipoData = [],
        ticketsPorMesa: ticketsPorMesaData = [],
        estadoMesas: estadoMesasData = { total: 0, ocupadas: 0, libres: 0 },
        fechas: fechasData = { inicio: '', fin: '' },
        error = null,
    } = props as any;

    const [fechaInicio, setFechaInicio] = useState(fechasData.inicio || '');
    const [fechaFin, setFechaFin] = useState(fechasData.fin || '');

    const resumen = resumenData;
    const ventasDiarias: VentaDiaria[] = ventasDiariasData.length > 0 ? ventasDiariasData : [
        { fecha: 'Sin datos', tickets: 0, ventas: 0, gastos: 0, ganancia: 0 }
    ];
    const productosMasVendidos = productosMasVendidosData.length > 0 ? productosMasVendidosData : [
        { nombre: 'Sin datos', cantidad: 0, icono: '📊' }
    ];
    const metodosPago = metodosPagoData.length > 0 ? metodosPagoData : [
        { metodo: 'Sin datos', total: 0, porcentaje: 0 }
    ];
    const totales = totalesData;

    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toLocaleString('es-PE')}`;
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-PE');
    };

    const totalVentas = ventasDiarias.reduce((sum: number, v) => sum + v.ventas, 0);
    const totalGastos = ventasDiarias.reduce((sum: number, v) => sum + v.gastos, 0);
    const totalGanancia = ventasDiarias.reduce((sum: number, v) => sum + v.ganancia, 0);
    const totalTickets = ventasDiarias.reduce((sum: number, v) => sum + v.tickets, 0);

    // Colores para métodos de pago
    const getMetodoColor = (metodo: string) => {
        const colores: Record<string, string> = {
            'efectivo': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'tarjeta': 'bg-blue-100 text-blue-700 border-blue-200',
            'yape': 'bg-purple-100 text-purple-700 border-purple-200',
            'plin': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'transferencia': 'bg-cyan-100 text-cyan-700 border-cyan-200',
        };
        return colores[metodo.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    // Íconos para métodos de pago (con Lucide)
    const getMetodoIcon = (metodo: string) => {
        const metodoLower = metodo.toLowerCase();

        switch (metodoLower) {
            case 'efectivo':
                return <Banknote className="w-4 h-4" />;
            case 'tarjeta':
                return <CreditCard className="w-4 h-4" />;
            case 'yape':
                return <Smartphone className="w-4 h-4" />;
            case 'plin':
                return <Smartphone className="w-4 h-4" />;
            case 'transferencia':
                return <Landmark className="w-4 h-4" />;
            default:
                return <Wallet className="w-4 h-4" />;
        }
    };

    // Íconos para productos
    const getProductoIcon = (nombre: string) => {
        const nombreLower = nombre.toLowerCase();

        // Café y bebidas calientes
        if (nombreLower.includes('café') || nombreLower.includes('espresso') || nombreLower.includes('cappuccino') || nombreLower.includes('latte') || nombreLower.includes('americano') || nombreLower.includes('mocha')) {
            return <Coffee className="w-5 h-5 text-amber-700" />;
        }
        if (nombreLower.includes('té') || nombreLower.includes('matcha') || nombreLower.includes('chai')) {
            return <CupSoda className="w-5 h-5 text-green-600" />;
        }
        if (nombreLower.includes('chocolate') || nombreLower.includes('frappé') || nombreLower.includes('frappe')) {
            return <Coffee className="w-5 h-5 text-amber-800" />;
        }

        // Postres y dulces
        if (nombreLower.includes('cheesecake') || nombreLower.includes('torta') || nombreLower.includes('pastel')) {
            return <Cake className="w-5 h-5 text-pink-500" />;
        }
        if (nombreLower.includes('helado') || nombreLower.includes('ice cream')) {
            return <IceCream className="w-5 h-5 text-blue-400" />;
        }
        if (nombreLower.includes('brownie') || nombreLower.includes('cookie') || nombreLower.includes('galleta')) {
            return <Cookie className="w-5 h-5 text-amber-600" />;
        }
        if (nombreLower.includes('croissant') || nombreLower.includes('pan') || nombreLower.includes('bagel')) {
            return <Croissant className="w-5 h-5 text-amber-500" />;
        }
        if (nombreLower.includes('tiramisú') || nombreLower.includes('flan') || nombreLower.includes('pudín') || nombreLower.includes('pudin')) {
            return <ChefHat className="w-5 h-5 text-amber-500" />;
        }

        // Platos principales
        if (nombreLower.includes('hamburguesa') || nombreLower.includes('burger')) {
            return <Sandwich className="w-5 h-5 text-red-600" />;
        }
        if (nombreLower.includes('pizza')) {
            return <Pizza className="w-5 h-5 text-red-600" />;
        }
        if (nombreLower.includes('sopa') || nombreLower.includes('crema')) {
            return <Soup className="w-5 h-5 text-amber-600" />;
        }
        if (nombreLower.includes('ensalada') || nombreLower.includes('salad')) {
            return <Salad className="w-5 h-5 text-green-500" />;
        }
        if (nombreLower.includes('carne') || nombreLower.includes('steak') || nombreLower.includes('res')) {
            return <Beef className="w-5 h-5 text-red-700" />;
        }
        if (nombreLower.includes('pescado') || nombreLower.includes('fish') || nombreLower.includes('salmon')) {
            return <Fish className="w-5 h-5 text-blue-500" />;
        }
        if (nombreLower.includes('pollo') || nombreLower.includes('chicken')) {
            return <Egg className="w-5 h-5 text-amber-500" />;
        }
        // Bebidas frías
        if (nombreLower.includes('jugo') || nombreLower.includes('smoothie') || nombreLower.includes('batido')) {
            return <GlassWater className="w-5 h-5 text-orange-500" />;
        }
        if (nombreLower.includes('gaseosa') || nombreLower.includes('soda') || nombreLower.includes('refresco')) {
            return <CupSoda className="w-5 h-5 text-blue-500" />;
        }
        if (nombreLower.includes('cerveza') || nombreLower.includes('vino') || nombreLower.includes('licor') || nombreLower.includes('coctel')) {
            return <Martini className="w-5 h-5 text-purple-500" />;
        }

        // Default
        return <Utensils className="w-5 h-5 text-gray-500" />;
    };

    // Tarjetas de resumen
    const tarjetasResumen = [
        {
            titulo: 'Ventas del día',
            valor: formatCurrency(resumen.ventasDia),
            cambio: `+${resumen.ventasCambio}%`,
            icono: <DollarSign className="w-6 h-6" />,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            textColor: 'text-amber-600',
        },
        {
            titulo: 'Tickets de hoy',
            valor: formatNumber(resumen.ticketsHoy || 0),
            cambio: `${resumen.mesasOcupadas || 0} mesas ocupadas`,
            icono: <Receipt className="w-6 h-6" />,
            color: 'from-blue-500 to-indigo-500',
            bg: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            titulo: 'Deliverys',
            valor: formatNumber(resumen.deliverys),
            cambio: `${resumen.deliverysEnRuta || 0} en ruta`,
            icono: <Truck className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500',
            bg: 'bg-purple-50',
            textColor: 'text-purple-600',
        },
        {
            titulo: 'Total cobrado hoy',
            valor: formatCurrency(resumen.totalCobradoHoy || 0),
            cambio: resumen.cajaAbierta ? '✅ Caja abierta' : '❌ Caja cerrada',
            icono: <CreditCard className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-50',
            textColor: 'text-green-600',
        },
    ];

    return (
        <>
            <Head title="Reportes - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-3xl p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A] flex items-center gap-3">
                            Reportes Generales
                        </h1>
                        <p className="text-[#5A3D2B] text-sm mt-1 ml-1">Análisis de ventas, clientes y rendimiento</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm hover:shadow-lg active:scale-95">
                            <Printer className="w-4 h-4" />
                            Generar PDF
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm hover:shadow-lg active:scale-95">
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {/* ===== FILTRO DE FECHA ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8] flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F3E1C8] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-[#5A3D2B]">Filtrar por fecha:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            type="date"
                            className="border border-[#E8D5C4] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white transition
            [&::-webkit-calendar-picker-indicator]:!opacity-100
            [&::-webkit-calendar-picker-indicator]:!cursor-pointer
            [&::-webkit-calendar-picker-indicator]:!bg-gray-400
            [&::-webkit-calendar-picker-indicator]:!rounded-md
            [&::-webkit-calendar-picker-indicator]:!p-0.5
            [&::-webkit-calendar-picker-indicator]:!w-5
            [&::-webkit-calendar-picker-indicator]:!h-5
            [&::-webkit-calendar-picker-indicator]:hover:!bg-gray-500"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <span className="text-[#5A3D2B] text-sm font-medium">a</span>
                        <input
                            type="date"
                            className="border border-[#E8D5C4] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A] bg-white transition
            [&::-webkit-calendar-picker-indicator]:!opacity-100
            [&::-webkit-calendar-picker-indicator]:!cursor-pointer
            [&::-webkit-calendar-picker-indicator]:!bg-gray-400
            [&::-webkit-calendar-picker-indicator]:!rounded-md
            [&::-webkit-calendar-picker-indicator]:!p-0.5
            [&::-webkit-calendar-picker-indicator]:!w-5
            [&::-webkit-calendar-picker-indicator]:!h-5
            [&::-webkit-calendar-picker-indicator]:hover:!bg-gray-500"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                        <button className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2 rounded-lg text-sm font-medium transition hover:shadow-md active:scale-95">
                            Aplicar filtro
                        </button>
                    </div>
                </div>

                {/* ===== TARJETAS DE RESUMEN ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {tarjetasResumen.map((tarjeta, index) => (
                        <div
                            key={index}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-[#5A3D2B] font-medium">{tarjeta.titulo}</p>
                                    <p className="text-2xl font-bold text-[#2D1B1A] mt-1">{tarjeta.valor}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tarjeta.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {tarjeta.icono}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-3">
                                <span className="text-sm font-medium text-[#8A5A2B]">{tarjeta.cambio}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== RESUMEN DE VENTAS ===== */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <div className="flex flex-wrap justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-[#C9A96E]" />
                            Resumen de Ventas
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#5A3D2B]">
                                Total del día: <span className="font-semibold text-[#2D1B1A]">{formatCurrency(resumen.ventasDia || 0)}</span>
                            </span>
                            <span className="text-[#5A3D2B]">
                                Tickets: <span className="font-semibold text-[#2D1B1A]">{ventasDelDiaDetalleData.length}</span>
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-[#F3E1C8] bg-[#FBF7F0]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Mesa</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Producto</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Total</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Método de Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasDelDiaDetalleData.length > 0 ? (
                                    ventasDelDiaDetalleData.map((venta: VentaDetalle, index: number) => (
                                        <tr key={index} className="border-b border-[#FBF3E7] hover:bg-[#FBF7F0] transition group">
                                            <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{venta.fecha}</td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">
                                                <span className="inline-flex items-center gap-1.5 bg-[#F3E1C8] px-2.5 py-1 rounded-lg text-xs font-medium">
                                                    🪑 {venta.mesa}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">{venta.producto}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-[#2D1B1A]">{formatCurrency(venta.total)}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getMetodoColor(venta.metodo_pago)}`}>
                                                    {getMetodoIcon(venta.metodo_pago)}
                                                    <span className="ml-1">{venta.metodo_pago}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt className="w-10 h-10 text-gray-300" />
                                                <span>Sin ventas registradas hoy</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== DOS COLUMNAS ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Productos más vendidos */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5 flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-500" />
                            Productos más vendidos
                        </h2>
                        <div className="space-y-4">
                            {productosMasVendidos.map((producto: ProductoVendido, index: number) => {
                                const maxVentas = productosMasVendidos[0]?.cantidad || 1;
                                const porcentaje = maxVentas > 0 ? (producto.cantidad / maxVentas) * 100 : 0;
                                return (
                                    <div key={index} className="group">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="w-8 h-8 rounded-lg bg-[#F3E1C8] flex items-center justify-center flex-shrink-0">
                                                {getProductoIcon(producto.nombre)}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-[#2D1B1A] group-hover:text-[#C9A96E] transition">{producto.nombre}</span>
                                                    <span className="text-[#C9A96E] font-semibold">{producto.cantidad}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-[#F3E1C8] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700 group-hover:opacity-80"
                                                style={{ width: `${porcentaje}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Métodos de pago */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                            Métodos de pago
                        </h2>
                        <div className="space-y-4">
                            {metodosPago.map((metodo: MetodoPago, index: number) => (
                                <div key={index} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-[#2D1B1A] flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-[#F3E1C8] flex items-center justify-center">
                                                {getMetodoIcon(metodo.metodo)}
                                            </span>
                                            {metodo.metodo}
                                        </span>
                                        <span className="text-[#2D1B1A] font-semibold">{formatCurrency(metodo.total)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-[#F3E1C8] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all duration-700 group-hover:opacity-80"
                                                style={{ width: `${metodo.porcentaje || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-[#5A3D2B] min-w-[40px] text-right">{metodo.porcentaje || 0}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t-2 border-[#F3E1C8]">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5A3D2B] font-medium">Total ingresos</span>
                                <span className="font-bold text-[#2D1B1A] text-lg">{formatCurrency(metodosPago.reduce((sum: number, m: MetodoPago) => sum + m.total, 0))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN RÁPIDO ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group bg-gradient-to-br from-[#2D1B1A] to-[#4A2C2A] rounded-2xl p-5 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <p className="text-white/60 text-sm flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Ventas totales
                        </p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.totalVentas || 0)}</p>
                        <p className="text-white/40 text-xs mt-1">Período seleccionado</p>
                    </div>
                    <div className="group bg-gradient-to-br from-[#C9A96E] to-[#B8975D] rounded-2xl p-5 text-[#2D1B1A] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <p className="text-[#2D1B1A]/60 text-sm flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            Ticket promedio
                        </p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.ticketPromedio || 0)}</p>
                        <p className="text-[#2D1B1A]/40 text-xs mt-1">Por pedido</p>
                    </div>
                    <div className="group bg-gradient-to-br from-green-700 to-green-800 rounded-2xl p-5 text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <p className="text-white/60 text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Ganancia total
                        </p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.totalGanancia || 0)}</p>
                        <p className="text-white/40 text-xs mt-1">Margen: {totales.margenGanancia || 0}%</p>
                    </div>
                </div>

                {/* ===== TICKETS POR MESA ===== */}
                {ticketsPorMesaData.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5 flex items-center gap-2">
                            <Store className="w-5 h-5 text-orange-500" />
                            Tickets por Mesa
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {ticketsPorMesaData.map((item: TicketMesa, index: number) => (
                                <div key={index} className="group bg-[#FBF7F0] rounded-xl p-4 text-center border border-[#F3E1C8] hover:border-[#C9A96E] hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                    <p className="text-xs text-[#8D6B53] font-medium">Mesa {item.mesa}</p>
                                    <p className="text-3xl font-bold text-[#2D1B1A] group-hover:text-[#C9A96E] transition">{item.tickets}</p>
                                    <p className="text-[10px] text-[#8D6B53]">tickets</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}