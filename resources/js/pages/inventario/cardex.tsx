import { Head, usePage, router } from '@inertiajs/react';
import {
    Package,
    Plus,
    Search,
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Building2,
    User,
    X,
    Check,
    Printer,
    FileSpreadsheet,
    ArrowUp,
    ArrowDown,
    Clock,
    ChartColumn,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Movimiento {
    id: number;
    item_type: string;
    item_id: number;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    stock_resultante: number;
    motivo: string;
    observaciones: string;
    user: { name: string };
    item: { nombre: string; categoria: string };
    created_at: string;
}

interface Plato {
    id: number;
    nombre: string;
    categoria: string;
    stock: number;
}

interface Insumo {
    id: number;
    nombre: string;
    categoria: string;
    stock: number;
    unidad: string;
}

export default function Cardex() {
    const { platos, insumos, movimientos } = usePage().props as any;
    const [movimientosData, setMovimientosData] = useState<Movimiento[]>(() => {
        return (movimientos || []).map((m: any) => ({
            ...m,
            cantidad:
                typeof m.cantidad === 'number'
                    ? m.cantidad
                    : parseFloat(String(m.cantidad).replace(/[^\d.]/g, '')) ||
                      0,
            stock_resultante:
                typeof m.stock_resultante === 'number'
                    ? m.stock_resultante
                    : parseFloat(
                          String(m.stock_resultante).replace(/[^\d.]/g, ''),
                      ) || 0,
        }));
    });
    const [modalAbierto, setModalAbierto] = useState(false);
    // Estado del formulario
    const [nuevoMovimiento, setNuevoMovimiento] = useState({
        producto_id: '',
        tipo: 'entrada' as 'entrada' | 'salida',
        cantidad: 0,
        proveedor: '',
        observaciones: '',
    });

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroItemType, setFiltroItemType] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    // Estadísticas
    const totalEntradas = (movimientosData || [])
        .filter(
            (m) =>
                m.tipo === 'entrada' &&
                typeof m.cantidad === 'number' &&
                !isNaN(m.cantidad),
        )
        .reduce((sum, m) => sum + m.cantidad, 0);

    const totalSalidas = (movimientosData || [])
        .filter(
            (m) =>
                m.tipo === 'salida' &&
                typeof m.cantidad === 'number' &&
                !isNaN(m.cantidad),
        )
        .reduce((sum, m) => sum + m.cantidad, 0);
    const totalProductos = (platos || []).length + (insumos || []).length;
    const formatNumber = (num: number): string => num.toLocaleString('es-PE');
    const movimientosFiltrados = (movimientosData || []).filter((m) => {
        const busquedaOk =
            !busqueda ||
            (m.item?.nombre || '')
                .toLowerCase()
                .includes(busqueda.toLowerCase());
        const tipoOk = !filtroTipo || m.tipo === filtroTipo;
        const itemTypeOk = !filtroItemType || m.item_type === filtroItemType;

        return busquedaOk && tipoOk && itemTypeOk;
    });

    const guardarMovimiento = () => {
        const cantidadNumerica = Number(nuevoMovimiento.cantidad);

        if (
            !nuevoMovimiento.producto_id ||
            cantidadNumerica <= 0 ||
            isNaN(cantidadNumerica)
        ) {
            toast.warning('Complete todos los campos correctamente');

            return;
        }

        const [tipo, id] = nuevoMovimiento.producto_id.split('-');
        const item =
            tipo === 'plato'
                ? (platos || []).find((p: Plato) => p.id === Number(id))
                : (insumos || []).find((i: Insumo) => i.id === Number(id));

        if (!item) {
            toast.error('Producto no encontrado');

            return;
        }

        if (
            nuevoMovimiento.tipo === 'salida' &&
            item.stock < cantidadNumerica
        ) {
            toast.error(`Stock insuficiente para ${item.nombre}`);

            return;
        }

        const nuevoStock =
            nuevoMovimiento.tipo === 'entrada'
                ? Number(item.stock) + cantidadNumerica
                : Number(item.stock) - cantidadNumerica;

        toast.info('Funcionalidad en desarrollo');
        // Por ahora, simular el movimiento
        const nuevoMov: Movimiento = {
            id: Date.now(),
            item_type: tipo,
            item_id: Number(id),
            tipo: nuevoMovimiento.tipo,
            cantidad: Number(nuevoMovimiento.cantidad),
            stock_resultante: Number(nuevoStock),
            motivo: 'ajuste',
            observaciones: nuevoMovimiento.observaciones || '',
            user: { name: 'Usuario actual' },
            item: { nombre: item.nombre, categoria: item.categoria || '' },
            created_at: new Date().toISOString(),
        };

        setMovimientosData([nuevoMov, ...movimientosData]);
        setModalAbierto(false);
        setNuevoMovimiento({
            producto_id: '',
            tipo: 'entrada',
            cantidad: 0,
            proveedor: '',
            observaciones: '',
        });
        toast.success('Movimiento registrado correctamente');
    };

    return (
        <>
            <Head title="Cardex - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* HEADER */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-chocolate">
                            <span className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-2 text-white">
                                <ChartColumn className="h-6 w-6" />
                            </span>
                            Cardex
                        </h1>
                        <p className="mt-1 ml-1 text-sm text-cocoa">
                            Control de inventario y movimientos de productos
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setModalAbierto(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo movimiento
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-roast px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-ink hover:shadow-lg active:scale-95">
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* TARJETAS DE RESUMEN */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Total productos
                                </p>
                                <p className="mt-1 text-3xl font-bold text-chocolate">
                                    {formatNumber(totalProductos)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand">
                                <Warehouse className="h-6 w-6 text-cinnamon" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Entradas
                                </p>
                                <p className="mt-1 text-3xl font-bold text-green-600">
                                    {formatNumber(totalEntradas)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Salidas
                                </p>
                                <p className="mt-1 text-3xl font-bold text-red-600">
                                    {formatNumber(totalSalidas)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                                <TrendingDown className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-roast p-5 text-white transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/60">
                                    Movimientos
                                </p>
                                <p className="mt-1 text-3xl font-bold">
                                    {(movimientosData || []).length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <Clock className="h-6 w-6 text-gold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                            <input
                                type="text"
                                placeholder="Buscar movimientos..."
                                className="w-full rounded-xl border border-wheat bg-card py-2.5 pr-4 pl-10 text-sm text-chocolate placeholder-cocoa-soft transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="entrada">Entradas</option>
                            <option value="salida">Salidas</option>
                        </select>
                        <select
                            className="rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                            value={filtroItemType}
                            onChange={(e) => setFiltroItemType(e.target.value)}
                        >
                            <option value="">Todos los items</option>
                            <option value="plato">Platos</option>
                            <option value="insumo">Insumos</option>
                        </select>
                        <input
                            type="date"
                            className="rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold [&::-webkit-calendar-picker-indicator]:!h-5 [&::-webkit-calendar-picker-indicator]:!w-5 [&::-webkit-calendar-picker-indicator]:!cursor-pointer [&::-webkit-calendar-picker-indicator]:!rounded-md [&::-webkit-calendar-picker-indicator]:!bg-cocoa/80 [&::-webkit-calendar-picker-indicator]:!p-0.5 [&::-webkit-calendar-picker-indicator]:!opacity-100 [&::-webkit-calendar-picker-indicator]:hover:!bg-cocoa"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                        <input
                            type="date"
                            className="rounded-xl border border-wheat bg-card p-2.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold [&::-webkit-calendar-picker-indicator]:!h-5 [&::-webkit-calendar-picker-indicator]:!w-5 [&::-webkit-calendar-picker-indicator]:!cursor-pointer [&::-webkit-calendar-picker-indicator]:!rounded-md [&::-webkit-calendar-picker-indicator]:!bg-cocoa/80 [&::-webkit-calendar-picker-indicator]:!p-0.5 [&::-webkit-calendar-picker-indicator]:!opacity-100 [&::-webkit-calendar-picker-indicator]:hover:!bg-cocoa"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setFiltroTipo('');
                                setFiltroItemType('');
                                setFechaInicio('');
                                setFechaFin('');
                            }}
                            className="rounded-xl bg-roast py-2.5 text-sm font-semibold text-white transition hover:bg-ink hover:shadow-md active:scale-95"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* TABLA DE MOVIMIENTOS */}
                <div className="overflow-hidden rounded-2xl border border-sand bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-sand p-5">
                        <div>
                            <h2 className="flex items-center gap-2 text-xl font-bold text-chocolate">
                                <Package className="h-5 w-5 text-amber-500" />
                                Movimientos de inventario
                            </h2>
                            <p className="mt-1 text-xs text-cocoa">
                                {movimientosFiltrados.length} registros
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Producto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Tipo Mov.
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Cantidad
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Stock final
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-cocoa uppercase">
                                        Motivo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-soft">
                                {movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-12 text-center text-cocoa-soft"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-10 w-10 text-cocoa-soft" />
                                                <span>
                                                    No hay movimientos
                                                    registrados
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((mov) => (
                                        <tr
                                            key={mov.id}
                                            className="group transition hover:bg-cream"
                                        >
                                            <td className="px-4 py-3 text-sm text-cocoa">
                                                {new Date(
                                                    mov.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        mov.item_type ===
                                                        'plato'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}
                                                >
                                                    {mov.item_type === 'plato'
                                                        ? 'Plato'
                                                        : 'Insumo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-chocolate">
                                                {mov.item?.nombre || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-cocoa">
                                                {mov.item?.categoria || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                                        mov.tipo === 'entrada'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {mov.tipo === 'entrada' ? (
                                                        <TrendingUp className="h-3 w-3" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3" />
                                                    )}
                                                    {mov.tipo === 'entrada'
                                                        ? 'Entrada'
                                                        : 'Salida'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-semibold">
                                                <span
                                                    className={
                                                        mov.tipo === 'entrada'
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }
                                                >
                                                    {mov.tipo === 'entrada'
                                                        ? '+'
                                                        : '-'}{' '}
                                                    {mov.cantidad}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-gold">
                                                {mov.stock_resultante}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-cocoa">
                                                <span className="rounded-full bg-cream px-2 py-1 text-xs font-medium text-cocoa">
                                                    {mov.motivo}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== MODAL: Nuevo Movimiento ===== */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-card shadow-2xl">
                            <div className="flex items-center justify-between border-b border-sand p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-lg">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-chocolate">
                                            Nuevo Movimiento
                                        </h2>
                                        <p className="text-xs text-cocoa">
                                            Registra una entrada o salida de
                                            inventario
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <Package className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Producto / Insumo
                                    </label>
                                    <select
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={nuevoMovimiento.producto_id}
                                        onChange={(e) =>
                                            setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                producto_id: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="">
                                            Seleccionar producto
                                        </option>
                                        {(platos || []).map((p: Plato) => (
                                            <option
                                                key={`plato-${p.id}`}
                                                value={`plato-${p.id}`}
                                            >
                                                {p.nombre} (Stock: {p.stock})
                                            </option>
                                        ))}
                                        {(insumos || []).map((i: Insumo) => (
                                            <option
                                                key={`insumo-${i.id}`}
                                                value={`insumo-${i.id}`}
                                            >
                                                {i.nombre} (Stock: {i.stock}{' '}
                                                {i.unidad})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                            <ArrowUp className="mr-1.5 inline h-4 w-4 text-gold" />
                                            Tipo
                                        </label>
                                        <select
                                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                            value={nuevoMovimiento.tipo}
                                            onChange={(e) =>
                                                setNuevoMovimiento({
                                                    ...nuevoMovimiento,
                                                    tipo: e.target.value as
                                                        'entrada' | 'salida',
                                                })
                                            }
                                        >
                                            <option value="entrada">
                                                Entrada
                                            </option>
                                            <option value="salida">
                                                Salida
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                            value={nuevoMovimiento.cantidad}
                                            onChange={(e) =>
                                                setNuevoMovimiento({
                                                    ...nuevoMovimiento,
                                                    cantidad:
                                                        Number(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        <Building2 className="mr-1.5 inline h-4 w-4 text-gold" />
                                        Proveedor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del proveedor"
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={nuevoMovimiento.proveedor}
                                        onChange={(e) =>
                                            setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                proveedor: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        Observaciones
                                    </label>
                                    <textarea
                                        className="w-full resize-none rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        rows={2}
                                        placeholder="Notas adicionales..."
                                        value={nuevoMovimiento.observaciones}
                                        onChange={(e) =>
                                            setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                observaciones: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-sand p-6">
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarMovimiento}
                                    className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg active:scale-95"
                                >
                                    <Check className="h-4 w-4" />
                                    Guardar movimiento
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
