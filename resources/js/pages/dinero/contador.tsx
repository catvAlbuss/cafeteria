import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import {
    Calculator,
    TrendingUp,
    Wallet,
    Clock,
    CheckCircle,
    Printer,
    FileSpreadsheet,
    Plus,
    X,
    Eye,
    Trash2,
    Search,
    User,
    Calendar,
    Banknote,
    CreditCard,
    Smartphone,
    Landmark,
    Receipt,
    Store,
    Package,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    DollarSign,
    Users,
    Truck,
    Coffee,
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
    Lock
} from 'lucide-react';

interface RegistroCaja {
    id: number;
    caja: string;
    empleado: string;
    turno: 'Mañana' | 'Tarde' | 'Noche';
    monto_inicial: number;
    fecha_apertura: string;
    monto_final: number | null;
    ventas_dia: number | null;
    observaciones: string;
    fecha_cierre: string | null;
    estado: 'Abierta' | 'Cerrada';
}

export default function Contador() {
    const {
        cajas = [],
        cajaActual = null,
        resumen = { ingresos: 0, cajaActual: 0 },
        movimientos = [],
        ingresosDetalle = [],
        estadisticas = { totalPedidosHoy: 0, totalCajasAbiertas: 0, totalCajasCerradas: 0 },
        auth,
    } = usePage().props as any;
    const empleadoActual = auth?.user?.name ?? 'Usuario actual';

    const [registros, setRegistros] = useState<RegistroCaja[]>(cajas);
    const [cajaActiva, setCajaActiva] = useState<RegistroCaja | null>(cajaActual);
    const [modalAperturaAbierto, setModalAperturaAbierto] = useState(false);
    const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroCaja | null>(null);

    const [formApertura, setFormApertura] = useState({
        caja: 'Caja 01',
        turno: 'Mañana' as 'Mañana' | 'Tarde' | 'Noche',
        montoInicial: 0,
    });

    const [formCierre, setFormCierre] = useState({
        montoFinal: 0,
        ventasDia: 0,
        observaciones: '',
    });

    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroEmpleado, setFiltroEmpleado] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    useEffect(() => {
        setRegistros(cajas);
        setCajaActiva(cajaActual);
    }, [cajas, cajaActual]);

    useSedeChannel('caja', {
        'caja.actualizada': () => {
            router.reload({ only: ['cajas', 'cajaActual', 'estadisticas'] });
        },
    });

    const formatCurrency = (amount: number | string): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num) || num === null || num === undefined) return 'S/ 0.00';
        return `S/ ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    const totalIngresosDetalle = ingresosDetalle.reduce((sum: number, i: any) => sum + (i.monto || 0), 0);
    const totalRegistros = registros.length;
    const cajasAbiertas = registros.filter(r => r.estado === 'Abierta').length;
    const cajasCerradas = registros.filter(r => r.estado === 'Cerrada').length;
    const montoTotal = registros.reduce((acc, r) => acc + (r.estado === 'Cerrada' ? (r.monto_final || 0) : r.monto_inicial), 0);

    const registrosFiltrados = registros.filter(r => {
        if (filtroEstado && r.estado !== filtroEstado) return false;
        if (filtroEmpleado && !r.empleado.toLowerCase().includes(filtroEmpleado.toLowerCase())) return false;
        if (fechaInicio) {
            const fecha = new Date(r.fecha_apertura);
            const fInicio = new Date(fechaInicio);
            fInicio.setHours(0, 0, 0, 0);
            if (fecha < fInicio) return false;
        }
        if (fechaFin) {
            const fecha = new Date(r.fecha_apertura);
            const fFin = new Date(fechaFin);
            fFin.setHours(23, 59, 59, 999);
            if (fecha > fFin) return false;
        }
        return true;
    });

    const abrirModalApertura = () => {
        setFormApertura({ caja: 'Caja 01', turno: 'Mañana', montoInicial: 0 });
        setModalAperturaAbierto(true);
    };

    const guardarApertura = () => {
        if (formApertura.montoInicial < 0) {
            alert('Complete todos los campos correctamente.');
            return;
        }

        router.post('/contador/abrir', formApertura, {
            onSuccess: () => {
                setModalAperturaAbierto(false);
                router.reload();
            },
            onError: (errors) => {
                alert('Error al abrir caja: ' + Object.values(errors).join(' '));
            }
        });
    };

    const abrirModalCierre = () => {
        const abierta = registros.find(r => r.estado === 'Abierta');
        if (!abierta) {
            alert('No hay cajas abiertas para cerrar.');
            return;
        }
        setRegistroSeleccionado(abierta);
        setFormCierre({ montoFinal: 0, ventasDia: 0, observaciones: '' });
        setModalCierreAbierto(true);
    };

    const guardarCierre = () => {
        if (!registroSeleccionado) return;
        if (formCierre.montoFinal < 0 || formCierre.ventasDia < 0) {
            alert('Complete los campos correctamente.');
            return;
        }

        router.post(`/contador/cerrar/${registroSeleccionado.id}`, formCierre, {
            onSuccess: () => {
                setModalCierreAbierto(false);
                router.reload();
            },
            onError: (errors) => {
                alert('Error al cerrar caja: ' + Object.values(errors).join(' '));
            }
        });
    };

    const verDetalle = (registro: RegistroCaja) => {
        setRegistroSeleccionado(registro);
        setModalDetalleAbierto(true);
    };

    const eliminarRegistro = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        router.delete(`/contador/${id}`, {
            onSuccess: () => router.reload(),
            onError: (errors) => {
                alert('Error al eliminar: ' + Object.values(errors).join(' '));
            }
        });
    };

    const tarjetasResumen = [
        {
            titulo: 'Ingresos del día',
            valor: formatCurrency(resumen.ingresos || 0),
            icono: <TrendingUp className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-50',
            textColor: 'text-green-600',
        },
        {
            titulo: 'Ventas totales',
            valor: formatCurrency(resumen.ingresos || 0),
            icono: <Calculator className="w-6 h-6" />,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50',
            textColor: 'text-amber-600',
        },
        {
            titulo: 'Caja actual',
            valor: formatCurrency(resumen.cajaActual || 0),
            icono: <Wallet className="w-6 h-6" />,
            color: 'from-purple-500 to-indigo-500',
            bg: 'bg-purple-50',
            textColor: 'text-purple-600',
        },
    ];

    return (
        <>
            <Head title="Contador - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-3xl p-6 bg-[#FBF3E7]">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A] flex items-center gap-3">
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-xl text-white">
                                💰
                            </span>
                            Contador
                        </h1>
                        <p className="text-[#5A3D2B] text-sm mt-1 ml-1">Control financiero, apertura y cierre de caja</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {!cajaActiva ? (
                            <button
                                onClick={abrirModalApertura}
                                className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold hover:shadow-lg active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Abrir Caja
                            </button>
                        ) : (
                            <button
                                onClick={abrirModalCierre}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold hover:shadow-lg active:scale-95"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Cerrar Caja
                            </button>
                        )}
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm hover:shadow-lg active:scale-95">
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar reporte
                        </button>
                    </div>
                </div>

                {/* CAJA ACTIVA */}
                {cajaActiva && (
                    <div className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3] rounded-2xl p-5 text-[#2D1B1A] flex flex-wrap items-center justify-between gap-3 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Caja abierta</p>
                                <p className="text-xs opacity-80">
                                    {cajaActiva.empleado} · {cajaActiva.turno} · {new Date(cajaActiva.fecha_apertura).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs opacity-80">Saldo inicial</p>
                                <p className="font-bold text-lg">{formatCurrency(cajaActiva.monto_inicial)}</p>
                            </div>
                            <span className="px-4 py-1.5 bg-green-600 text-white rounded-full text-xs font-bold shadow-md">
                                Activa
                            </span>
                        </div>
                    </div>
                )}

                {/* TARJETAS RESUMEN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                        </div>
                    ))}
                </div>

                {/* ESTADÍSTICAS RÁPIDAS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Registros', value: totalRegistros, color: 'text-[#2D1B1A]' },
                        { label: 'Cajas Abiertas', value: cajasAbiertas, color: 'text-green-600' },
                        { label: 'Cajas Cerradas', value: cajasCerradas, color: 'text-red-600' },
                        { label: 'Total Movido', value: formatCurrency(montoTotal), color: 'text-[#C9A96E]' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                            <p className="text-xs font-semibold text-gray-400 uppercase">{item.label}</p>
                            <p className={`text-2xl font-bold ${item.color} mt-1`}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* FILTROS */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 font-medium">Estado</label>
                            <select
                                className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="Abierta">Abierta</option>
                                <option value="Cerrada">Cerrada</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium">Empleado</label>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] placeholder-[#8D6B53] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition"
                                value={filtroEmpleado}
                                onChange={(e) => setFiltroEmpleado(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium">Desde</label>
                            <input
                                type="date"
                                className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:grayscale(0) [&::-webkit-calendar-picker-indicator]:filter-none"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium">Hasta</label>
                            <input
                                type="date"
                                className="mt-1 w-full border border-[#E8D5C4] rounded-xl p-2.5 text-sm text-[#2D1B1A] focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-white transition [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:grayscale(0) [&::-webkit-calendar-picker-indicator]:filter-none"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* TABLA HISTORIAL */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#C9A96E]" />
                            Historial de Aperturas y Cierres
                        </h2>
                        <button
                            onClick={() => window.print()}
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-4 py-2 rounded-xl text-sm font-semibold transition hover:shadow-md active:scale-95"
                        >
                            Imprimir
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF7F0] border-b-2 border-[#F3E1C8]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Caja</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Empleado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Turno</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Apertura</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Cierre</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FBF3E7]">
                                {registrosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-400 py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <Calculator className="w-10 h-10 text-gray-300" />
                                                <span>No hay registros</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrosFiltrados.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#FBF7F0] transition group">
                                            <td className="px-4 py-3 font-medium text-[#2D1B1A]">{r.caja}</td>
                                            <td className="px-4 py-3 text-[#5A3D2B]">{r.empleado}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 bg-[#F3E1C8] px-3 py-1 rounded-lg text-xs font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {r.turno}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#C9A96E]">{formatCurrency(r.monto_inicial)}</td>
                                            <td className="px-4 py-3">{r.monto_final !== null ? formatCurrency(r.monto_final) : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${r.estado === 'Abierta'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {r.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={() => verDetalle(r)}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        Ver
                                                    </button>
                                                    {r.estado === 'Abierta' && (
                                                        <button
                                                            onClick={abrirModalCierre}
                                                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Cerrar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => eliminarRegistro(r.id)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* INGRESOS DEL DÍA */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <h2 className="text-xl font-bold text-[#2D1B1A] mb-5 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Ingresos del día
                    </h2>
                    <div className="space-y-3">
                        {ingresosDetalle.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center border-b border-[#F3E1C8] pb-3 last:border-0 last:pb-0">
                                <span className="text-[#5A3D2B] font-medium">{item.concepto}</span>
                                <span className="font-semibold text-green-600">{formatCurrency(item.monto || 0)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t-2 border-[#C9A96E]/30">
                            <span className="font-bold text-[#2D1B1A] text-lg">Total ingresos</span>
                            <span className="font-bold text-green-700 text-lg">{formatCurrency(totalIngresosDetalle)}</span>
                        </div>
                    </div>
                </div>

                {/* MOVIMIENTOS RECIENTES */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A] flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-amber-500" />
                            Movimientos recientes
                        </h2>
                        <span className="text-xs text-[#5A3D2B] bg-[#FBF7F0] px-3 py-1 rounded-full font-medium">Últimas transacciones</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-[#F3E1C8] bg-[#FBF7F0]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Tipo</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Descripción</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Cliente</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Monto</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#5A3D2B] uppercase tracking-wider">Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-gray-400 py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt className="w-10 h-10 text-gray-300" />
                                                <span>No hay movimientos recientes</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientos.map((mov: any) => (
                                        <tr key={mov.id} className="border-b border-[#FBF3E7] hover:bg-[#FBF7F0] transition group">
                                            <td className="py-3 px-4 text-sm">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mov.tipo === 'ingreso'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {mov.tipo === 'ingreso' ? '⬆ Ingreso' : '⬇ Gasto'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{mov.descripcion}</td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B]">{mov.cliente || 'Anónimo'}</td>
                                            <td className={`py-3 px-4 text-sm font-semibold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {mov.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(mov.monto)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-[#5A3D2B] flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {mov.hora}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ACCIONES RÁPIDAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={cajaActiva ? abrirModalCierre : abrirModalApertura}
                        className={`p-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 font-semibold hover:shadow-lg active:scale-95 ${cajaActiva
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-[#C9A96E] hover:bg-[#B8975D] text-white'
                            }`}
                    >
                        {cajaActiva ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Cerrar caja
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Abrir caja
                            </>
                        )}
                    </button>
                    <button className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white p-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 font-semibold hover:shadow-lg active:scale-95">
                        <Printer className="w-5 h-5" />
                        Imprimir balance
                    </button>
                    <button className="bg-white hover:bg-[#FBF7F0] text-[#2D1B1A] p-4 rounded-2xl shadow-md border border-[#F3E1C8] transition flex items-center justify-center gap-2 font-semibold hover:shadow-lg active:scale-95">
                        <Eye className="w-5 h-5" />
                        Ver detalle completo
                    </button>
                </div>

                {/* ===== MODALES ===== */}
                {/* Modal Apertura */}
                {modalAperturaAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A] flex items-center gap-2">
                                    <Wallet className="w-6 h-6 text-[#C9A96E]" />
                                    Nueva Apertura
                                </h2>
                                <button onClick={() => setModalAperturaAbierto(false)} className="text-3xl text-gray-400 hover:text-red-500 transition">×</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Empleado</label>
                                    <p className="mt-1 w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-[#2D1B1A] font-medium">{empleadoActual}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Caja</label>
                                    <input type="text" className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formApertura.caja} onChange={(e) => setFormApertura({ ...formApertura, caja: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Turno</label>
                                    <select className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formApertura.turno} onChange={(e) => setFormApertura({ ...formApertura, turno: e.target.value as 'Mañana' | 'Tarde' | 'Noche' })}>
                                        <option value="Mañana">Mañana</option><option value="Tarde">Tarde</option><option value="Noche">Noche</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Monto Inicial (S/)</label>
                                    <input type="number" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formApertura.montoInicial} onChange={(e) => setFormApertura({ ...formApertura, montoInicial: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button onClick={() => setModalAperturaAbierto(false)} className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition">Cancelar</button>
                                <button onClick={guardarApertura} className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl font-semibold transition">Abrir Caja</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Cierre */}
                {modalCierreAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A] flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-red-500" />
                                    Cerrar Caja
                                </h2>
                                <button onClick={() => setModalCierreAbierto(false)} className="text-3xl text-gray-400 hover:text-red-500 transition">×</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-500">Caja</label><p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.caja}</p></div>
                                    <div><label className="text-xs text-gray-500">Empleado</label><p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.empleado}</p></div>
                                    <div><label className="text-xs text-gray-500">Turno</label><p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.turno}</p></div>
                                    <div><label className="text-xs text-gray-500">Monto Inicial</label><p className="font-semibold text-[#C9A96E]">{formatCurrency(registroSeleccionado.monto_inicial)}</p></div>
                                </div>
                                <div><label className="text-sm text-gray-500 font-medium">Monto Final (S/)</label><input type="number" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formCierre.montoFinal} onChange={(e) => setFormCierre({ ...formCierre, montoFinal: parseFloat(e.target.value) || 0 })} placeholder="0.00" /></div>
                                <div><label className="text-sm text-gray-500 font-medium">Ventas del Día (S/)</label><input type="number" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formCierre.ventasDia} onChange={(e) => setFormCierre({ ...formCierre, ventasDia: parseFloat(e.target.value) || 0 })} placeholder="0.00" /></div>
                                <div><label className="text-sm text-gray-500 font-medium">Observaciones</label><textarea rows={3} className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none bg-gray-50 transition" value={formCierre.observaciones} onChange={(e) => setFormCierre({ ...formCierre, observaciones: e.target.value })} placeholder="Observaciones del cierre..." /></div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button onClick={() => setModalCierreAbierto(false)} className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition">Cancelar</button>
                                <button onClick={guardarCierre} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold transition">Confirmar Cierre</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Detalle */}
                {modalDetalleAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A] flex items-center gap-2">
                                    <Eye className="w-6 h-6 text-blue-500" />
                                    Detalle del Registro
                                </h2>
                                <button onClick={() => setModalDetalleAbierto(false)} className="text-3xl text-gray-400 hover:text-red-500 transition">×</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-gray-400">Caja</p><p className="font-semibold">{registroSeleccionado.caja}</p></div>
                                    <div><p className="text-xs text-gray-400">Empleado</p><p className="font-semibold">{registroSeleccionado.empleado}</p></div>
                                    <div><p className="text-xs text-gray-400">Turno</p><p className="font-semibold">{registroSeleccionado.turno}</p></div>
                                    <div><p className="text-xs text-gray-400">Estado</p><span className={`px-3 py-0.5 rounded-full text-xs font-bold ${registroSeleccionado.estado === 'Abierta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{registroSeleccionado.estado}</span></div>
                                    <div><p className="text-xs text-gray-400">Monto Inicial</p><p className="font-semibold text-[#C9A96E]">{formatCurrency(registroSeleccionado.monto_inicial)}</p></div>
                                    <div><p className="text-xs text-gray-400">Monto Final</p><p className="font-semibold">{registroSeleccionado.monto_final !== null ? formatCurrency(registroSeleccionado.monto_final) : '-'}</p></div>
                                    <div><p className="text-xs text-gray-400">Ventas del Día</p><p className="font-semibold">{registroSeleccionado.ventas_dia !== null ? formatCurrency(registroSeleccionado.ventas_dia) : '-'}</p></div>
                                    <div><p className="text-xs text-gray-400">Fecha Apertura</p><p className="font-semibold text-sm">{new Date(registroSeleccionado.fecha_apertura).toLocaleString()}</p></div>
                                    {registroSeleccionado.fecha_cierre && (
                                        <div className="col-span-2"><p className="text-xs text-gray-400">Fecha Cierre</p><p className="font-semibold text-sm">{new Date(registroSeleccionado.fecha_cierre).toLocaleString()}</p></div>
                                    )}
                                    <div className="col-span-2"><p className="text-xs text-gray-400">Observaciones</p><p className="font-semibold">{registroSeleccionado.observaciones || '-'}</p></div>
                                </div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end">
                                <button onClick={() => setModalDetalleAbierto(false)} className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition">Cerrar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}