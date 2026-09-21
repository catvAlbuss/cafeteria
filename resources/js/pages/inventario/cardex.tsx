import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    Plus,
    Download,
    X,
    Package,
    ArrowDownCircle,
    ArrowUpCircle,
    Calendar,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Plato {
    id: number;
    nombre: string;
    categoria?: string;
    stock: number;
    item_type?: string;
}

interface Insumo {
    id: number;
    nombre: string;
    categoria?: string;
    stock: number;
    unidad?: string;
    item_type?: string;
}

interface Movimiento {
    id: number;
    item_type: 'plato' | 'insumo';
    item_id: number;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    stock_resultante: number;
    motivo?: string;
    submotivo?: string;
    observaciones?: string;
    user?: {
        name: string;
    };
    item?: {
        nombre: string;
        categoria?: string;
    };
    created_at: string;
}

interface PageProps extends Record<string, any> {
    platos?: Plato[];
    insumos?: Insumo[];
    movimientos?: Movimiento[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Cardex() {
    const {
        platos = [],
        insumos = [],
        movimientos = [],
        flash,
    } = usePage<PageProps>().props;

    const [movimientosData, setMovimientosData] =
        useState<Movimiento[]>(movimientos);

    const [busqueda, setBusqueda] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState('todos');
    const [itemTipoFiltro, setItemTipoFiltro] = useState('todos');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const [modalAbierto, setModalAbierto] = useState(false);

    const [nuevoMovimiento, setNuevoMovimiento] = useState({
        producto_id: '',
        tipo: 'entrada' as 'entrada' | 'salida',
        cantidad: '',
        proveedor: '',
        observaciones: '',
    });

    useEffect(() => {
        setMovimientosData(movimientos);
    }, [movimientos]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const todosLosItems = useMemo(() => {
        return [
            ...platos.map((plato) => ({
                ...plato,
                tipoItem: 'plato' as const,
            })),
            ...insumos.map((insumo) => ({
                ...insumo,
                tipoItem: 'insumo' as const,
            })),
        ];
    }, [platos, insumos]);

    const movimientosFiltrados = useMemo(() => {
        return movimientosData.filter((movimiento) => {
            const nombreProducto =
                movimiento.item?.nombre?.toLowerCase() || '';

            const categoria =
                movimiento.item?.categoria?.toLowerCase() || '';

            const textoBusqueda = busqueda.toLowerCase();

            const coincideBusqueda =
                nombreProducto.includes(textoBusqueda) ||
                categoria.includes(textoBusqueda);

            const coincideTipo =
                tipoFiltro === 'todos' ||
                movimiento.tipo === tipoFiltro;

            const coincideItemTipo =
                itemTipoFiltro === 'todos' ||
                movimiento.item_type === itemTipoFiltro;

            let coincideFechaInicio = true;
            let coincideFechaFin = true;

            if (fechaInicio) {
                const fechaMovimiento = new Date(
                    movimiento.created_at
                )
                    .toISOString()
                    .split('T')[0];

                coincideFechaInicio =
                    fechaMovimiento >= fechaInicio;
            }

            if (fechaFin) {
                const fechaMovimiento = new Date(
                    movimiento.created_at
                )
                    .toISOString()
                    .split('T')[0];

                coincideFechaFin = fechaMovimiento <= fechaFin;
            }

            return (
                coincideBusqueda &&
                coincideTipo &&
                coincideItemTipo &&
                coincideFechaInicio &&
                coincideFechaFin
            );
        });
    }, [
        movimientosData,
        busqueda,
        tipoFiltro,
        itemTipoFiltro,
        fechaInicio,
        fechaFin,
    ]);

    const totalEntradas = movimientosData
        .filter((m) => m.tipo === 'entrada')
        .reduce(
            (total, m) => total + Number(m.cantidad),
            0
        );

    const totalSalidas = movimientosData
        .filter((m) => m.tipo === 'salida')
        .reduce(
            (total, m) => total + Number(m.cantidad),
            0
        );

    const stockTotal = [...platos, ...insumos].reduce(
        (total, item) =>
            total + Number(item.stock || 0),
        0
    );

    const limpiarFiltros = () => {
        setBusqueda('');
        setTipoFiltro('todos');
        setItemTipoFiltro('todos');
        setFechaInicio('');
        setFechaFin('');
    };

    const abrirModal = () => {
        setNuevoMovimiento({
            producto_id: '',
            tipo: 'entrada',
            cantidad: '',
            proveedor: '',
            observaciones: '',
        });

        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);

        setNuevoMovimiento({
            producto_id: '',
            tipo: 'entrada',
            cantidad: '',
            proveedor: '',
            observaciones: '',
        });
    };

    const guardarMovimiento = () => {
        const cantidadNumerica = Number(
            nuevoMovimiento.cantidad
        );

        if (
            !nuevoMovimiento.producto_id ||
            !nuevoMovimiento.cantidad ||
            cantidadNumerica <= 0 ||
            Number.isNaN(cantidadNumerica)
        ) {
            toast.warning(
                'Complete todos los campos correctamente'
            );
            return;
        }

        const [tipoItem, id] =
            nuevoMovimiento.producto_id.split('-');

        const item = todosLosItems.find(
            (item) =>
                item.tipoItem === tipoItem &&
                item.id === Number(id)
        );

        if (!item) {
            toast.error(
                'Producto o insumo no encontrado'
            );
            return;
        }

        if (
            nuevoMovimiento.tipo === 'salida' &&
            Number(item.stock) < cantidadNumerica
        ) {
            toast.error(
                `Stock insuficiente para ${item.nombre}. Stock actual: ${item.stock}`
            );
            return;
        }

        router.post(
            '/cardex/movimiento',
            {
                item_type: tipoItem,
                item_id: Number(id),
                tipo: nuevoMovimiento.tipo,
                cantidad: cantidadNumerica,
                motivo: 'ajuste',
                observaciones:
                    [
                        nuevoMovimiento.proveedor
                            ? `Proveedor: ${nuevoMovimiento.proveedor}`
                            : '',
                        nuevoMovimiento.observaciones || '',
                    ]
                        .filter(Boolean)
                        .join(' | ') || null,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.success(
                        '✅ Movimiento registrado correctamente'
                    );

                    cerrarModal();

                    router.reload({
                        only: [
                            'platos',
                            'insumos',
                            'movimientos',
                        ],
                    });
                },

                onError: (errors) => {
                    console.error(errors);

                    const primerError =
                        Object.values(errors)[0];

                    if (typeof primerError === 'string') {
                        toast.error(primerError);
                    } else {
                        toast.error(
                            'No se pudo registrar el movimiento'
                        );
                    }
                },
            }
        );
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return '-';

        const fechaObj = new Date(fecha);

        return fechaObj.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Cardex" />

            <div className="min-h-screen bg-[#FBF3E7] px-4 py-6 md:px-6">
                <div className="mx-auto max-w-7xl">

                    {/* HEADER */}
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[#2D1B1A]">
                                📊 Cardex
                            </h1>

                            <p className="mt-1 text-sm text-[#5A3D2B]">
                                Control de inventario y movimientos de productos
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={abrirModal}
                                className="flex items-center gap-2 rounded-xl bg-[#C9A96E] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#B8975D]"
                            >
                                <Plus size={18} />
                                Nuevo movimiento
                            </button>

                            <button
                                onClick={() =>
                                    window.open(
                                        '/cardex/export',
                                        '_blank'
                                    )
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#2D1B1A] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#4A2E2B]"
                            >
                                <Download size={18} />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* RESUMEN */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="rounded-xl bg-[#F7EEDC] p-2.5">
                                    <Package
                                        size={22}
                                        className="text-[#8A5A2B]"
                                    />
                                </div>

                                <span className="text-xs font-medium text-[#8A5A2B]">
                                    STOCK
                                </span>
                            </div>

                            <p className="text-2xl font-bold text-[#2D1B1A]">
                                {stockTotal.toLocaleString('es-PE')}
                            </p>

                            <p className="mt-1 text-sm text-[#5A3D2B]">
                                Stock total
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="rounded-xl bg-green-50 p-2.5">
                                    <ArrowDownCircle
                                        size={22}
                                        className="text-green-600"
                                    />
                                </div>

                                <span className="text-xs font-medium text-green-600">
                                    ENTRADAS
                                </span>
                            </div>

                            <p className="text-2xl font-bold text-[#2D1B1A]">
                                {totalEntradas.toLocaleString('es-PE')}
                            </p>

                            <p className="mt-1 text-sm text-[#5A3D2B]">
                                Total de entradas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="rounded-xl bg-red-50 p-2.5">
                                    <ArrowUpCircle
                                        size={22}
                                        className="text-red-600"
                                    />
                                </div>

                                <span className="text-xs font-medium text-red-600">
                                    SALIDAS
                                </span>
                            </div>

                            <p className="text-2xl font-bold text-[#2D1B1A]">
                                {totalSalidas.toLocaleString('es-PE')}
                            </p>

                            <p className="mt-1 text-sm text-[#5A3D2B]">
                                Total de salidas
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[#2D1B1A] p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="rounded-xl bg-white/10 p-2.5">
                                    <Calendar
                                        size={22}
                                        className="text-[#C9A96E]"
                                    />
                                </div>

                                <span className="text-xs font-medium text-[#C9A96E]">
                                    MOVIMIENTOS
                                </span>
                            </div>

                            <p className="text-2xl font-bold text-white">
                                {movimientosData.length}
                            </p>

                            <p className="mt-1 text-sm text-white/70">
                                Movimientos registrados
                            </p>
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className="mb-6 rounded-2xl border border-[#F3E1C8] bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">

                            <div className="relative lg:col-span-2">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A5A2B]"
                                />

                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) =>
                                        setBusqueda(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Buscar producto..."
                                    className="w-full rounded-xl border border-[#E8D5C4] bg-white py-2.5 pl-10 pr-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                                />
                            </div>

                            <select
                                value={tipoFiltro}
                                onChange={(e) =>
                                    setTipoFiltro(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-[#E8D5C4] bg-white px-3 py-2.5 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                            >
                                <option value="todos">
                                    Todos los movimientos
                                </option>

                                <option value="entrada">
                                    Entradas
                                </option>

                                <option value="salida">
                                    Salidas
                                </option>
                            </select>

                            <select
                                value={itemTipoFiltro}
                                onChange={(e) =>
                                    setItemTipoFiltro(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-[#E8D5C4] bg-white px-3 py-2.5 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                            >
                                <option value="todos">
                                    Todos
                                </option>

                                <option value="plato">
                                    Platos
                                </option>

                                <option value="insumo">
                                    Insumos
                                </option>
                            </select>

                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) =>
                                    setFechaInicio(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-[#E8D5C4] bg-white px-3 py-2.5 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                            />

                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) =>
                                    setFechaFin(
                                        e.target.value
                                    )
                                }
                                className="rounded-xl border border-[#E8D5C4] bg-white px-3 py-2.5 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                            />
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={limpiarFiltros}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#8A5A2B] transition hover:bg-[#FBF3E7]"
                            >
                                <X size={16} />
                                Limpiar filtros
                            </button>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="overflow-hidden rounded-2xl border border-[#F3E1C8] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-250">
                                <thead>
                                    <tr className="border-b border-[#F3E1C8] bg-[#FBF3E7]">

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Fecha
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Tipo
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Producto
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Categoría
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Tipo Mov.
                                        </th>

                                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Cantidad
                                        </th>

                                        <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Stock final
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#5A3D2B]">
                                            Motivo
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>
                                    {movimientosFiltrados.length > 0 ? (
                                        movimientosFiltrados.map(
                                            (movimiento) => (
                                                <tr
                                                    key={movimiento.id}
                                                    className="border-b border-[#F3E1C8] transition hover:bg-[#FFFAF4]"
                                                >
                                                    <td className="px-4 py-4 text-sm text-[#5A3D2B]">
                                                        {formatearFecha(
                                                            movimiento.created_at
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {movimiento.tipo ===
                                                        'entrada' ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                                                <ArrowDownCircle
                                                                    size={14}
                                                                />
                                                                Entrada
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                                <ArrowUpCircle
                                                                    size={14}
                                                                />
                                                                Salida
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-lg bg-[#F7EEDC] p-2">
                                                                <Package
                                                                    size={17}
                                                                    className="text-[#8A5A2B]"
                                                                />
                                                            </div>

                                                            <div>
                                                                <p className="font-semibold text-[#2D1B1A]">
                                                                    {movimiento.item?.nombre ||
                                                                        '-'}
                                                                </p>

                                                                <p className="text-xs capitalize text-[#8A5A2B]">
                                                                    {movimiento.item_type ===
                                                                    'plato'
                                                                        ? 'Plato'
                                                                        : 'Insumo'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-[#5A3D2B]">
                                                        {movimiento.item?.categoria ||
                                                            '-'}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span className="rounded-lg bg-[#F7EEDC] px-2.5 py-1 text-xs font-medium capitalize text-[#8A5A2B]">
                                                            {movimiento.item_type}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-semibold text-[#2D1B1A]">
                                                        {Number(
                                                            movimiento.cantidad
                                                        ).toLocaleString(
                                                            'es-PE'
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-bold text-[#8A5A2B]">
                                                        {Number(
                                                            movimiento.stock_resultante
                                                        ).toLocaleString(
                                                            'es-PE'
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-[#5A3D2B]">
                                                        {movimiento.motivo ||
                                                            'ajuste'}
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-6 py-14 text-center"
                                            >
                                                <Package
                                                    size={42}
                                                    className="mx-auto mb-3 text-[#C9A96E]"
                                                />

                                                <p className="font-semibold text-[#2D1B1A]">
                                                    No hay movimientos
                                                </p>

                                                <p className="mt-1 text-sm text-[#8A6A52]">
                                                    No se encontraron
                                                    movimientos con los
                                                    filtros seleccionados.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVO MOVIMIENTO */}
            {modalAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

                        {/* CABECERA DEL MODAL */}
                        <div className="flex items-center justify-between border-b border-[#F3E1C8] px-5 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#2D1B1A]">
                                    Nuevo movimiento
                                </h2>

                                <p className="mt-1 text-sm text-[#8A6A52]">
                                    Registra una entrada o salida de inventario
                                </p>
                            </div>

                            <button
                                onClick={cerrarModal}
                                className="rounded-lg p-2 text-[#8A6A52] transition hover:bg-[#FBF3E7] hover:text-[#2D1B1A]"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {/* CONTENIDO */}
                        <div className="space-y-4 px-5 py-5">

                            {/* PRODUCTO */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#2D1B1A]">
                                    Producto / Insumo
                                </label>

                                <select
                                    value={
                                        nuevoMovimiento.producto_id
                                    }
                                    onChange={(e) =>
                                        setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            producto_id:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                                >
                                    <option value="">
                                        Seleccione un producto o insumo
                                    </option>

                                    {platos.length > 0 && (
                                        <optgroup label="Platos">
                                            {platos.map((plato) => (
                                                <option
                                                    key={`plato-${plato.id}`}
                                                    value={`plato-${plato.id}`}
                                                >
                                                    {plato.nombre} — Stock:{' '}
                                                    {plato.stock}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {insumos.length > 0 && (
                                        <optgroup label="Insumos">
                                            {insumos.map((insumo) => (
                                                <option
                                                    key={`insumo-${insumo.id}`}
                                                    value={`insumo-${insumo.id}`}
                                                >
                                                    {insumo.nombre} — Stock:{' '}
                                                    {insumo.stock}{' '}
                                                    {insumo.unidad || ''}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            {/* TIPO Y CANTIDAD */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#2D1B1A]">
                                        Tipo de movimiento
                                    </label>

                                    <select
                                        value={
                                            nuevoMovimiento.tipo
                                        }
                                        onChange={(e) =>
                                            setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                tipo: e.target
                                                    .value as
                                                    | 'entrada'
                                                    | 'salida',
                                            })
                                        }
                                        className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
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
                                    <label className="mb-2 block text-sm font-semibold text-[#2D1B1A]">
                                        Cantidad
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            nuevoMovimiento.cantidad
                                        }
                                        onChange={(e) =>
                                            setNuevoMovimiento({
                                                ...nuevoMovimiento,
                                                cantidad:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Ingrese cantidad"
                                        className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                                    />
                                </div>

                            </div>

                            {/* PROVEEDOR */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#2D1B1A]">
                                    Proveedor
                                </label>

                                <input
                                    type="text"
                                    value={
                                        nuevoMovimiento.proveedor
                                    }
                                    onChange={(e) =>
                                        setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            proveedor:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Ingrese proveedor (opcional)"
                                    className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                                />
                            </div>

                            {/* OBSERVACIONES */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#2D1B1A]">
                                    Observaciones
                                </label>

                                <textarea
                                    value={
                                        nuevoMovimiento.observaciones
                                    }
                                    onChange={(e) =>
                                        setNuevoMovimiento({
                                            ...nuevoMovimiento,
                                            observaciones:
                                                e.target.value,
                                        })
                                    }
                                    rows={3}
                                    placeholder="Ingrese observaciones (opcional)"
                                    className="w-full resize-none rounded-xl border border-[#E8D5C4] bg-white px-4 py-3 text-sm text-[#2D1B1A] outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
                                />
                            </div>
                        </div>

                        {/* BOTONES */}
                        <div className="flex justify-end gap-3 border-t border-[#F3E1C8] px-5 py-4">

                            <button
                                onClick={cerrarModal}
                                className="rounded-xl border border-[#E8D5C4] px-5 py-2.5 font-semibold text-[#5A3D2B] transition hover:bg-[#FBF3E7]"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={guardarMovimiento}
                                className="flex items-center gap-2 rounded-xl bg-[#C9A96E] px-5 py-2.5 font-semibold text-white transition hover:bg-[#B8975D]"
                            >
                                <Plus size={18} />
                                Guardar movimiento
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}