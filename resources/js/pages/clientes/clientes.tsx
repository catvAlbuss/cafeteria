import { Head, usePage, router } from '@inertiajs/react';
import {
    CheckCircle,
    DollarSign,
    FileDigit,
    Mail,
    Phone,
    Plus,
    Search,
    Settings,
    Star,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Cliente {
    id: number;
    nombre: string;
    documento: string | null;
    tipoDocumento: 'dni' | 'ruc' | null;
    telefono: string;
    email: string;
    direccion: string;
    pedidos: number;
    pedidosTotal: number;
    totalGastado: number;
    totalGastadoTotal: number;
    estado: 'activo' | 'vip' | 'inactivo';
    fechaRegistro: string;
    ultimaVisita: string;
}

interface Estadisticas {
    total: number;
    activos: number;
    vip: number;
    inactivos: number;
    totalGastado: number;
}

export default function Clientes() {
    const { clientes, estadisticas, configuracion } = usePage().props as any;

    // 📋 Estado del modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVerAbierto, setModalVerAbierto] = useState(false);
    const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] =
        useState<Cliente | null>(null);
    const [esEdicion, setEsEdicion] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [guardandoConfig, setGuardandoConfig] = useState(false);

    // 📋 Estado del formulario
    const [formulario, setFormulario] = useState({
        id: 0,
        nombre: '',
        tipoDocumento: 'dni' as 'dni' | 'ruc',
        documento: '',
        telefono: '',
        email: '',
        direccion: '',
        estado: 'activo' as 'activo' | 'vip' | 'inactivo',
    });

    // 📋 Configuración (umbral de registro automático)
    const [minCompras, setMinCompras] = useState(
        configuracion?.minCompras ?? 6,
    );

    // 📋 Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // 📊 Clientes filtrados
    const clientesFiltrados = (clientes as Cliente[]).filter((c) => {
        const busquedaOk =
            !busqueda ||
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.documento || '').includes(busqueda) ||
            (c.telefono || '').includes(busqueda) ||
            (c.email || '').toLowerCase().includes(busqueda.toLowerCase());
        const estadoOk = !filtroEstado || c.estado === filtroEstado;

        return busquedaOk && estadoOk;
    });

    // 🎨 Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'activo':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    label: 'Activo',
                    icon: CheckCircle,
                };
            case 'vip':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    label: 'VIP',
                    icon: Star,
                };
            case 'inactivo':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    label: 'Inactivo',
                    icon: XCircle,
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    label: 'Desconocido',
                    icon: XCircle,
                };
        }
    };

    // 📊 Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `S/ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    const formatoDocumento = (c: Cliente): string => {
        if (!c.documento) {
            return '—';
        }

        const prefijo = c.tipoDocumento === 'ruc' ? 'RUC' : 'DNI';

        return `${prefijo} ${c.documento}`;
    };

    // 📋 Funciones CRUD
    const abrirNuevo = () => {
        setEsEdicion(false);
        setFormulario({
            id: 0,
            nombre: '',
            tipoDocumento: 'dni',
            documento: '',
            telefono: '',
            email: '',
            direccion: '',
            estado: 'activo',
        });
        setModalAbierto(true);
    };

    const abrirEditar = (cliente: Cliente) => {
        setEsEdicion(true);
        setFormulario({
            id: cliente.id,
            nombre: cliente.nombre,
            tipoDocumento: cliente.tipoDocumento ?? 'dni',
            documento: cliente.documento ?? '',
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
            estado: cliente.estado,
        });
        setModalAbierto(true);
    };

    const guardarCliente = () => {
        if (!formulario.nombre) {
            toast.error('Complete el campo obligatorio (Nombre).');

            return;
        }

        if (
            formulario.documento &&
            formulario.documento.length <
                (formulario.tipoDocumento === 'ruc' ? 11 : 8)
        ) {
            toast.error(
                'El documento debe tener la cantidad correcta de dígitos.',
            );

            return;
        }

        setGuardando(true);

        const datos = {
            nombre: formulario.nombre,
            tipo_documento: formulario.documento
                ? formulario.tipoDocumento
                : null,
            documento: formulario.documento || null,
            telefono: formulario.telefono,
            email: formulario.email,
            direccion: formulario.direccion,
            estado: formulario.estado,
        };

        if (esEdicion) {
            router.patch(`/clientes/${formulario.id}`, datos, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Cliente actualizado correctamente');
                    setModalAbierto(false);
                    setGuardando(false);
                },
                onError: (errors) => {
                    setGuardando(false);
                    const mensaje =
                        Object.values(errors)[0] ||
                        'No se pudo actualizar el cliente';
                    toast.error(String(mensaje));
                },
            });
        } else {
            router.post('/clientes', datos, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Cliente creado correctamente');
                    setModalAbierto(false);
                    setGuardando(false);
                },
                onError: (errors) => {
                    setGuardando(false);
                    const mensaje =
                        Object.values(errors)[0] ||
                        'No se pudo crear el cliente';
                    toast.error(String(mensaje));
                },
            });
        }
    };

    const eliminarCliente = (cliente: Cliente) => {
        if (!confirm(`¿Seguro que deseas eliminar a "${cliente.nombre}"?`)) {
            return;
        }

        router.delete(`/clientes/${cliente.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Cliente eliminado correctamente'),
            onError: (errors) => {
                const mensaje =
                    Object.values(errors)[0] ||
                    'No se pudo eliminar el cliente';
                toast.error(String(mensaje));
            },
        });
    };

    const verCliente = (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setModalVerAbierto(true);
    };

    const guardarConfiguracion = () => {
        if (!minCompras || minCompras < 1) {
            toast.error('El umbral mínimo es 1 compra.');

            return;
        }

        setGuardandoConfig(true);
        router.patch(
            '/clientes/configuracion',
            { minCompras },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Configuración actualizada correctamente');
                    setModalConfigAbierto(false);
                    setGuardandoConfig(false);
                },
                onError: (errors) => {
                    setGuardandoConfig(false);
                    const mensaje =
                        Object.values(errors)[0] ||
                        'No se pudo actualizar la configuración';
                    toast.error(String(mensaje));
                },
            },
        );
    };

    const stats = estadisticas as Estadisticas;

    return (
        <>
            <Head title="Clientes - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto bg-[#FBF3E7] p-6">
                {/* ===== HEADER ===== */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">
                            {' '}
                            Clientes
                        </h1>
                        <p className="mt-1 text-sm text-[#5A3D2B]">
                            Gestión y control de clientes del sistema
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setModalConfigAbierto(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#E8D5C4] bg-white px-4 py-2.5 font-semibold text-[#5A3D2B] shadow-sm transition hover:bg-gray-50"
                            title="Configurar umbral de registro automático"
                        >
                            <Settings className="h-4 w-4" />
                            Configuración
                        </button>
                        <button
                            onClick={abrirNuevo}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#C9A96E] px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-[#B8975D]"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Cliente
                        </button>
                    </div>
                </div>

                {/* ===== ESTADÍSTICAS ===== */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A3D2B]">
                                    Total clientes
                                </p>
                                <p className="mt-1 text-3xl font-bold text-[#2D1B1A]">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E1C8]">
                                <Users className="h-6 w-6 text-[#8A5A2B]" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A3D2B]">
                                    Activos
                                </p>
                                <p className="mt-1 text-3xl font-bold text-green-600">
                                    {stats.activos}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#F3E1C8] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A3D2B]">
                                    VIP
                                </p>
                                <p className="mt-1 text-3xl font-bold text-yellow-600">
                                    {stats.vip}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                                <Star className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-[#2D1B1A] p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/60">
                                    Total gastado (30 días)
                                </p>
                                <p className="mt-1 text-3xl font-bold">
                                    {formatCurrency(stats.totalGastado)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <DollarSign className="h-6 w-6 text-[#C9A96E]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== BUSCADOR Y FILTROS ===== */}
                <div className="rounded-2xl border border-[#F3E1C8] bg-white p-3 shadow-sm">
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                        <div className="relative w-full flex-1 sm:w-auto">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#8D6B53]" />
                            <input
                                type="text"
                                placeholder="Buscar cliente, DNI o RUC..."
                                className="w-full rounded-lg border border-[#E8D5C4] bg-white py-2 pr-3 pl-9 text-sm text-[#2D1B1A] placeholder-[#8D6B53] transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 focus:outline-none"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <select
                                className="min-w-[130px] appearance-none rounded-lg border border-[#E8D5C4] bg-white px-3 py-2 text-sm text-[#2D1B1A] transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 focus:outline-none"
                                value={filtroEstado}
                                onChange={(e) =>
                                    setFiltroEstado(e.target.value)
                                }
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="vip">VIP</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                            <button
                                onClick={() => {
                                    setBusqueda('');
                                    setFiltroEstado('');
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-[#E8D5C4] px-3 py-2 text-xs font-medium whitespace-nowrap text-[#5A3D2B] transition hover:border-[#C9A96E] hover:bg-[#FBF3E7]"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 px-1 text-[11px] text-[#8D6B53]">
                        Los clientes se identifican automáticamente con el
                        DNI/RUC de cada comprobante. El estado se calcula según
                        las compras de los últimos 30 días (mín.{' '}
                        {configuracion?.minCompras ?? 6} compras para
                        registrarse).
                    </p>
                </div>

                {/* ===== TABLA DE CLIENTES ===== */}
                <div className="overflow-hidden rounded-2xl border border-[#F3E1C8] bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#F3E1C8] p-5">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">
                            Listado de clientes
                        </h2>
                        <span className="text-sm text-[#5A3D2B]">
                            {clientesFiltrados.length} clientes
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Documento
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Contacto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Pedidos (30d)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Total gastado (30d)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clientesFiltrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-10 text-center text-gray-400"
                                        >
                                            No hay clientes
                                        </td>
                                    </tr>
                                ) : (
                                    clientesFiltrados.map((cliente) => {
                                        const estadoConfig = getEstadoConfig(
                                            cliente.estado,
                                        );
                                        const EstadoIcon = estadoConfig.icon;

                                        return (
                                            <tr
                                                key={cliente.id}
                                                className="transition hover:bg-[#FBF3E7]"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <p className="font-medium text-[#2D1B1A]">
                                                                {cliente.nombre}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                Registro:{' '}
                                                                {
                                                                    cliente.fechaRegistro
                                                                }{' '}
                                                                · Total{' '}
                                                                {
                                                                    cliente.pedidosTotal
                                                                }{' '}
                                                                pedidos
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-sm text-[#5A3D2B]">
                                                        <FileDigit className="h-3 w-3 text-gray-400" />
                                                        {formatoDocumento(
                                                            cliente,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-0.5">
                                                        <p className="flex items-center gap-1 text-sm text-[#5A3D2B]">
                                                            <Phone className="h-3 w-3" />{' '}
                                                            {cliente.telefono ||
                                                                '—'}
                                                        </p>
                                                        {cliente.email && (
                                                            <p className="flex items-center gap-1 text-xs text-gray-400">
                                                                <Mail className="h-3 w-3" />{' '}
                                                                {cliente.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#5A3D2B]">
                                                    {cliente.pedidos}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-[#2D1B1A]">
                                                    {formatCurrency(
                                                        cliente.totalGastado,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text} flex w-fit items-center gap-1`}
                                                    >
                                                        <EstadoIcon className="h-3 w-3" />
                                                        {estadoConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1.5">
                                                        <button
                                                            onClick={() =>
                                                                verCliente(
                                                                    cliente,
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                                        >
                                                            Ver
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                abrirEditar(
                                                                    cliente,
                                                                )
                                                            }
                                                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                eliminarCliente(
                                                                    cliente,
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* MODAL: Nuevo/Editar Cliente */}
                {/* ============================================================ */}
                {modalAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-[#F3E1C8] p-6">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">
                                    {esEdicion
                                        ? 'Editar Cliente'
                                        : 'Nuevo Cliente'}
                                </h2>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="text-3xl text-gray-400 transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Nombre completo *
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={formulario.nombre}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                nombre: e.target.value,
                                            })
                                        }
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Documento (DNI/RUC)
                                    </label>
                                    <div className="mt-1 flex gap-2">
                                        <select
                                            className="rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                            value={formulario.tipoDocumento}
                                            onChange={(e) =>
                                                setFormulario({
                                                    ...formulario,
                                                    tipoDocumento: e.target
                                                        .value as 'dni' | 'ruc',
                                                })
                                            }
                                        >
                                            <option value="dni">DNI</option>
                                            <option value="ruc">RUC</option>
                                        </select>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={
                                                formulario.tipoDocumento ===
                                                'ruc'
                                                    ? 11
                                                    : 8
                                            }
                                            className="flex-1 rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                            value={formulario.documento}
                                            onChange={(e) =>
                                                setFormulario({
                                                    ...formulario,
                                                    documento: e.target.value
                                                        .replace(/\D/g, '')
                                                        .slice(
                                                            0,
                                                            formulario.tipoDocumento ===
                                                                'ruc'
                                                                ? 11
                                                                : 8,
                                                        ),
                                                })
                                            }
                                            placeholder={
                                                formulario.tipoDocumento ===
                                                'ruc'
                                                    ? 'Ej: 20123456789'
                                                    : 'Ej: 71234567'
                                            }
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Opcional. Si se deja vacío, el cliente
                                        no estará vinculado a comprobantes.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={formulario.telefono}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                telefono: e.target.value,
                                            })
                                        }
                                        placeholder="987 654 321"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Correo electrónico
                                    </label>
                                    <input
                                        type="email"
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={formulario.email}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                email: e.target.value,
                                            })
                                        }
                                        placeholder="cliente@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={formulario.direccion}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                direccion: e.target.value,
                                            })
                                        }
                                        placeholder="Av. Principal 123"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Estado
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={formulario.estado}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                estado: e.target.value as
                                                    | 'activo'
                                                    | 'vip'
                                                    | 'inactivo',
                                            })
                                        }
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="vip">VIP</option>
                                        <option value="inactivo">
                                            Inactivo
                                        </option>
                                    </select>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Para clientes con documento, el estado
                                        se recalcula automáticamente según sus
                                        compras.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-[#F3E1C8] p-6">
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="rounded-xl bg-gray-100 px-5 py-2.5 font-semibold transition hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarCliente}
                                    disabled={guardando}
                                    className="rounded-xl bg-[#C9A96E] px-5 py-2.5 font-semibold text-white transition hover:bg-[#B8975D] disabled:opacity-50"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: Ver Cliente */}
                {/* ============================================================ */}
                {modalVerAbierto && clienteSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-[#F3E1C8] p-6">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">
                                    Detalle del Cliente
                                </h2>
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="text-3xl text-gray-400 transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E1C8] text-3xl">
                                        {clienteSeleccionado.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#2D1B1A]">
                                            {clienteSeleccionado.nombre}
                                        </h3>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                clienteSeleccionado.estado ===
                                                'activo'
                                                    ? 'bg-green-100 text-green-700'
                                                    : clienteSeleccionado.estado ===
                                                        'vip'
                                                      ? 'bg-yellow-100 text-yellow-700'
                                                      : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {clienteSeleccionado.estado ===
                                            'activo'
                                                ? 'Activo'
                                                : clienteSeleccionado.estado ===
                                                    'vip'
                                                  ? 'VIP'
                                                  : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Documento
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {formatoDocumento(
                                                clienteSeleccionado,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Teléfono
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.telefono ||
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Correo
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.email || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Dirección
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.direccion ||
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Total gastado (30 días)
                                        </p>
                                        <p className="font-semibold text-[#C9A96E]">
                                            {formatCurrency(
                                                clienteSeleccionado.totalGastado,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Pedidos (30 días)
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.pedidos}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Total gastado histórico
                                        </p>
                                        <p className="font-semibold text-[#C9A96E]">
                                            {formatCurrency(
                                                clienteSeleccionado.totalGastadoTotal,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Pedidos históricos
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.pedidosTotal}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Última visita
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.ultimaVisita ||
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Fecha de registro
                                        </p>
                                        <p className="font-semibold text-[#2D1B1A]">
                                            {clienteSeleccionado.fechaRegistro}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-[#F3E1C8] p-6">
                                <button
                                    onClick={() => setModalVerAbierto(false)}
                                    className="rounded-xl bg-gray-100 px-5 py-2.5 font-semibold transition hover:bg-gray-200"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* MODAL: Configuración */}
                {/* ============================================================ */}
                {modalConfigAbierto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-[#F3E1C8] p-6">
                                <h2 className="text-2xl font-bold text-[#2D1B1A]">
                                    Configuración de Clientes
                                </h2>
                                <button
                                    onClick={() => setModalConfigAbierto(false)}
                                    className="text-3xl text-gray-400 transition hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Compras mínimas para registro automático
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        className="mt-1 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-[#C9A96E]"
                                        value={minCompras}
                                        onChange={(e) =>
                                            setMinCompras(
                                                Number(e.target.value),
                                            )
                                        }
                                        placeholder="Ej: 6"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Un cliente con DNI/RUC se registra
                                        automáticamente al alcanzar este número
                                        de compras en el histórico.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-[#F3E1C8] p-6">
                                <button
                                    onClick={() => setModalConfigAbierto(false)}
                                    className="rounded-xl bg-gray-100 px-5 py-2.5 font-semibold transition hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarConfiguracion}
                                    disabled={guardandoConfig}
                                    className="rounded-xl bg-[#C9A96E] px-5 py-2.5 font-semibold text-white transition hover:bg-[#B8975D] disabled:opacity-50"
                                >
                                    {guardandoConfig
                                        ? 'Guardando...'
                                        : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
