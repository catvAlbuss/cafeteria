import { Head, usePage } from '@inertiajs/react';
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
    Eye,
    Banknote,
    Smartphone,
    Landmark,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface VentaDiaria {
    fecha: string;
    tickets: number;
    ventas: number;
    gastos: number;
    ganancia: number;
}
interface ProductoDetalle {
    nombre: string;
    cantidad: number;
    subtotal?: number;
    precio?: number;
}

interface VentaDetalle {
    fecha: string;
    mesa: string;
    producto: string;
    total: number;
    metodo_pago: string;
    productosDetalle?: ProductoDetalle[];
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
        ticketsPorOrigen: ticketsPorOrigenData = [],
        estadoMesas: estadoMesasData = { total: 0, ocupadas: 0, libres: 0 },
        fechas: fechasData = { inicio: '', fin: '' },
        error = null,
    } = props as any;

    const [modalDetalleVentaAbierto, setModalDetalleVentaAbierto] =
        useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
    const verDetalleVenta = (venta: any) => {
        setVentaSeleccionada(venta);
        setModalDetalleVentaAbierto(true);
    };
    const [fechaInicio, setFechaInicio] = useState(fechasData.inicio || '');
    const [fechaFin, setFechaFin] = useState(fechasData.fin || '');
    const resumen = resumenData;
    const ventasDiarias: VentaDiaria[] =
        ventasDiariasData.length > 0
            ? ventasDiariasData
            : [
                  {
                      fecha: 'Sin datos',
                      tickets: 0,
                      ventas: 0,
                      gastos: 0,
                      ganancia: 0,
                  },
              ];
    const productosMasVendidos =
        productosMasVendidosData.length > 0
            ? productosMasVendidosData
            : [{ nombre: 'Sin datos', cantidad: 0 }];
    const metodosPago =
        metodosPagoData.length > 0
            ? metodosPagoData
            : [{ metodo: 'Sin datos', total: 0, porcentaje: 0 }];
    const totales = totalesData;

    const formatCurrency = (amount: number | string): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(num)) {
            return 'S/ 0.00';
        }

        return `S/ ${num.toFixed(2)}`;
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-PE');
    };
    const exportarReporte = (formato: 'pdf' | 'excel') => {
        const params = new URLSearchParams();

        if (fechaInicio) {
            params.set('fecha_inicio', fechaInicio);
        }

        if (fechaFin) {
            params.set('fecha_fin', fechaFin);
        }

        params.set('formato', formato);

        window.open(`/reportes/export?${params.toString()}`, '_blank');
    };
    const totalVentas = ventasDiarias.reduce(
        (sum: number, v) => sum + v.ventas,
        0,
    );
    const totalGastos = ventasDiarias.reduce(
        (sum: number, v) => sum + v.gastos,
        0,
    );
    const totalGanancia = ventasDiarias.reduce(
        (sum: number, v) => sum + v.ganancia,
        0,
    );
    const totalTickets = ventasDiarias.reduce(
        (sum: number, v) => sum + v.tickets,
        0,
    );

    // Colores para métodos de pago
    const getMetodoColor = (metodo: string) => {
        const colores: Record<string, string> = {
            efectivo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            tarjeta: 'bg-blue-100 text-blue-700 border-blue-200',
            yape: 'bg-purple-100 text-purple-700 border-purple-200',
            plin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            transferencia: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        };

        return (
            colores[metodo.toLowerCase()] || 'bg-sand text-cocoa border-wheat'
        );
    };

    const getMetodoIcon = (metodo: string) => {
        const metodoLower = metodo.toLowerCase();

        switch (metodoLower) {
            case 'efectivo':
                return <Banknote className="h-4 w-4" />;
            case 'tarjeta':
                return <CreditCard className="h-4 w-4" />;
            case 'yape':
                return <Smartphone className="h-4 w-4" />;
            case 'plin':
                return <Smartphone className="h-4 w-4" />;
            case 'transferencia':
                return <Landmark className="h-4 w-4" />;
            default:
                return <Wallet className="h-4 w-4" />;
        }
    };

    // Íconos para productos
    const getProductoIcon = (nombre: string) => {
        const nombreLower = nombre.toLowerCase();

        // Café y bebidas calientes
        if (
            nombreLower.includes('café') ||
            nombreLower.includes('espresso') ||
            nombreLower.includes('cappuccino') ||
            nombreLower.includes('latte') ||
            nombreLower.includes('americano') ||
            nombreLower.includes('mocha')
        ) {
            return <Coffee className="h-5 w-5 text-amber-700" />;
        }

        if (
            nombreLower.includes('té') ||
            nombreLower.includes('matcha') ||
            nombreLower.includes('chai')
        ) {
            return <CupSoda className="h-5 w-5 text-green-600" />;
        }

        if (
            nombreLower.includes('chocolate') ||
            nombreLower.includes('frappé') ||
            nombreLower.includes('frappe')
        ) {
            return <Coffee className="h-5 w-5 text-amber-800" />;
        }

        // Postres y dulces
        if (
            nombreLower.includes('cheesecake') ||
            nombreLower.includes('torta') ||
            nombreLower.includes('pastel')
        ) {
            return <Cake className="h-5 w-5 text-pink-500" />;
        }

        if (
            nombreLower.includes('helado') ||
            nombreLower.includes('ice cream')
        ) {
            return <IceCream className="h-5 w-5 text-blue-400" />;
        }

        if (
            nombreLower.includes('brownie') ||
            nombreLower.includes('cookie') ||
            nombreLower.includes('galleta')
        ) {
            return <Cookie className="h-5 w-5 text-amber-600" />;
        }

        if (
            nombreLower.includes('croissant') ||
            nombreLower.includes('pan') ||
            nombreLower.includes('bagel')
        ) {
            return <Croissant className="h-5 w-5 text-amber-500" />;
        }

        if (
            nombreLower.includes('tiramisú') ||
            nombreLower.includes('flan') ||
            nombreLower.includes('pudín') ||
            nombreLower.includes('pudin')
        ) {
            return <ChefHat className="h-5 w-5 text-amber-500" />;
        }

        // Platos principales
        if (
            nombreLower.includes('hamburguesa') ||
            nombreLower.includes('burger')
        ) {
            return <Sandwich className="h-5 w-5 text-red-600" />;
        }

        if (nombreLower.includes('pizza')) {
            return <Pizza className="h-5 w-5 text-red-600" />;
        }

        if (nombreLower.includes('sopa') || nombreLower.includes('crema')) {
            return <Soup className="h-5 w-5 text-amber-600" />;
        }

        if (nombreLower.includes('ensalada') || nombreLower.includes('salad')) {
            return <Salad className="h-5 w-5 text-green-500" />;
        }

        if (
            nombreLower.includes('carne') ||
            nombreLower.includes('steak') ||
            nombreLower.includes('res')
        ) {
            return <Beef className="h-5 w-5 text-red-700" />;
        }

        if (
            nombreLower.includes('pescado') ||
            nombreLower.includes('fish') ||
            nombreLower.includes('salmon')
        ) {
            return <Fish className="h-5 w-5 text-blue-500" />;
        }

        if (nombreLower.includes('pollo') || nombreLower.includes('chicken')) {
            return <Egg className="h-5 w-5 text-amber-500" />;
        }

        // Bebidas frías
        if (
            nombreLower.includes('jugo') ||
            nombreLower.includes('smoothie') ||
            nombreLower.includes('batido')
        ) {
            return <GlassWater className="h-5 w-5 text-orange-500" />;
        }

        if (
            nombreLower.includes('gaseosa') ||
            nombreLower.includes('soda') ||
            nombreLower.includes('refresco')
        ) {
            return <CupSoda className="h-5 w-5 text-blue-500" />;
        }

        if (
            nombreLower.includes('cerveza') ||
            nombreLower.includes('vino') ||
            nombreLower.includes('licor') ||
            nombreLower.includes('coctel')
        ) {
            return <Martini className="h-5 w-5 text-purple-500" />;
        }

        return <Utensils className="h-5 w-5 text-cocoa" />;
    };

    // Tarjetas de resumen
    const tarjetasResumen = [
        {
            titulo: 'Ventas del día',
            valor: formatCurrency(resumen.ventasDia),
            cambio: `+${resumen.ventasCambio}%`,
            icono: <DollarSign className="h-6 w-6" />,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            textColor: 'text-amber-600',
        },
        {
            titulo: 'Tickets de hoy',
            valor: formatNumber(resumen.ticketsHoy || 0),
            cambio: `${resumen.mesasOcupadas || 0} mesas ocupadas`,
            icono: <Receipt className="h-6 w-6" />,
            color: 'from-blue-500 to-indigo-500',
            bg: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            titulo: 'Deliverys',
            valor: formatNumber(resumen.deliverys),
            cambio: `${resumen.deliverysEnRuta || 0} en ruta`,
            icono: <Truck className="h-6 w-6" />,
            color: 'from-purple-500 to-pink-500',
            bg: 'bg-purple-50',
            textColor: 'text-purple-600',
        },
        {
            titulo: 'Total cobrado hoy',
            valor: formatCurrency(resumen.totalCobradoHoy || 0),
            cambio: resumen.cajaAbierta ? 'Caja abierta' : 'Caja cerrada',
            icono: <CreditCard className="h-6 w-6" />,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-50',
            textColor: 'text-green-600',
        },
    ];

    return (
        <>
            <Head title="Reportes - Dolce Cafe" />
            <div className="min-h-screen space-y-4 bg-cream p-4 md:p-6">
                {/* ===== HEADER ===== */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-chocolate">
                            Reportes Generales
                        </h1>
                        <p className="mt-1 ml-1 text-sm text-cocoa">
                            Análisis de ventas, clientes y rendimiento
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => exportarReporte('pdf')}
                            className="inline-flex items-center gap-2 rounded-xl bg-roast px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-ink hover:shadow-lg active:scale-95"
                        >
                            <Printer className="h-4 w-4" />
                            Generar PDF
                        </button>
                        <button
                            onClick={() => exportarReporte('excel')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {/* ===== FILTRO DE FECHA ===== */}
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand">
                            <Calendar className="h-4 w-4 text-cocoa" />
                        </div>
                        <span className="text-sm font-medium text-cocoa">
                            Filtrar por fecha:
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            className="rounded-xl border border-wheat bg-card px-3 py-2 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold [&::-webkit-calendar-picker-indicator]:!h-5 [&::-webkit-calendar-picker-indicator]:!w-5 [&::-webkit-calendar-picker-indicator]:!cursor-pointer [&::-webkit-calendar-picker-indicator]:!rounded-md [&::-webkit-calendar-picker-indicator]:!bg-cocoa/80 [&::-webkit-calendar-picker-indicator]:!p-0.5 [&::-webkit-calendar-picker-indicator]:!opacity-100 [&::-webkit-calendar-picker-indicator]:hover:!bg-cocoa"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <span className="text-sm font-medium text-cocoa">
                            a
                        </span>
                        <input
                            type="date"
                            className="rounded-xl border border-wheat bg-card px-3 py-2 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold [&::-webkit-calendar-picker-indicator]:!h-5 [&::-webkit-calendar-picker-indicator]:!w-5 [&::-webkit-calendar-picker-indicator]:!cursor-pointer [&::-webkit-calendar-picker-indicator]:!rounded-md [&::-webkit-calendar-picker-indicator]:!bg-cocoa/80 [&::-webkit-calendar-picker-indicator]:!p-0.5 [&::-webkit-calendar-picker-indicator]:!opacity-100 [&::-webkit-calendar-picker-indicator]:hover:!bg-cocoa"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                        <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-ink transition hover:bg-gold-deep hover:shadow-md active:scale-95">
                            Aplicar filtro
                        </button>
                    </div>
                </div>

                {/* ===== TARJETAS DE RESUMEN ===== */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {tarjetasResumen.map((tarjeta, index) => (
                        <div
                            key={index}
                            className="group cursor-default rounded-2xl border border-sand bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-cocoa">
                                        {tarjeta.titulo}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-chocolate">
                                        {tarjeta.valor}
                                    </p>
                                </div>
                                <div
                                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tarjeta.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                                >
                                    {tarjeta.icono}
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1">
                                <span className="text-sm font-medium text-cinnamon">
                                    {tarjeta.cambio}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* ===== RESUMEN DE VENTAS ===== */}
                <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Receipt className="h-5 w-5 text-gold" />
                            Resumen de Ventas
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-cocoa">
                                Total del día:{' '}
                                <span className="font-semibold text-chocolate">
                                    {formatCurrency(resumen.ventasDia || 0)}
                                </span>
                            </span>
                            <span className="text-cocoa">
                                Tickets:{' '}
                                <span className="font-semibold text-chocolate">
                                    {ventasDelDiaDetalleData.length}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Mesa/Caja
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Producto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Método de Pago
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasDelDiaDetalleData.length > 0 ? (
                                    ventasDelDiaDetalleData.map(
                                        (
                                            venta: VentaDetalle,
                                            index: number,
                                        ) => (
                                            <tr
                                                key={index}
                                                className="group border-b border-cream-soft transition hover:bg-cream"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-chocolate">
                                                    {venta.fecha}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-cocoa">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                                                            venta.mesa ===
                                                            'Caja'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-sand text-cocoa'
                                                        }`}
                                                    >
                                                        {venta.mesa}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-cocoa">
                                                    {venta.producto}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-chocolate">
                                                    {formatCurrency(
                                                        venta.total,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getMetodoColor(venta.metodo_pago)}`}
                                                    >
                                                        {getMetodoIcon(
                                                            venta.metodo_pago,
                                                        )}
                                                        <span className="ml-1">
                                                            {venta.metodo_pago}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => {
                                                            const productosDetalle =
                                                                venta.productosDetalle ||
                                                                [];
                                                            verDetalleVenta({
                                                                ...venta,
                                                                productosDetalle,
                                                            });
                                                        }}
                                                        className="rounded-lg bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100 hover:text-blue-800"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-10 text-center text-sm text-cocoa-soft"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt className="h-10 w-10 text-cocoa-soft" />
                                                <span>
                                                    Sin ventas registradas hoy
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* ===== DOS COLUMNAS ===== */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Productos más vendidos */}
                    <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Package className="h-5 w-5 text-amber-500" />
                            Productos más vendidos
                        </h2>
                        <div className="space-y-4">
                            {productosMasVendidos.map(
                                (producto: ProductoVendido, index: number) => {
                                    const maxVentas =
                                        productosMasVendidos[0]?.cantidad || 1;
                                    const porcentaje =
                                        maxVentas > 0
                                            ? (producto.cantidad / maxVentas) *
                                              100
                                            : 0;

                                    return (
                                        <div key={index} className="group">
                                            <div className="mb-1 flex items-center gap-3">
                                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sand">
                                                    {getProductoIcon(
                                                        producto.nombre,
                                                    )}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-chocolate transition group-hover:text-gold">
                                                            {producto.nombre}
                                                        </span>
                                                        <span className="font-semibold text-gold">
                                                            {producto.cantidad}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 group-hover:opacity-80"
                                                    style={{
                                                        width: `${porcentaje}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>

                    {/* Métodos de pago */}
                    <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-chocolate">
                            <CreditCard className="h-5 w-5 text-purple-500" />
                            Métodos de pago
                        </h2>
                        <div className="space-y-4">
                            {metodosPago.map(
                                (metodo: MetodoPago, index: number) => (
                                    <div key={index} className="group">
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="flex items-center gap-2 font-medium text-chocolate">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sand">
                                                    {getMetodoIcon(
                                                        metodo.metodo,
                                                    )}
                                                </span>
                                                {metodo.metodo}
                                            </span>
                                            <span className="font-semibold text-chocolate">
                                                {formatCurrency(metodo.total)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-700 group-hover:opacity-80"
                                                    style={{
                                                        width: `${metodo.porcentaje || 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="min-w-[40px] text-right text-xs font-medium text-cocoa">
                                                {metodo.porcentaje || 0}%
                                            </span>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                        <div className="mt-4 border-t-2 border-sand pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-cocoa">
                                    Total ingresos
                                </span>
                                <span className="text-lg font-bold text-chocolate">
                                    {formatCurrency(
                                        metodosPago.reduce(
                                            (sum: number, m: MetodoPago) => {
                                                const total =
                                                    typeof m.total === 'string'
                                                        ? parseFloat(m.total)
                                                        : m.total;

                                                return (
                                                    sum +
                                                    (isNaN(total) ? 0 : total)
                                                );
                                            },
                                            0,
                                        ),
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ===== RESUMEN RÁPIDO ===== */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="group rounded-2xl bg-gradient-to-br from-roast to-espresso p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <p className="flex items-center gap-2 text-sm text-white/60">
                            <DollarSign className="h-4 w-4" />
                            Ventas totales
                        </p>
                        <p className="mt-1 text-3xl font-bold">
                            {formatCurrency(totales.totalVentas || 0)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Período seleccionado
                        </p>
                    </div>
                    <div className="group rounded-2xl bg-gradient-to-br from-gold to-gold-deep p-5 text-chocolate transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <p className="flex items-center gap-2 text-sm text-chocolate/60">
                            <Receipt className="h-4 w-4" />
                            Ticket promedio
                        </p>
                        <p className="mt-1 text-3xl font-bold">
                            {formatCurrency(totales.ticketPromedio || 0)}
                        </p>
                        <p className="mt-1 text-xs text-chocolate/40">
                            Por pedido
                        </p>
                    </div>
                    <div className="group rounded-2xl bg-gradient-to-br from-green-700 to-green-800 p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <p className="flex items-center gap-2 text-sm text-white/60">
                            <TrendingUp className="h-4 w-4" />
                            Ganancia total
                        </p>
                        <p className="mt-1 text-3xl font-bold">
                            {formatCurrency(totales.totalGanancia || 0)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                            Margen: {totales.margenGanancia || 0}%
                        </p>
                    </div>
                </div>
                {/* ===== TICKETS EMITIDOS ===== */}
                {ticketsPorOrigenData.length > 0 && (
                    <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Store className="h-5 w-5 text-orange-500" />
                            Tickets emitidos
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {ticketsPorOrigenData.map(
                                (
                                    item: { origen: string; tickets: number },
                                    index: number,
                                ) => (
                                    <div
                                        key={index}
                                        className="group rounded-xl border border-sand bg-cream p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-md"
                                    >
                                        <p className="text-xs font-medium text-cocoa-soft">
                                            {item.origen}
                                        </p>
                                        <p className="text-3xl font-bold text-chocolate transition group-hover:text-gold">
                                            {item.tickets}
                                        </p>
                                        <p className="text-[10px] text-cocoa-soft">
                                            tickets
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* ===== MODAL DETALLE VENTA ===== */}
            {modalDetalleVentaAbierto && ventaSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-3xl bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-sand p-6">
                            <h2 className="flex items-center gap-2 text-2xl font-bold text-chocolate">
                                <Eye className="h-6 w-6 text-blue-500" />
                                Detalle de Venta
                            </h2>
                            <button
                                onClick={() =>
                                    setModalDetalleVentaAbierto(false)
                                }
                                className="text-3xl text-cocoa-soft transition hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-cocoa-soft">
                                        Fecha
                                    </p>
                                    <p className="font-semibold text-chocolate">
                                        {ventaSeleccionada.fecha}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-cocoa-soft">
                                        Origen
                                    </p>
                                    <p className="font-semibold text-chocolate">
                                        {ventaSeleccionada.mesa}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-cocoa-soft">
                                        Método de Pago
                                    </p>
                                    <p className="font-semibold text-chocolate">
                                        {ventaSeleccionada.metodo_pago}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-cocoa-soft">
                                        Total
                                    </p>
                                    <p className="text-lg font-bold text-gold">
                                        {formatCurrency(
                                            ventaSeleccionada.total,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-sand pt-4">
                                <p className="mb-2 text-xs text-cocoa-soft">
                                    Productos
                                </p>
                                <div className="space-y-2">
                                    {ventaSeleccionada.productosDetalle &&
                                    ventaSeleccionada.productosDetalle.length >
                                        0 ? (
                                        ventaSeleccionada.productosDetalle.map(
                                            (item: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded-xl bg-cream px-4 py-2"
                                                >
                                                    <div>
                                                        <p className="font-medium text-chocolate">
                                                            {item.nombre}
                                                        </p>
                                                        <p className="text-xs text-cocoa-soft">
                                                            Cantidad:{' '}
                                                            {item.cantidad}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-chocolate">
                                                        {formatCurrency(
                                                            item.subtotal ||
                                                                item.precio *
                                                                    item.cantidad,
                                                        )}
                                                    </p>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <p className="text-sm text-cocoa-soft">
                                            No hay productos disponibles
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* DESGLOSE DE TOTALES CON IGV */}
                            <div className="space-y-1 border-t border-sand pt-3">
                                {(() => {
                                    const totalDetalle =
                                        ventaSeleccionada.productosDetalle.reduce(
                                            (sum: number, item: any) =>
                                                sum +
                                                (item.subtotal ||
                                                    item.precio *
                                                        item.cantidad),
                                            0,
                                        );
                                    const base =
                                        Math.round(
                                            (totalDetalle / 1.18) * 100,
                                        ) / 100;
                                    const igvDetalle =
                                        Math.round(
                                            (totalDetalle - base) * 100,
                                        ) / 100;

                                    return (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-cocoa">
                                                    Subtotal
                                                </span>
                                                <span className="font-medium text-chocolate">
                                                    {formatCurrency(base)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-cocoa">
                                                    IGV (18%)
                                                </span>
                                                <span className="font-medium text-chocolate">
                                                    {formatCurrency(igvDetalle)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t-2 border-gold/30 pt-2">
                                                <span className="text-lg font-bold text-chocolate">
                                                    TOTAL
                                                </span>
                                                <span className="text-lg font-bold text-gold">
                                                    {formatCurrency(
                                                        totalDetalle,
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-sand p-6">
                            <button
                                onClick={() =>
                                    setModalDetalleVentaAbierto(false)
                                }
                                className="rounded-xl bg-sand px-5 py-2.5 font-semibold text-chocolate transition hover:bg-wheat"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
