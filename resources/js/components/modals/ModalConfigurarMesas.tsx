import { router, usePage } from '@inertiajs/react';
import { Power, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { errorsToText, swalError, swalSuccess } from '@/lib/swal';

// ============================================================
// INTERFACES
// ============================================================

interface MesaConfig {
    id: number;
    numero: string;
    capacidad: number;
    sillas: number;
    estado: string;
    activa?: boolean;
}

interface ModalConfigurarMesasProps {
    isOpen: boolean;
    mesas: MesaConfig[];
    pedidos?: Array<{ mesa_id?: number | null; estado: string }>;
    mesaHistorialIds?: number[];
    reservaHistorialIds?: number[];
    onClose: () => void;
}

type TabId = 'nueva' | 'configurar';

const ESTADO_CHIP: Record<string, string> = {
    libre: 'bg-green-500',
    pendiente: 'bg-yellow-500',
    ocupada: 'bg-orange-500',
    reserva: 'bg-blue-500',
    listo_cobrar: 'bg-purple-500',
};

const ESTADO_LABEL: Record<string, string> = {
    libre: 'Libre',
    pendiente: 'Pendiente',
    ocupada: 'Ocupada',
    reserva: 'Reserva',
    listo_cobrar: 'Cobrar',
};

// ============================================================
// COMPONENTE
// ============================================================

export default function ModalConfigurarMesas({
    isOpen,
    mesas,
    pedidos = [],
    mesaHistorialIds = [],
    reservaHistorialIds = [],
    onClose,
}: ModalConfigurarMesasProps) {
    const [tab, setTab] = useState<TabId>('nueva');

    const [numero, setNumero] = useState('');
    const [capacidad, setCapacidad] = useState('');
    const [creando, setCreando] = useState(false);

    // Borradores de sillas en edición por mesa (solo cambios pendientes)
    const [drafts, setDrafts] = useState<Record<number, string>>({});

    // Evita reintentar la misma alerta de éxito al reabrir el modal.
    const flashVistoRef = useRef<string | undefined>(undefined);

    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    // Si llegan mesas nuevas (tras guardar o desde el broadcast), descartar
    // borradores que ya no correspondan al valor persistido.
    useEffect(() => {
        if (isOpen) {
            setDrafts({});
        }
    }, [mesas, isOpen]);

    // Al abrir el modal se marca el flash actual como "ya visto", evitando que
    // una alerta de una acción anterior vuelva a saltar solo por reabrir.
    useEffect(() => {
        if (isOpen) {
            flashVistoRef.current = flash?.success;
        }
    }, [isOpen]);

    // Solo se muestra la alerta cuando llega un flash NUEVO mientras el modal
    // está abierto (p. ej. tras crear/guardar dentro del propio modal).
    useEffect(() => {
        if (
            !isOpen ||
            !flash?.success ||
            flash.success === flashVistoRef.current
        ) {
            return;
        }

        flashVistoRef.current = flash.success;
        swalSuccess('Listo', flash.success).then(() => undefined);
    }, [flash?.success, isOpen]);

    if (!isOpen) {
        return null;
    }

    const mesasOrdenadas = [...mesas].sort((a, b) => {
        const na = Number.parseInt(a.numero, 10) || 0;
        const nb = Number.parseInt(b.numero, 10) || 0;

        return na - nb;
    });

    const sillasValid = (mesa: MesaConfig) => {
        const value = Number.parseInt(drafts[mesa.id] ?? '', 10);

        return Number.isInteger(value) && value >= 1 && value <= 10;
    };

    const hayEdited = (mesa: MesaConfig) => {
        return (
            sillasValid(mesa) &&
            Number.parseInt(drafts[mesa.id] ?? '', 10) !== mesa.sillas
        );
    };

    const hayCambios = mesasOrdenadas.some(hayEdited);

    const guardarTodo = () => {
        const edits = mesasOrdenadas.filter(hayEdited);

        if (edits.length === 0) {
            return;
        }

        const total = edits.length;
        let completados = 0;
        let conError = false;

        const verificarCierre = () => {
            completados += 1;

            if (completados >= total && !conError) {
                onClose();
            }
        };

        edits.forEach((mesa) => {
            router.patch(
                `/mesas/${mesa.id}`,
                { sillas: Number.parseInt(drafts[mesa.id] ?? '', 10) },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['mesas'],
                    onSuccess: verificarCierre,
                    onError: (errors) => {
                        conError = true;
                        verificarCierre();
                        swalError('Error al guardar', errorsToText(errors));
                    },
                },
            );
        });
    };

    const restablecerTodo = () => {
        setDrafts({});

        const pendientes = mesas.filter(
            (mesa) => mesa.sillas !== mesa.capacidad,
        );

        if (pendientes.length === 0) {
            onClose();

            return;
        }

        const total = pendientes.length;
        let completados = 0;
        let conError = false;

        const verificarCierre = () => {
            completados += 1;

            if (completados >= total && !conError) {
                onClose();
            }
        };

        setDrafts({});

        pendientes.forEach((mesa) => {
            router.patch(
                `/mesas/${mesa.id}`,
                { sillas: mesa.capacidad },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['mesas'],
                    onSuccess: verificarCierre,
                    onError: (errors) => {
                        conError = true;
                        verificarCierre();
                        swalError(
                            `No se pudo restablecer la mesa #${mesa.numero}`,
                            errorsToText(errors),
                        );
                    },
                },
            );
        });
    };

    const cambiarActiva = (mesa: MesaConfig) => {
        const activa = !(mesa.activa ?? true);

        router.patch(
            `/mesas/${mesa.id}`,
            { activa },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['mesas'],
                onError: (errors) =>
                    swalError('No se pudo cambiar', errorsToText(errors)),
            },
        );
    };

    const eliminarMesa = (mesa: MesaConfig) => {
        Swal.fire({
            icon: 'warning',
            title: `¿Eliminar ${mesa.numero ? `mesa #${mesa.numero}` : 'esta mesa'}?`,
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--gold)',
            cancelButtonColor: '#6B7280',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            router.delete(`/mesas/${mesa.id}`, {
                preserveScroll: true,
                preserveState: true,
                only: ['mesas'],
                onError: (errors) =>
                    swalError('No se pudo eliminar', errorsToText(errors)),
            });
        });
    };

    const crearMesa = () => {
        const numeroTrim = numero.trim();
        const capacidadNum = Number.parseInt(capacidad, 10);

        if (!numeroTrim) {
            swalError('Número requerido', 'Ingresa el número de la mesa.');

            return;
        }

        if (!Number.isInteger(capacidadNum) || capacidadNum < 1) {
            swalError(
                'Capacidad inválida',
                'Ingresa una capacidad de al menos 1.',
            );

            return;
        }

        if (capacidadNum > 8) {
            swalError(
                'Capacidad máxima',
                'La capacidad máxima soportada por una mesa es 8 personas.',
            );

            return;
        }

        setCreando(true);

        router.post(
            '/mesas',
            {
                numero: numeroTrim,
                capacidad: capacidadNum,
                sillas: capacidadNum,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['mesas'],
                onSuccess: () => {
                    setCreando(false);
                    onClose();
                },
                onError: (errors) => {
                    setCreando(false);
                    swalError('Error al crear mesa', errorsToText(errors));
                },
            },
        );
    };

    const inputBase =
        'w-full rounded-lg border border-wheat bg-cream-soft px-3 py-2 text-sm text-chocolate outline-none transition placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-sand bg-cream px-5 py-3">
                    <h2 className="text-base font-bold text-chocolate">
                        Configurar mesas
                    </h2>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-cocoa-soft transition hover:bg-cream-soft hover:text-cocoa"
                        title="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-shrink-0 gap-2 border-b border-sand bg-cream-soft/50 px-5 py-3">
                    <button
                        onClick={() => setTab('nueva')}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                            tab === 'nueva'
                                ? 'bg-gold text-ink shadow-sm'
                                : 'text-cocoa-soft hover:bg-cream-soft hover:text-cocoa'
                        }`}
                    >
                        Nueva mesa
                    </button>

                    <button
                        onClick={() => setTab('configurar')}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                            tab === 'configurar'
                                ? 'bg-gold text-ink shadow-sm'
                                : 'text-cocoa-soft hover:bg-cream-soft hover:text-cocoa'
                        }`}
                    >
                        Configurar mesas
                        <span className="ml-1.5 text-[10px] text-cocoa-soft">
                            {mesasOrdenadas.length}
                        </span>
                    </button>
                </div>

                {/* Contenido */}
                {tab === 'nueva' ? (
                    <div className="space-y-4 overflow-y-auto p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-semibold text-chocolate">
                                Número de mesa
                                <input
                                    type="text"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    placeholder="Ej: 12"
                                    className={`mt-1 ${inputBase}`}
                                />
                            </label>

                            <label className="block text-sm font-semibold text-chocolate">
                                Capacidad (personas)
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={capacidad}
                                    onChange={(e) =>
                                        setCapacidad(e.target.value)
                                    }
                                    placeholder="Ej: 4"
                                    className={`mt-1 ${inputBase}`}
                                />
                            </label>
                        </div>

                        <button
                            onClick={crearMesa}
                            disabled={creando}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4" />
                            {creando ? 'Creando...' : 'Crear mesa'}
                        </button>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        {/* Barra de herramientas */}
                        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-5 py-3">
                            <p className="text-xs text-cocoa-soft">
                                El número de mesa no se puede cambiar. Ajusta
                                las sillas (máx. 10) y guarda.
                            </p>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={guardarTodo}
                                    disabled={!hayCambios}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-gold-deep active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Guardar los cambios de sillas de todas las mesas"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Guardar
                                </button>

                                <button
                                    onClick={restablecerTodo}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-wheat bg-cream px-3 py-1.5 text-xs font-semibold text-cocoa transition hover:bg-cream-soft active:scale-95"
                                    title="Restablece las sillas de todas las mesas a su estado natural (capacidad)"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Restablecer
                                </button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                            <div className="overflow-hidden rounded-xl border border-wheat bg-cream-soft/50">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-sand bg-cream text-[11px] tracking-wide text-cocoa-soft uppercase">
                                            <th className="px-4 py-2.5 font-bold">
                                                Mesa
                                            </th>
                                            <th className="px-4 py-2.5 font-bold">
                                                Sillas
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-bold">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {mesasOrdenadas.map((mesa, idx) => {
                                            const activaMesa =
                                                mesa.activa ?? true;
                                            const sinHistorial =
                                                !mesaHistorialIds.includes(
                                                    mesa.id,
                                                ) &&
                                                !reservaHistorialIds.includes(
                                                    mesa.id,
                                                );
                                            const puedeDesactivar =
                                                activaMesa &&
                                                mesa.estado === 'libre' &&
                                                pedidos.filter(
                                                    (p) =>
                                                        p.mesa_id === mesa.id &&
                                                        ![
                                                            'pagado',
                                                            'cancelado',
                                                        ].includes(p.estado),
                                                ).length === 0;

                                            return (
                                                <tr
                                                    key={mesa.id}
                                                    className={`border-b border-sand last:border-b-0 ${
                                                        idx % 2 === 1
                                                            ? 'bg-cream/60'
                                                            : ''
                                                    } ${
                                                        activaMesa
                                                            ? 'text-cocoa'
                                                            : 'text-cocoa-soft opacity-55'
                                                    }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                                                    ESTADO_CHIP[
                                                                        mesa
                                                                            .estado
                                                                    ] ??
                                                                    'bg-cocoa-soft'
                                                                } ${activaMesa ? '' : 'opacity-50'}`}
                                                            />

                                                            <div className="min-w-0">
                                                                <span className="block truncate text-sm font-semibold">
                                                                    Mesa #
                                                                    {
                                                                        mesa.numero
                                                                    }
                                                                </span>

                                                                <span className="block text-[11px] text-cocoa-soft">
                                                                    {ESTADO_LABEL[
                                                                        mesa
                                                                            .estado
                                                                    ] ??
                                                                        mesa.estado}{' '}
                                                                    · cap.{' '}
                                                                    {
                                                                        mesa.capacidad
                                                                    }
                                                                </span>
                                                            </div>

                                                            {!activaMesa && (
                                                                <span className="ml-1 rounded-full bg-cocoa-soft/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cocoa-soft uppercase">
                                                                    Desactivada
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={
                                                                drafts[
                                                                    mesa.id
                                                                ] ??
                                                                String(
                                                                    mesa.sillas,
                                                                )
                                                            }
                                                            onChange={(e) =>
                                                                setDrafts(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [mesa.id]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            className="w-20 rounded-lg border border-wheat bg-card px-3 py-1.5 text-sm text-chocolate transition outline-none focus:border-transparent focus:ring-2 focus:ring-gold"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {activaMesa ? (
                                                                <button
                                                                    onClick={() =>
                                                                        cambiarActiva(
                                                                            mesa,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !puedeDesactivar
                                                                    }
                                                                    className="rounded-lg p-2 text-cocoa-soft transition hover:bg-yellow-50 hover:text-yellow-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-cocoa-soft dark:hover:bg-yellow-500/10"
                                                                    title={
                                                                        puedeDesactivar
                                                                            ? 'Desactivar mesa (se oculta y bloquea)'
                                                                            : 'Solo se puede desactivar una mesa libre y sin pedidos activos'
                                                                    }
                                                                >
                                                                    <Power className="h-4 w-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        cambiarActiva(
                                                                            mesa,
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 active:scale-95 dark:hover:bg-yellow-500/10"
                                                                    title="Reactivar mesa"
                                                                >
                                                                    <Power className="h-4 w-4" />
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() =>
                                                                    eliminarMesa(
                                                                        mesa,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !(
                                                                        mesa.estado ===
                                                                            'libre' &&
                                                                        sinHistorial
                                                                    )
                                                                }
                                                                className="rounded-lg p-2 text-cocoa-soft transition hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-cocoa-soft dark:hover:bg-red-500/10"
                                                                title={
                                                                    sinHistorial
                                                                        ? mesa.estado ===
                                                                          'libre'
                                                                            ? 'Eliminar mesa (sin historial)'
                                                                            : 'La mesa está en uso. Libérala para eliminarla.'
                                                                        : 'La mesa tiene historial. Solo puede desactivarse.'
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {mesasOrdenadas.length === 0 && (
                                    <div className="px-4 py-8 text-center text-sm text-cocoa-soft">
                                        No hay mesas registradas aún.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
