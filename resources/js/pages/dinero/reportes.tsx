import { Head } from '@inertiajs/react';
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

export default function Reportes() {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const resumen = {
        ventasDia: 4820,
        ventasCambio: 12,
        clientes: 128,
        clientesNuevos: 8,
        deliverys: 36,
        deliverysEnRuta: 7,
        gananciaNeta: 1540,
        gananciaCambio: 15,
    };

    const ventasDiarias: VentaDiaria[] = [
        { fecha: '23/06/2026', tickets: 128, ventas: 4820, gastos: 1240, ganancia: 3580 },
        { fecha: '22/06/2026', tickets: 115, ventas: 4120, gastos: 1050, ganancia: 3070 },
        { fecha: '21/06/2026', tickets: 106, ventas: 3890, gastos: 980, ganancia: 2910 },
        { fecha: '20/06/2026', tickets: 98, ventas: 3560, gastos: 920, ganancia: 2640 },
        { fecha: '19/06/2026', tickets: 87, ventas: 3210, gastos: 850, ganancia: 2360 },
    ];

    const productosMasVendidos: ProductoVendido[] = [
        { nombre: 'Café Americano', cantidad: 56, icono: '☕' },
        { nombre: 'Cappuccino', cantidad: 44, icono: '☕' },
        { nombre: 'Cheesecake', cantidad: 31, icono: '🍰' },
        { nombre: 'Latte', cantidad: 28, icono: '☕' },
        { nombre: 'Croissant', cantidad: 22, icono: '🥐' },
    ];

    const metodosPago: MetodoPago[] = [
        { metodo: 'Efectivo', total: 2100, porcentaje: 44 },
        { metodo: 'Tarjeta', total: 1820, porcentaje: 38 },
        { metodo: 'Yape / Plin', total: 900, porcentaje: 18 },
    ];

    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toLocaleString('es-PE')}`;
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-PE');
    };

    const totalVentas = ventasDiarias.reduce((sum, v) => sum + v.ventas, 0);
    const totalGastos = ventasDiarias.reduce((sum, v) => sum + v.gastos, 0);
    const totalGanancia = ventasDiarias.reduce((sum, v) => sum + v.ganancia, 0);

    return (
        <>
            <Head title="Reportes - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-3xl p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]"> Reportes Generales</h1>
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
                                <p className="text-sm text-[#5A3D2B] font-medium">Clientes atendidos</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatNumber(resumen.clientes)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <span className="text-sm text-green-600 font-medium">+{resumen.clientesNuevos} nuevos</span>
                            <span className="text-sm text-[#5A3D2B]/60">hoy</span>
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
                            <span className="text-sm text-[#8A5A2B] font-medium">{resumen.deliverysEnRuta} en ruta</span>
                            <span className="text-sm text-[#5A3D2B]/60">ahora</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Ganancia neta</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatCurrency(resumen.gananciaNeta)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">+{resumen.gananciaCambio}%</span>
                            <span className="text-sm text-[#5A3D2B]/60">este mes</span>
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN DE VENTAS ===== */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <div className="flex flex-wrap justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Resumen de Ventas</h2>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#5A3D2B]">Total: <span className="font-semibold text-[#2D1B1A]">{formatCurrency(totalVentas)}</span></span>
                            <span className="text-[#5A3D2B]">Gastos: <span className="font-semibold text-red-600">{formatCurrency(totalGastos)}</span></span>
                            <span className="text-[#5A3D2B]">Ganancia: <span className="font-semibold text-green-600">{formatCurrency(totalGanancia)}</span></span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#F3E1C8] bg-[#FBF3E7]/50">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Tickets</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Ventas</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Gastos</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Ganancia</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Rendimiento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasDiarias.map((venta, index) => {
                                    const rendimiento = ((venta.ganancia / venta.ventas) * 100);
                                    return (
                                        <tr key={index} className="border-b border-[#FBF3E7] hover:bg-[#FBF3E7]/50 transition">
                                            <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{venta.fecha}</td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">{formatNumber(venta.tickets)}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{formatCurrency(venta.ventas)}</td>
                                            <td className="py-3 px-4 text-sm text-red-600">{formatCurrency(venta.gastos)}</td>
                                            <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(venta.ganancia)}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-[#F3E1C8] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[#C9A96E] rounded-full" 
                                                            style={{ width: `${Math.min(rendimiento, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-[#5A3D2B]">{rendimiento.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                            {productosMasVendidos.map((producto, index) => {
                                const maxVentas = productosMasVendidos[0]?.cantidad || 1;
                                const porcentaje = (producto.cantidad / maxVentas) * 100;
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
                            {metodosPago.map((metodo, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-[#2D1B1A]">{metodo.metodo}</span>
                                        <span className="text-[#2D1B1A] font-semibold">{formatCurrency(metodo.total)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-[#F3E1C8] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                                                style={{ width: `${metodo.porcentaje}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-[#5A3D2B]">{metodo.porcentaje}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#F3E1C8]">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#5A3D2B]">Total ingresos</span>
                                <span className="font-bold text-[#2D1B1A]">{formatCurrency(metodosPago.reduce((sum, m) => sum + m.total, 0))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN RÁPIDO ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <p className="text-white/60 text-sm">Ventas totales</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totalVentas)}</p>
                        <p className="text-white/40 text-xs mt-1">Últimos 5 días</p>
                    </div>
                    <div className="bg-[#C9A96E] rounded-2xl p-5 text-[#2D1B1A]">
                        <p className="text-[#2D1B1A]/60 text-sm">Ticket promedio</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totalVentas / ventasDiarias.reduce((sum, v) => sum + v.tickets, 0))}</p>
                        <p className="text-[#2D1B1A]/40 text-xs mt-1">Por pedido</p>
                    </div>
                    <div className="bg-green-700 rounded-2xl p-5 text-white">
                        <p className="text-white/60 text-sm">Ganancia total</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totalGanancia)}</p>
                        <p className="text-white/40 text-xs mt-1">Margen: {((totalGanancia / totalVentas) * 100).toFixed(1)}%</p>
                    </div>
                </div>
            </div>
        </>
    );
}