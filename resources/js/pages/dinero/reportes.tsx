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
    ArrowDown
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
    // Recibir datos del backend
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

    // Usar datos del backend o datos por defecto
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

    return (
        <>
            <Head title="Reportes - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-3xl p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">📊 Reportes Generales</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Análisis de ventas, clientes y rendimiento</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <Printer className="w-4 h-4" />
                            Generar PDF
                        </button>
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {/* ===== FILTRO DE FECHA ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8] flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#5A3D2B]" />
                        <span className="text-sm font-medium text-[#5A3D2B]">Filtrar por fecha:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            type="date"
                            className="border border-[#F3E1C8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A]"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <span className="text-[#5A3D2B] text-sm">a</span>
                        <input
                            type="date"
                            className="border border-[#F3E1C8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A]"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                        <button className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            Aplicar filtro
                        </button>
                    </div>
                </div>

                {/* ===== TARJETAS DE RESUMEN ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Ventas del día</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatCurrency(resumen.ventasDia)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">+{resumen.ventasCambio}%</span>
                            <span className="text-sm text-[#5A3D2B]/60">vs ayer</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Tickets de hoy</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatNumber(resumen.ticketsHoy || 0)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Coffee className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <span className="text-sm text-[#8A5A2B] font-medium">{resumen.mesasOcupadas || 0} mesas ocupadas</span>
                            <span className="text-sm text-[#5A3D2B]/60">de {resumen.totalMesas || 0}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Deliverys</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatNumber(resumen.deliverys)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Truck className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <span className="text-sm text-[#8A5A2B] font-medium">{resumen.deliverysEnRuta || 0} en ruta</span>
                            <span className="text-sm text-[#5A3D2B]/60">ahora</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Total cobrado hoy</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatCurrency(resumen.totalCobradoHoy || 0)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <span className={`text-sm font-medium ${resumen.cajaAbierta ? 'text-green-600' : 'text-red-600'}`}>
                                {resumen.cajaAbierta ? '✅ Caja abierta' : '❌ Caja cerrada'}
                            </span>
                            {resumen.cajaEmpleado && (
                                <span className="text-sm text-[#5A3D2B]/60">· {resumen.cajaEmpleado}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN DE VENTAS ===== */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <div className="flex flex-wrap justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Resumen de Ventas</h2>
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
                                <tr className="border-b border-[#F3E1C8] bg-[#FBF3E7]/50">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Nro. Mesa</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Producto</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Total</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Método de Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasDelDiaDetalleData.length > 0 ? (
                                    ventasDelDiaDetalleData.map((venta: VentaDetalle, index: number) => (
                                        <tr key={index} className="border-b border-[#FBF3E7] hover:bg-[#FBF3E7]/50 transition">
                                            <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{venta.fecha}</td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">{venta.mesa}</td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">{venta.producto}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-[#2D1B1A]">{formatCurrency(venta.total)}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3E1C8] text-[#8A5A2B]">
                                                    {venta.metodo_pago}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                                            Sin ventas registradas hoy
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
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">🏆 Productos más vendidos</h2>
                        <div className="space-y-3">
                            {productosMasVendidos.map((producto: ProductoVendido, index: number) => {
                                const maxVentas = productosMasVendidos[0]?.cantidad || 1;
                                const porcentaje = maxVentas > 0 ? (producto.cantidad / maxVentas) * 100 : 0;
                                return (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="text-2xl">{producto.icono || '☕'}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-0.5">
                                                <span className="font-medium text-[#2D1B1A]">{producto.nombre}</span>
                                                <span className="text-[#C9A96E] font-semibold">{producto.cantidad}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#F3E1C8] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                                                    style={{ width: `${porcentaje}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Métodos de pago */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">💳 Métodos de pago</h2>
                        <div className="space-y-4">
                            {metodosPago.map((metodo: MetodoPago, index: number) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-[#2D1B1A]">{metodo.metodo}</span>
                                        <span className="text-[#2D1B1A] font-semibold">{formatCurrency(metodo.total)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-[#F3E1C8] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                                                style={{ width: `${metodo.porcentaje || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-[#5A3D2B]">{metodo.porcentaje || 0}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#F3E1C8]">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5A3D2B]">Total ingresos</span>
                                <span className="font-bold text-[#2D1B1A]">{formatCurrency(metodosPago.reduce((sum: number, m: MetodoPago) => sum + m.total, 0))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN RÁPIDO ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <p className="text-white/60 text-sm">Ventas totales</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.totalVentas || 0)}</p>
                        <p className="text-white/40 text-xs mt-1">Período seleccionado</p>
                    </div>
                    <div className="bg-[#C9A96E] rounded-2xl p-5 text-[#2D1B1A]">
                        <p className="text-[#2D1B1A]/60 text-sm">Ticket promedio</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.ticketPromedio || 0)}</p>
                        <p className="text-[#2D1B1A]/40 text-xs mt-1">Por pedido</p>
                    </div>
                    <div className="bg-green-700 rounded-2xl p-5 text-white">
                        <p className="text-white/60 text-sm">Ganancia total</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totales.totalGanancia || 0)}</p>
                        <p className="text-white/40 text-xs mt-1">Margen: {totales.margenGanancia || 0}%</p>
                    </div>
                </div>

                {/* ===== TICKETS POR MESA ===== */}
                {ticketsPorMesaData.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">🪑 Tickets por Mesa</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {ticketsPorMesaData.map((item: TicketMesa, index: number) => (
                                <div key={index} className="bg-[#FBF7F0] rounded-xl p-3 text-center border border-[#F3E1C8]">
                                    <p className="text-xs text-[#8D6B53] font-medium">Mesa {item.mesa}</p>
                                    <p className="text-2xl font-bold text-[#2D1B1A]">{item.tickets}</p>
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