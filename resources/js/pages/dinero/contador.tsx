import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Calculator,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    Printer,
    FileSpreadsheet,
    ArrowRight,
    Eye,
    EyeOff,
    Coffee,
    ShoppingBag,
    Users,
    Truck,
    Plus,
    X,
    User,
    Calendar,
    Search,
    Trash2,
    FileText
} from 'lucide-react';

interface Movimiento {
    id: number;
    tipo: 'ingreso' | 'egreso';
    descripcion: string;
    monto: number;
    hora: string;
    categoria?: string;
}

interface RegistroCaja {
    id: number;
    caja: string;
    empleado: string;
    turno: 'Mañana' | 'Tarde' | 'Noche';
    montoInicial: number;
    fechaApertura: string;
    montoFinal: number | null;
    ventasDia: number | null;
    observaciones: string;
    fechaCierre: string | null;
    estado: 'Abierta' | 'Cerrada';
}

export default function Contador() {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    // 📊 Datos de ejemplo
    const resumen = {
        ingresos: 18240,
        gastos: 6580,
        gananciaNeta: 11660,
        cajaActual: 3450,
    };

    const ingresosDetalle = [
        { concepto: 'Ventas en caja', monto: 4820 },
        { concepto: 'Deliverys', monto: 1240 },
        { concepto: 'Pedidos mesa', monto: 2100 },
    ];

    const gastosDetalle = [
        { concepto: 'Insumos', monto: 1800 },
        { concepto: 'Personal', monto: 2500 },
        { concepto: 'Servicios', monto: 680 },
    ];

    const movimientos: Movimiento[] = [
        { id: 1, tipo: 'ingreso', descripcion: 'Venta en caja', monto: 120, hora: '10:15 AM' },
        { id: 2, tipo: 'egreso', descripcion: 'Compra insumos', monto: 340, hora: '11:00 AM' },
        { id: 3, tipo: 'ingreso', descripcion: 'Delivery', monto: 85, hora: '11:40 AM' },
        { id: 4, tipo: 'ingreso', descripcion: 'Pedido mesa #5', monto: 210, hora: '12:20 PM' },
        { id: 5, tipo: 'egreso', descripcion: 'Pago personal', monto: 500, hora: '01:00 PM' },
    ];

    // 📋 Estado de apertura/cierre
    const [registros, setRegistros] = useState<RegistroCaja[]>(() => {
        const saved = localStorage.getItem('registrosCaja');
        return saved ? JSON.parse(saved) : [];
    });

    const [cajaActual, setCajaActual] = useState<RegistroCaja | null>(null);

    // 📋 Estado de modales
    const [modalAperturaAbierto, setModalAperturaAbierto] = useState(false);
    const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroCaja | null>(null);

    // 📋 Estado del formulario de apertura
    const [formApertura, setFormApertura] = useState({
        empleado: '',
        caja: 'Caja 01',
        turno: 'Mañana' as 'Mañana' | 'Tarde' | 'Noche',
        montoInicial: 0,
    });

    // 📋 Estado del formulario de cierre
    const [formCierre, setFormCierre] = useState({
        montoFinal: 0,
        ventasDia: 0,
        observaciones: '',
    });

    // 📋 Filtros
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroEmpleado, setFiltroEmpleado] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // 💾 Guardar en localStorage
    useEffect(() => {
        localStorage.setItem('registrosCaja', JSON.stringify(registros));
    }, [registros]);

    // 🔍 Verificar si hay caja abierta
    useEffect(() => {
        const abierta = registros.find(r => r.estado === 'Abierta');
        setCajaActual(abierta || null);
    }, [registros]);

    // 📊 Formatear números
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    // 📊 Totales
    const totalIngresosDetalle = ingresosDetalle.reduce((sum, i) => sum + i.monto, 0);
    const totalGastosDetalle = gastosDetalle.reduce((sum, g) => sum + g.monto, 0);

    // 📊 Resumen de registros
    const totalRegistros = registros.length;
    const cajasAbiertas = registros.filter(r => r.estado === 'Abierta').length;
    const cajasCerradas = registros.filter(r => r.estado === 'Cerrada').length;
    const montoTotal = registros.reduce((acc, r) => acc + (r.estado === 'Cerrada' ? (r.montoFinal || 0) : r.montoInicial), 0);

    // 📊 Filtrar registros
    const registrosFiltrados = registros.filter(r => {
        if (filtroEstado && r.estado !== filtroEstado) return false;
        if (filtroEmpleado && !r.empleado.toLowerCase().includes(filtroEmpleado.toLowerCase())) return false;
        if (fechaInicio) {
            const fecha = new Date(r.fechaApertura);
            const fInicio = new Date(fechaInicio);
            fInicio.setHours(0, 0, 0, 0);
            if (fecha < fInicio) return false;
        }
        if (fechaFin) {
            const fecha = new Date(r.fechaApertura);
            const fFin = new Date(fechaFin);
            fFin.setHours(23, 59, 59, 999);
            if (fecha > fFin) return false;
        }
        return true;
    });

    // 📋 Funciones de apertura
    const abrirModalApertura = () => {
        setFormApertura({
            empleado: '',
            caja: 'Caja 01',
            turno: 'Mañana',
            montoInicial: 0,
        });
        setModalAperturaAbierto(true);
    };

    const guardarApertura = () => {
        if (!formApertura.empleado || formApertura.montoInicial < 0) {
            alert('Complete todos los campos correctamente.');
            return;
        }

        const nuevoRegistro: RegistroCaja = {
            id: Date.now(),
            caja: formApertura.caja,
            empleado: formApertura.empleado,
            turno: formApertura.turno,
            montoInicial: formApertura.montoInicial,
            fechaApertura: new Date().toISOString(),
            montoFinal: null,
            ventasDia: null,
            observaciones: '',
            fechaCierre: null,
            estado: 'Abierta',
        };

        setRegistros([nuevoRegistro, ...registros]);
        setModalAperturaAbierto(false);
    };

    // 📋 Funciones de cierre
    const abrirModalCierre = () => {
        const abierta = registros.find(r => r.estado === 'Abierta');
        if (!abierta) {
            alert('No hay cajas abiertas para cerrar.');
            return;
        }
        setRegistroSeleccionado(abierta);
        setFormCierre({
            montoFinal: 0,
            ventasDia: 0,
            observaciones: '',
        });
        setModalCierreAbierto(true);
    };

    const guardarCierre = () => {
        if (!registroSeleccionado) return;
        if (formCierre.montoFinal < 0 || formCierre.ventasDia < 0) {
            alert('Complete los campos correctamente.');
            return;
        }

        setRegistros(registros.map(r =>
            r.id === registroSeleccionado.id
                ? {
                    ...r,
                    montoFinal: formCierre.montoFinal,
                    ventasDia: formCierre.ventasDia,
                    observaciones: formCierre.observaciones,
                    fechaCierre: new Date().toISOString(),
                    estado: 'Cerrada',
                }
                : r
        ));

        setModalCierreAbierto(false);
    };

    // 📋 Funciones de historial
    const verDetalle = (registro: RegistroCaja) => {
        setRegistroSeleccionado(registro);
        setModalDetalleAbierto(true);
    };

    const eliminarRegistro = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
        setRegistros(registros.filter(r => r.id !== id));
    };

    return (
        <>
            <Head title="Contador - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-3xl p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">🧾 Contador</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Control financiero, apertura y cierre de caja</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {!cajaActual ? (
                            <button
                                onClick={abrirModalApertura}
                                className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                            >
                                <Plus className="w-4 h-4" />
                                Abrir Caja
                            </button>
                        ) : (
                            <button
                                onClick={abrirModalCierre}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Cerrar Caja
                            </button>
                        )}
                        <button className="inline-flex items-center gap-2 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold text-sm">
                            <FileSpreadsheet className="w-4 h-4" />
                            Exportar reporte
                        </button>
                    </div>
                </div>

                {/* ===== ESTADO DE CAJA ACTUAL ===== */}
                {cajaActual && (
                    <div className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3] rounded-2xl p-4 text-[#2D1B1A] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                            <Wallet className="w-6 h-6" />
                            <div>
                                <p className="text-sm font-medium">Caja abierta</p>
                                <p className="text-xs opacity-80">
                                    {cajaActual.empleado} · {cajaActual.turno} · {new Date(cajaActual.fechaApertura).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs opacity-80">Saldo inicial</p>
                                <p className="font-bold">{formatCurrency(cajaActual.montoInicial)}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                                Activa
                            </span>
                        </div>
                    </div>
                )}

                {/* ===== FILTRO DE FECHA ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8] flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#5A3D2B]" />
                        <span className="text-sm font-medium text-[#5A3D2B]">Fecha:</span>
                    </div>
                    <input
                        type="date"
                        className="border border-[#F3E1C8] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none text-[#2D1B1A]"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                    <button className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        Aplicar
                    </button>
                    <button className="text-[#5A3D2B] hover:text-[#2D1B1A] text-sm font-medium transition">
                        Hoy
                    </button>
                </div>

                {/* ===== RESUMEN FINANCIERO ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Ingresos</p>
                                <h2 className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(resumen.ingresos)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Total del período</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Gastos</p>
                                <h2 className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(resumen.gastos)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Total del período</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8] hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Ganancia neta</p>
                                <h2 className="text-3xl font-bold text-[#2D1B1A] mt-1">{formatCurrency(resumen.gananciaNeta)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#F3E1C8] flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-[#5A3D2B]/60">Ingresos - Gastos</span>
                        </div>
                    </div>

                    <div className="bg-[#2D1B1A] rounded-2xl p-6 text-white hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Caja actual</p>
                                <h2 className="text-3xl font-bold mt-1">{formatCurrency(resumen.cajaActual)}</h2>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-xs text-white/40">Disponible en caja</span>
                        </div>
                    </div>
                </div>

                {/* ===== RESUMEN DE APERTURAS/CIERRES ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Total Registros</p>
                        <p className="text-2xl font-bold text-[#2D1B1A]">{totalRegistros}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Cajas Abiertas</p>
                        <p className="text-2xl font-bold text-green-600">{cajasAbiertas}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Cajas Cerradas</p>
                        <p className="text-2xl font-bold text-red-600">{cajasCerradas}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Total Movido</p>
                        <p className="text-2xl font-bold text-[#C9A96E]">{formatCurrency(montoTotal)}</p>
                    </div>
                </div>

                {/* ===== FILTROS PARA HISTORIAL ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Estado</label>
                            <select
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="Abierta">Abierta</option>
                                <option value="Cerrada">Cerrada</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Empleado</label>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={filtroEmpleado}
                                onChange={(e) => setFiltroEmpleado(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Desde</label>
                            <input
                                type="date"
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Hasta</label>
                            <input
                                type="date"
                                className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* ===== TABLA DE HISTORIAL ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Historial de Aperturas y Cierres</h2>
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                        >
                            Imprimir
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Caja</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Empleado</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Turno</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Apertura</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Cierre</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {registrosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-400 py-10">No hay registros</td>
                                    </tr>
                                ) : (
                                    registrosFiltrados.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#FBF3E7] transition">
                                            <td className="px-4 py-3 font-medium">{r.caja}</td>
                                            <td className="px-4 py-3">{r.empleado}</td>
                                            <td className="px-4 py-3">{r.turno}</td>
                                            <td className="px-4 py-3">{formatCurrency(r.montoInicial)}</td>
                                            <td className="px-4 py-3">{r.montoFinal !== null ? formatCurrency(r.montoFinal) : '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    r.estado === 'Abierta' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {r.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => verDetalle(r)}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        Ver
                                                    </button>
                                                    {r.estado === 'Abierta' && (
                                                        <button
                                                            onClick={abrirModalCierre}
                                                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            Cerrar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => eliminarRegistro(r.id)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
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

                {/* ===== FLUJO FINANCIERO (Ingresos y Gastos) ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Ingresos del día */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">📈 Ingresos del día</h2>
                        <div className="space-y-3">
                            {ingresosDetalle.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-[#F3E1C8] pb-3 last:border-0 last:pb-0">
                                    <span className="text-[#5A3D2B]">{item.concepto}</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(item.monto)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-[#F3E1C8]">
                                <span className="font-bold text-[#2D1B1A]">Total ingresos</span>
                                <span className="font-bold text-green-700">{formatCurrency(totalIngresosDetalle)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Gastos del día */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A] mb-5">📉 Gastos del día</h2>
                        <div className="space-y-3">
                            {gastosDetalle.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-[#F3E1C8] pb-3 last:border-0 last:pb-0">
                                    <span className="text-[#5A3D2B]">{item.concepto}</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(item.monto)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-[#F3E1C8]">
                                <span className="font-bold text-[#2D1B1A]">Total gastos</span>
                                <span className="font-bold text-red-700">{formatCurrency(totalGastosDetalle)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MOVIMIENTOS RECIENTES ===== */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F3E1C8]">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Movimientos recientes</h2>
                        <span className="text-xs text-[#5A3D2B]">Últimas transacciones</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#F3E1C8] bg-[#FBF3E7]/50">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Tipo</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Descripción</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Monto</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#5A3D2B] uppercase tracking-wider">Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.map((mov) => (
                                    <tr key={mov.id} className="border-b border-[#FBF3E7] hover:bg-[#FBF3E7]/50 transition">
                                        <td className="py-3 px-4 text-sm">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                mov.tipo === 'ingreso' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {mov.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-[#2D1B1A]">{mov.descripcion}</td>
                                        <td className={`py-3 px-4 text-sm font-semibold ${
                                            mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {mov.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(mov.monto)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-[#5A3D2B]">{mov.hora}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== ACCIONES ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={cajaActual ? abrirModalCierre : abrirModalApertura}
                        className={`p-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 font-semibold ${
                            cajaActual 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-[#C9A96E] hover:bg-[#B8975D] text-white'
                        }`}
                    >
                        {cajaActual ? (
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
                    <button className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white p-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 font-semibold">
                        <Printer className="w-5 h-5" />
                        Imprimir balance
                    </button>
                    <button className="bg-white hover:bg-[#FBF3E7] text-[#2D1B1A] p-4 rounded-2xl shadow-md border border-[#F3E1C8] transition flex items-center justify-center gap-2 font-semibold">
                        <Eye className="w-5 h-5" />
                        Ver detalle completo
                    </button>
                </div>

                {/* ============================================================ */}
                {/* MODAL: APERTURA DE CAJA */}
                {/* ============================================================ */}
                {modalAperturaAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">💰 Nueva Apertura</h2>
                                <button
                                    onClick={() => setModalAperturaAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Empleado</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formApertura.empleado}
                                        onChange={(e) => setFormApertura({ ...formApertura, empleado: e.target.value })}
                                        placeholder="Nombre del empleado"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Caja</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formApertura.caja}
                                        onChange={(e) => setFormApertura({ ...formApertura, caja: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Turno</label>
                                    <select
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formApertura.turno}
                                        onChange={(e) => setFormApertura({ ...formApertura, turno: e.target.value as 'Mañana' | 'Tarde' | 'Noche' })}
                                    >
                                        <option value="Mañana">Mañana</option>
                                        <option value="Tarde">Tarde</option>
                                        <option value="Noche">Noche</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Monto Inicial (S/)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formApertura.montoInicial}
                                        onChange={(e) => setFormApertura({ ...formApertura, montoInicial: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalAperturaAbierto(false)}
                                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarApertura}
                                    className="bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Abrir Caja
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: CIERRE DE CAJA */}
                {/* ============================================================ */}
                {modalCierreAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">🔒 Cerrar Caja</h2>
                                <button
                                    onClick={() => setModalCierreAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Caja</label>
                                        <p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.caja}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Empleado</label>
                                        <p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.empleado}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Turno</label>
                                        <p className="font-semibold text-[#2D1B1A]">{registroSeleccionado.turno}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Monto Inicial</label>
                                        <p className="font-semibold text-[#C9A96E]">{formatCurrency(registroSeleccionado.montoInicial)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Monto Final (S/)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formCierre.montoFinal}
                                        onChange={(e) => setFormCierre({ ...formCierre, montoFinal: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Ventas del Día (S/)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formCierre.ventasDia}
                                        onChange={(e) => setFormCierre({ ...formCierre, ventasDia: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 font-medium">Observaciones</label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                        value={formCierre.observaciones}
                                        onChange={(e) => setFormCierre({ ...formCierre, observaciones: e.target.value })}
                                        placeholder="Observaciones del cierre..."
                                    />
                                </div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setModalCierreAbierto(false)}
                                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarCierre}
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Confirmar Cierre
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: DETALLE DEL REGISTRO */}
                {/* ============================================================ */}
                {modalDetalleAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl">
                            <div className="flex justify-between items-center p-6 border-b border-[#F3E1C8]">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">Detalle del Registro</h2>
                                <button
                                    onClick={() => setModalDetalleAbierto(false)}
                                    className="text-3xl text-gray-400 hover:text-red-500 transition"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-gray-400">Caja</p><p className="font-semibold">{registroSeleccionado.caja}</p></div>
                                    <div><p className="text-xs text-gray-400">Empleado</p><p className="font-semibold">{registroSeleccionado.empleado}</p></div>
                                    <div><p className="text-xs text-gray-400">Turno</p><p className="font-semibold">{registroSeleccionado.turno}</p></div>
                                    <div><p className="text-xs text-gray-400">Estado</p><span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                                        registroSeleccionado.estado === 'Abierta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>{registroSeleccionado.estado}</span></div>
                                    <div><p className="text-xs text-gray-400">Monto Inicial</p><p className="font-semibold text-[#C9A96E]">{formatCurrency(registroSeleccionado.montoInicial)}</p></div>
                                    <div><p className="text-xs text-gray-400">Monto Final</p><p className="font-semibold">{registroSeleccionado.montoFinal !== null ? formatCurrency(registroSeleccionado.montoFinal) : '-'}</p></div>
                                    <div><p className="text-xs text-gray-400">Ventas del Día</p><p className="font-semibold">{registroSeleccionado.ventasDia !== null ? formatCurrency(registroSeleccionado.ventasDia) : '-'}</p></div>
                                    <div><p className="text-xs text-gray-400">Fecha Apertura</p><p className="font-semibold text-sm">{new Date(registroSeleccionado.fechaApertura).toLocaleString()}</p></div>
                                    {registroSeleccionado.fechaCierre && (
                                        <div className="col-span-2"><p className="text-xs text-gray-400">Fecha Cierre</p><p className="font-semibold text-sm">{new Date(registroSeleccionado.fechaCierre).toLocaleString()}</p></div>
                                    )}
                                    <div className="col-span-2"><p className="text-xs text-gray-400">Observaciones</p><p className="font-semibold">{registroSeleccionado.observaciones || '-'}</p></div>
                                </div>
                            </div>
                            <div className="border-t border-[#F3E1C8] p-6 flex justify-end">
                                <button
                                    onClick={() => setModalDetalleAbierto(false)}
                                    className="bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}