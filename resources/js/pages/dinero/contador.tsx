import { Head, usePage, router } from '@inertiajs/react';
import {
    Calculator,
    TrendingUp,
    Wallet,
    Clock,
    CheckCircle,
    Printer,
    FileSpreadsheet,
    Plus,
    Eye,
    Receipt,
    Lock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';

interface RegistroCaja {
    id: number;
    caja: string;
    empleado: string;
    turno: 'Todo el día' | 'Mañana' | 'Tarde' | 'Noche';
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
        ultimaCaja = null,
        resumen = { ingresos: 0, cajaActual: 0 },
        movimientos = [],
        ingresosDetalle = [],
        puedeAbrir = false,
        auth,
    } = usePage().props as any;
    const empleadoActual = auth?.user?.name ?? 'Usuario actual';

    const [registros, setRegistros] = useState<RegistroCaja[]>(cajas);
    const [cajaActiva, setCajaActiva] = useState<RegistroCaja | null>(
        cajaActual,
    );
    const [modalAperturaAbierto, setModalAperturaAbierto] = useState(false);
    const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
    const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [registroSeleccionado, setRegistroSeleccionado] =
        useState<RegistroCaja | null>(null);

    const [formApertura, setFormApertura] = useState({
        caja: 'Caja 01',
        turno: 'Todo el día' as RegistroCaja['turno'],
        montoInicial: 0,
        justificacionApertura: '',
    });

    const [formCierre, setFormCierre] = useState({
        montoFinal: '',
        observaciones: '',
    });
    const [formMovimiento, setFormMovimiento] = useState({
        tipo: 'egreso',
        concepto: '',
        monto: 0,
    });

    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroEmpleado, setFiltroEmpleado] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    useEffect(() => {
        setRegistros(cajas);
        setCajaActiva(cajaActual);
    }, [cajas, cajaActual]);

    useSedeChannel('caja', {
        'caja.actualizada': (caja: RegistroCaja) => {
            setCajaActiva(caja.estado === 'Abierta' ? caja : null);
            setRegistros((current) => {
                const exists = current.some(
                    (registro) => registro.id === caja.id,
                );

                return exists
                    ? current.map((registro) =>
                          registro.id === caja.id
                              ? { ...registro, ...caja }
                              : registro,
                      )
                    : [caja, ...current];
            });
        },
    });

    const formatCurrency = (amount: number | string): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(num) || num === null || num === undefined) {
            return 'S/ 0.00';
        }

        return `S/ ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    const totalIngresosDetalle = ingresosDetalle.reduce(
        (sum: number, i: any) => sum + (i.monto || 0),
        0,
    );
    const totalRegistros = registros.length;
    const cajasAbiertas = registros.filter(
        (r) => r.estado === 'Abierta',
    ).length;
    const cajasCerradas = registros.filter(
        (r) => r.estado === 'Cerrada',
    ).length;
    const montoTotal = registros.reduce(
        (acc, r) =>
            acc +
            (r.estado === 'Cerrada' ? r.monto_final || 0 : r.monto_inicial),
        0,
    );

    const registrosFiltrados = registros.filter((r) => {
        if (filtroEstado && r.estado !== filtroEstado) {
            return false;
        }

        if (
            filtroEmpleado &&
            !r.empleado.toLowerCase().includes(filtroEmpleado.toLowerCase())
        ) {
            return false;
        }

        if (fechaInicio) {
            const fecha = new Date(r.fecha_apertura);
            const fInicio = new Date(fechaInicio);
            fInicio.setHours(0, 0, 0, 0);

            if (fecha < fInicio) {
                return false;
            }
        }

        if (fechaFin) {
            const fecha = new Date(r.fecha_apertura);
            const fFin = new Date(fechaFin);
            fFin.setHours(23, 59, 59, 999);

            if (fecha > fFin) {
                return false;
            }
        }

        return true;
    });

    const abrirModalApertura = () => {
        setFormApertura({
            caja: 'Caja 01',
            turno: 'Todo el día',
            montoInicial: ultimaCaja?.monto_final
                ? Number(ultimaCaja.monto_final)
                : 0,
            justificacionApertura: '',
        });
        setModalAperturaAbierto(true);
    };

    const guardarApertura = () => {
        if (formApertura.montoInicial < 0) {
            alert('Complete todos los campos correctamente.');

            return;
        }

        router.post('/contador/abrir', formApertura, {
            onSuccess: () => setModalAperturaAbierto(false),
            onError: (errors) =>
                alert(
                    'Error al abrir caja: ' + Object.values(errors).join(' '),
                ),
        });
    };

    const abrirModalCierre = () => {
        const abierta = registros.find((r) => r.estado === 'Abierta');

        if (!abierta) {
            alert('No hay cajas abiertas para cerrar.');

            return;
        }

        setRegistroSeleccionado(abierta);
        setFormCierre({ montoFinal: '', observaciones: '' });
        setModalCierreAbierto(true);
    };

    const guardarCierre = () => {
        if (!registroSeleccionado) {
            return;
        }

        if (formCierre.montoFinal === '') {
            alert('Complete los campos correctamente.');

            return;
        }

        router.post(`/contador/cerrar/${registroSeleccionado.id}`, formCierre, {
            onSuccess: () => {
                setModalCierreAbierto(false);
                router.reload();
            },
            onError: (errors) =>
                alert(
                    'Error al cerrar caja: ' + Object.values(errors).join(' '),
                ),
        });
    };

    const guardarMovimiento = () => {
        router.post('/contador/movimientos', formMovimiento, {
            onSuccess: () => {
                setModalMovimientoAbierto(false);
                setFormMovimiento({ tipo: 'egreso', concepto: '', monto: 0 });
                router.reload();
            },
        });
    };

    const verDetalle = (registro: RegistroCaja) => {
        setRegistroSeleccionado(registro);
        setModalDetalleAbierto(true);
    };

    const eliminarRegistro = (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) {
            return;
        }

        router.delete(`/contador/${id}`, {
            onSuccess: () => router.reload(),
            onError: (errors) =>
                alert('Error al eliminar: ' + Object.values(errors).join(' ')),
        });
    };
    const exportarReporte = (hoja?: string) => {
        const params = new URLSearchParams();

        if (filtroEstado) {
            params.set('estado', filtroEstado);
        }

        if (filtroEmpleado) {
            params.set('empleado', filtroEmpleado);
        }

        if (fechaInicio) {
            params.set('fecha_inicio', fechaInicio);
        }

        if (fechaFin) {
            params.set('fecha_fin', fechaFin);
        }

        params.set('ingresos_efectivo', String(resumen.ventas_efectivo || 0));
        params.set('ingresos_tarjeta', String(resumen.ventas_tarjeta || 0));
        params.set('ingresos_yape', String(resumen.ventas_yape || 0));
        params.set('ingresos_total', String(resumen.ingresos || 0));

        if (hoja) {
            params.set('hoja', hoja);
        }

        window.open(`/contador/export?${params.toString()}`, '_blank');
        setExportMenuOpen(false);
    };

    const tarjetasResumen = [
        {
            titulo: 'Ingresos del día',
            valor: formatCurrency(resumen.ingresos || 0),
            icono: <TrendingUp className="h-6 w-6" />,
            color: 'from-green-500 to-emerald-500',
        },
        {
            titulo: 'Ventas totales',
            valor: formatCurrency(resumen.ingresos || 0),
            icono: <Calculator className="h-6 w-6" />,
            color: 'from-amber-500 to-orange-500',
        },
        {
            titulo: 'Caja actual',
            valor: formatCurrency(resumen.cajaActual || 0),
            icono: <Wallet className="h-6 w-6" />,
            color: 'from-purple-500 to-indigo-500',
        },
    ];

    const estadisticasRapidas = [
        { label: 'Total Registros', value: totalRegistros },
        { label: 'Cajas Abiertas', value: cajasAbiertas },
        { label: 'Cajas Cerradas', value: cajasCerradas },
        { label: 'Total Movido', value: formatCurrency(montoTotal) },
    ];

    return (
        <>
            <Head title="Turno de caja - Dolce Cafe" />
            <div className="min-h-screen space-y-4 bg-cream p-4 md:p-6">
                <div className="flex justify-end">
                    <div className="flex flex-wrap gap-3">
                        {!cajaActiva
                            ? puedeAbrir && (
                                  <button
                                      onClick={abrirModalApertura}
                                      className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                                  >
                                      <Plus className="h-4 w-4" />
                                      Abrir Caja
                                  </button>
                              )
                            : puedeAbrir && (
                                  <>
                                      <button
                                          onClick={() =>
                                              setModalMovimientoAbierto(true)
                                          }
                                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-emerald-700"
                                      >
                                          <Plus className="h-4 w-4" />{' '}
                                          Movimiento
                                      </button>
                                      <button
                                          onClick={abrirModalCierre}
                                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg active:scale-95"
                                      >
                                          <CheckCircle className="h-4 w-4" />
                                          Cerrar Caja
                                      </button>
                                  </>
                              )}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setExportMenuOpen(!exportMenuOpen)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-roast px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-ink hover:shadow-lg active:scale-95"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {exportMenuOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-sand bg-card shadow-lg">
                                    <button
                                        onClick={() => exportarReporte()}
                                        className="flex w-full items-center gap-2 border-b border-sand px-4 py-3 text-left text-sm text-chocolate transition hover:bg-cream"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-gold" />
                                        Exportar todo (todas las tablas)
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportarReporte('ingresos')
                                        }
                                        className="flex w-full items-center gap-2 border-b border-sand px-4 py-3 text-left text-sm text-chocolate transition hover:bg-cream"
                                    >
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        Solo Ingresos del día
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportarReporte('historial')
                                        }
                                        className="flex w-full items-center gap-2 border-b border-sand px-4 py-3 text-left text-sm text-chocolate transition hover:bg-cream"
                                    >
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        Solo Historial de Caja
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportarReporte('movimientos')
                                        }
                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-chocolate transition hover:bg-cream"
                                    >
                                        <Receipt className="h-4 w-4 text-amber-500" />
                                        Solo Movimientos
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CAJA ACTIVA - BLANCA */}
                {cajaActiva && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand bg-card p-5 text-chocolate shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                                <Wallet className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-chocolate">
                                    Caja abierta
                                </p>
                                <p className="text-xs text-cocoa">
                                    {cajaActiva.empleado} · {cajaActiva.turno} ·
                                    <span suppressHydrationWarning>
                                        {new Date(
                                            cajaActiva.fecha_apertura,
                                        ).toLocaleString()}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-cocoa">
                                    Saldo inicial
                                </p>
                                <p className="text-lg font-bold text-chocolate">
                                    {formatCurrency(cajaActiva.monto_inicial)}
                                </p>
                            </div>
                            <span className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                                Activa
                            </span>
                        </div>
                    </div>
                )}

                {/* TARJETAS RESUMEN - BLANCAS */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                        </div>
                    ))}
                </div>

                {/* ESTADÍSTICAS RÁPIDAS - BLANCAS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {estadisticasRapidas.map((item, idx) => (
                        <div
                            key={idx}
                            className="rounded-2xl border border-sand bg-card p-4 shadow-sm transition hover:shadow-md"
                        >
                            <p className="text-xs font-semibold text-cocoa-soft uppercase">
                                {item.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-chocolate">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* FILTROS - BLANCO */}
                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="text-xs font-medium text-cocoa">
                                Estado
                            </label>
                            <select
                                className="mt-1 w-full rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={filtroEstado}
                                onChange={(e) =>
                                    setFiltroEstado(e.target.value)
                                }
                            >
                                <option value="">Todos</option>
                                <option value="Abierta">Abierta</option>
                                <option value="Cerrada">Cerrada</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-cocoa">
                                Empleado
                            </label>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="mt-1 w-full rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate placeholder-cocoa-soft transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={filtroEmpleado}
                                onChange={(e) =>
                                    setFiltroEmpleado(e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-cocoa">
                                Desde
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-cocoa">
                                Hasta
                            </label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* TABLA HISTORIAL - BLANCA */}
                <div className="overflow-hidden rounded-2xl border border-sand bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-sand p-5">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Clock className="h-5 w-5 text-gold" />
                            Historial de Aperturas y Cierres
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Caja
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Empleado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Turno
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Apertura
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Cierre
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-soft">
                                {registrosFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-cocoa-soft"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Calculator className="h-10 w-10 text-cocoa-soft" />
                                                <span>No hay registros</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    registrosFiltrados.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="group transition hover:bg-cream"
                                        >
                                            <td className="px-4 py-3 font-medium text-chocolate">
                                                {r.caja}
                                            </td>
                                            <td className="px-4 py-3 text-cocoa">
                                                {r.empleado}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sand px-3 py-1 text-xs font-medium text-cocoa">
                                                    <Clock className="h-3 w-3" />
                                                    {r.turno}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gold">
                                                {formatCurrency(
                                                    r.monto_inicial,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-chocolate">
                                                {r.monto_final !== null
                                                    ? formatCurrency(
                                                          r.monto_final,
                                                      )
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                                        r.estado === 'Abierta'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {r.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            verDetalle(r)
                                                        }
                                                        className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                                    >
                                                        Ver
                                                    </button>
                                                    {r.estado === 'Abierta' && (
                                                        <button
                                                            onClick={
                                                                abrirModalCierre
                                                            }
                                                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                                                        >
                                                            Cerrar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            eliminarRegistro(
                                                                r.id,
                                                            )
                                                        }
                                                        className="rounded-lg bg-sand px-3 py-1.5 text-xs font-semibold text-chocolate transition hover:bg-wheat"
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

                {/* INGRESOS DEL DÍA - BLANCO */}
                <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                    <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-chocolate">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Ingresos del día
                    </h2>
                    <div className="space-y-3">
                        {ingresosDetalle.map((item: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center justify-between border-b border-sand pb-3 last:border-0 last:pb-0"
                            >
                                <span className="font-medium text-cocoa">
                                    {item.concepto}
                                </span>
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(item.monto || 0)}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between border-t-2 border-gold/30 pt-3">
                            <span className="text-lg font-bold text-chocolate">
                                Total ingresos
                            </span>
                            <span className="text-lg font-bold text-green-700">
                                {formatCurrency(totalIngresosDetalle)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MOVIMIENTOS RECIENTES - BLANCO */}
                <div className="rounded-2xl border border-sand bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                            <Receipt className="h-5 w-5 text-amber-500" />
                            Movimientos recientes
                        </h2>
                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-cocoa">
                            Últimas transacciones
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Descripción
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Hora
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-cocoa-soft"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Receipt className="h-10 w-10 text-cocoa-soft" />
                                                <span>
                                                    No hay movimientos recientes
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientos.map((mov: any) => (
                                        <tr
                                            key={mov.id}
                                            className="group border-b border-cream-soft transition hover:bg-cream"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                                        mov.tipo === 'ingreso'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {mov.tipo === 'ingreso'
                                                        ? 'Ingreso'
                                                        : 'Gasto'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-chocolate">
                                                {mov.descripcion}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-cocoa">
                                                {mov.cliente || 'Anónimo'}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-sm font-semibold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {mov.tipo === 'ingreso'
                                                    ? '+'
                                                    : '-'}{' '}
                                                {formatCurrency(mov.monto)}
                                            </td>
                                            <td className="flex items-center gap-1.5 px-4 py-3 text-sm text-cocoa">
                                                <Clock className="h-3 w-3" />
                                                {mov.hora}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== MODALES ===== */}
                {modalMovimientoAbierto && cajaActiva && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-card p-6 text-chocolate shadow-xl">
                            <h2 className="text-xl font-bold text-chocolate">
                                Registrar movimiento
                            </h2>
                            <div className="mt-5 space-y-4">
                                <select
                                    className="w-full rounded-xl border border-wheat bg-cream-soft p-3 text-chocolate"
                                    value={formMovimiento.tipo}
                                    onChange={(e) =>
                                        setFormMovimiento({
                                            ...formMovimiento,
                                            tipo: e.target.value,
                                        })
                                    }
                                >
                                    <option value="ingreso">Ingreso</option>
                                    <option value="aporte">Aporte</option>
                                    <option value="egreso">Gasto</option>
                                    <option value="retiro">Retiro</option>
                                </select>
                                <input
                                    className="w-full rounded-xl border border-wheat bg-cream-soft p-3 text-chocolate placeholder:text-cocoa-soft"
                                    value={formMovimiento.concepto}
                                    onChange={(e) =>
                                        setFormMovimiento({
                                            ...formMovimiento,
                                            concepto: e.target.value,
                                        })
                                    }
                                    placeholder="Concepto y motivo"
                                />
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="w-full rounded-xl border border-wheat bg-cream-soft p-3 text-chocolate placeholder:text-cocoa-soft"
                                    value={formMovimiento.monto}
                                    onChange={(e) =>
                                        setFormMovimiento({
                                            ...formMovimiento,
                                            monto: Number(e.target.value),
                                        })
                                    }
                                    placeholder="Monto"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() =>
                                        setModalMovimientoAbierto(false)
                                    }
                                    className="rounded-xl bg-sand px-5 py-2.5 font-semibold text-chocolate transition hover:bg-wheat"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarMovimiento}
                                    disabled={
                                        !formMovimiento.concepto ||
                                        formMovimiento.monto <= 0
                                    }
                                    className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Apertura - BLANCO */}
                {modalAperturaAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-card text-chocolate shadow-xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-chocolate">
                                    <Wallet className="h-6 w-6 text-gold" />
                                    Nueva Apertura
                                </h2>
                                <button
                                    onClick={() =>
                                        setModalAperturaAbierto(false)
                                    }
                                    className="text-3xl text-cocoa-soft transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Empleado
                                    </label>
                                    <p className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 font-medium text-chocolate">
                                        {empleadoActual}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Caja
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={formApertura.caja}
                                        onChange={(e) =>
                                            setFormApertura({
                                                ...formApertura,
                                                caja: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Turno
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={formApertura.turno}
                                        onChange={(e) =>
                                            setFormApertura({
                                                ...formApertura,
                                                turno: e.target.value as
                                                    | 'Todo el día'
                                                    | 'Mañana'
                                                    | 'Tarde'
                                                    | 'Noche',
                                            })
                                        }
                                    >
                                        <option value="Todo el día">
                                            Todo el día
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Monto Inicial (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={formApertura.montoInicial}
                                        onChange={(e) =>
                                            setFormApertura({
                                                ...formApertura,
                                                montoInicial:
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                    {ultimaCaja && (
                                        <p className="mt-2 text-xs text-cocoa">
                                            Ultimo cierre:{' '}
                                            {formatCurrency(
                                                ultimaCaja.monto_final,
                                            )}
                                            . Si modifica el monto, indique el
                                            motivo.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Justificación del ajuste
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 outline-none focus:ring-2 focus:ring-gold"
                                        value={
                                            formApertura.justificacionApertura
                                        }
                                        onChange={(e) =>
                                            setFormApertura({
                                                ...formApertura,
                                                justificacionApertura:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Solo necesaria si difiere del cierre anterior"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-sand p-6">
                                <button
                                    onClick={() =>
                                        setModalAperturaAbierto(false)
                                    }
                                    className="rounded-xl bg-sand px-5 py-2.5 font-semibold text-chocolate transition hover:bg-wheat"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarApertura}
                                    className="rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink transition hover:bg-gold-deep"
                                >
                                    Abrir Caja
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Cierre - BLANCO */}
                {modalCierreAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-chocolate">
                                    <Lock className="h-6 w-6 text-red-500" />
                                    Cerrar Caja
                                </h2>
                                <button
                                    onClick={() => setModalCierreAbierto(false)}
                                    className="text-3xl text-cocoa-soft transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4 p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-cocoa">
                                            Caja
                                        </label>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.caja}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cocoa">
                                            Empleado
                                        </label>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.empleado}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cocoa">
                                            Turno
                                        </label>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.turno}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-cocoa">
                                            Monto Inicial
                                        </label>
                                        <p className="font-semibold text-gold">
                                            {formatCurrency(
                                                registroSeleccionado.monto_inicial,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Monto Final (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={formCierre.montoFinal}
                                        onChange={(e) =>
                                            setFormCierre({
                                                ...formCierre,
                                                montoFinal: e.target.value,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                    Arqueo ciego: ingrese el efectivo contado.
                                    El sistema calculará la diferencia después
                                    de confirmar.
                                </p>
                                <div>
                                    <label className="text-sm font-medium text-cocoa">
                                        Observaciones
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 w-full rounded-xl border border-wheat bg-cream-soft p-3 text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={formCierre.observaciones}
                                        onChange={(e) =>
                                            setFormCierre({
                                                ...formCierre,
                                                observaciones: e.target.value,
                                            })
                                        }
                                        placeholder="Observaciones del cierre..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-sand p-6">
                                <button
                                    onClick={() => setModalCierreAbierto(false)}
                                    className="rounded-xl bg-sand px-5 py-2.5 font-semibold text-chocolate transition hover:bg-wheat"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarCierre}
                                    className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
                                >
                                    Confirmar Cierre
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Detalle - BLANCO */}
                {modalDetalleAbierto && registroSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-xl rounded-3xl bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-chocolate">
                                    <Eye className="h-6 w-6 text-blue-500" />
                                    Detalle del Registro
                                </h2>
                                <button
                                    onClick={() =>
                                        setModalDetalleAbierto(false)
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
                                            Caja
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.caja}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Empleado
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.empleado}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Turno
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.turno}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Estado
                                        </p>
                                        <span
                                            className={`rounded-full px-3 py-0.5 text-xs font-bold ${registroSeleccionado.estado === 'Abierta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {registroSeleccionado.estado}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Monto Inicial
                                        </p>
                                        <p className="font-semibold text-gold">
                                            {formatCurrency(
                                                registroSeleccionado.monto_inicial,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Monto Final
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.monto_final !==
                                            null
                                                ? formatCurrency(
                                                      registroSeleccionado.monto_final,
                                                  )
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Ventas del Día
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.ventas_dia !==
                                            null
                                                ? formatCurrency(
                                                      registroSeleccionado.ventas_dia,
                                                  )
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-cocoa-soft">
                                            Fecha Apertura
                                        </p>
                                        <p className="text-sm font-semibold text-chocolate">
                                            {new Date(
                                                registroSeleccionado.fecha_apertura,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    {registroSeleccionado.fecha_cierre && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-cocoa-soft">
                                                Fecha Cierre
                                            </p>
                                            <p className="text-sm font-semibold text-chocolate">
                                                {new Date(
                                                    registroSeleccionado.fecha_cierre,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <p className="text-xs text-cocoa-soft">
                                            Observaciones
                                        </p>
                                        <p className="font-semibold text-chocolate">
                                            {registroSeleccionado.observaciones ||
                                                '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end border-t border-sand p-6">
                                <button
                                    onClick={() =>
                                        setModalDetalleAbierto(false)
                                    }
                                    className="rounded-xl bg-sand px-5 py-2.5 font-semibold text-chocolate transition hover:bg-wheat"
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

Contador.layout = {
    breadcrumbs: [
        {
            title: 'Contador',
            href: '/contador',
        },
    ],
};
