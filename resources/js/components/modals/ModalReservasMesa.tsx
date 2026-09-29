import { router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarPlus,
    Check,
    Clock,
    Power,
    ThermometerSun,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { errorsToText, swalError, swalSuccess } from '@/lib/swal';

// ============================================================
// INTERFACES
// ============================================================

export interface Reserva {
    id: number;
    mesa_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    cliente: string;
    telefono?: string | null;
    personas: number;
    notas?: string | null;
    estado: 'confirmada' | 'atendida' | 'cancelada' | 'expirada';
}

interface ModalReservasMesaProps {
    isOpen: boolean;
    mesa: {
        id: number;
        numero: string;
        capacidad: number;
        estado: string;
    };
    reservas: Reserva[];
    puedeGestionar: boolean;
    margenInicioMinutos?: number;
    onClose: () => void;
    onTomarPedido: () => void;
}

// ============================================================
// AYUDAS
// ============================================================

const formatearFechaHoy = (): string => {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');

    return `${hoy.getFullYear()}-${mm}-${dd}`;
};

const horaActual = (): string => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');

    return `${hh}:${mm}`;
};

const sumarMinutos = (hora: string, minutos: number): string => {
    if (!hora) {
        return '';
    }

    const [hh, mm] = hora.split(':').map(Number);
    const total = hh * 60 + mm + minutos;

    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const ESTADO_CHIP: Record<Reserva['estado'], string> = {
    confirmada:
        'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/40',
    atendida:
        'bg-green-500/15 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/40',
    cancelada:
        'bg-red-500/10 text-red-500 dark:text-red-400 border-red-300 dark:border-red-500/40',
    expirada: 'bg-cocoa-soft/10 text-cocoa-soft border-cocoa-soft/40',
};

const ESTADO_LABEL: Record<Reserva['estado'], string> = {
    confirmada: 'Confirmada',
    atendida: 'Atendida',
    cancelada: 'Cancelada',
    expirada: 'Expirada',
};

// ============================================================
// COMPONENTE
// ============================================================

export default function ModalReservasMesa({
    isOpen,
    mesa,
    reservas,
    puedeGestionar,
    margenInicioMinutos = 10,
    onClose,
    onTomarPedido,
}: ModalReservasMesaProps) {
    const [cliente, setCliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [fecha, setFecha] = useState(formatearFechaHoy);
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [personas, setPersonas] = useState('');
    const [creando, setCreando] = useState(false);
    const [liberando, setLiberando] = useState(false);

    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    // Evita reintentar la misma alerta de éxito al reabrir el modal.
    const flashVistoRef = useRef<string | undefined>(undefined);

    // Al abrir el modal se marca el flash actual como "ya visto", evitando que
    // una alerta de una acción anterior vuelva a saltar solo por reabrir.
    useEffect(() => {
        if (isOpen) {
            flashVistoRef.current = flash?.success;
        }
    }, [isOpen]);

    // Solo se muestra la alerta cuando llega un flash NUEVO mientras el modal
    // está abierto (p. ej. tras crear/liberar dentro del propio modal).
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

    const activas = reservas
        .filter((r) => r.estado === 'confirmada')
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const ahora = horaActual();
    const limiteInicio = sumarMinutos(ahora, margenInicioMinutos);

    // Reserva activa: dentro de la ventana de anticipación y aún no terminó.
    const activa =
        activas.find(
            (r) => r.hora_fin > ahora && r.hora_inicio <= limiteInicio,
        ) ?? null;

    const reservasPasadas = reservas
        .filter((r) => r.id !== activa?.id)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const inputBase =
        'w-full rounded-lg border border-wheat bg-cream-soft px-3 py-2 text-sm text-chocolate outline-none transition placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold';

    const crearReserva = () => {
        const personasNum = Number.parseInt(personas, 10);

        if (!cliente.trim()) {
            swalError('Cliente requerido', 'Ingresa el nombre de la reserva.');

            return;
        }

        if (!horaInicio || !horaFin) {
            swalError(
                'Horario requerido',
                'Indica la hora de inicio y fin de la reserva.',
            );

            return;
        }

        if (horaInicio >= horaFin) {
            swalError(
                'Horario inválido',
                'La hora de fin debe ser posterior a la hora de inicio.',
            );

            return;
        }

        if (!Number.isInteger(personasNum) || personasNum < 1) {
            swalError('Personas inválidas', 'Ingresa al menos 1 persona.');

            return;
        }

        const confirmar = () => {
            setCreando(true);

            router.post(
                `/mesas/${mesa.id}/reservas`,
                {
                    cliente: cliente.trim(),
                    telefono: telefono.trim() || null,
                    fecha,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    personas: personasNum,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['reservas', 'mesas'],
                    onSuccess: () => {
                        setCreando(false);
                        setCliente('');
                        setTelefono('');
                        setHoraInicio('');
                        setHoraFin('');
                        setPersonas('');
                    },
                    onError: (errors) => {
                        setCreando(false);
                        swalError('No se pudo crear', errorsToText(errors));
                    },
                },
            );
        };

        if (personasNum > mesa.capacidad) {
            Swal.fire({
                icon: 'warning',
                title: 'Supera la capacidad',
                html: `La mesa está diseñada para <b>${mesa.capacidad}</b> personas y la reserva es para <b>${personasNum}</b>. ¿De todas formas crear la reserva?`,
                showCancelButton: true,
                confirmButtonText: 'Sí, reservar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--gold)',
                cancelButtonColor: '#6B7280',
            }).then((result) => {
                if (result.isConfirmed) {
                    confirmar();
                }
            });

            return;
        }

        confirmar();
    };

    const liberarReserva = () => {
        Swal.fire({
            title: '¿Liberar la reserva?',
            text: 'La reserva quedará como CANCELADA en el historial (no se borra).',
            input: 'text',
            inputLabel: 'Motivo (opcional)',
            inputPlaceholder: 'Ej: El cliente no llegó',
            showCancelButton: true,
            confirmButtonText: 'Sí, liberar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--gold)',
            cancelButtonColor: '#6B7280',
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            setLiberando(true);

            router.patch(
                `/mesas/${mesa.id}/reservas/cancelar`,
                { motivo: result.value || '' },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['reservas', 'mesas'],
                    onSuccess: () => setLiberando(false),
                    onError: (errors) => {
                        setLiberando(false);
                        swalError('No se pudo liberar', errorsToText(errors));
                    },
                },
            );
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-sand bg-cream px-5 py-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-chocolate">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Reservas · Mesa #{mesa.numero}
                    </h2>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-cocoa-soft transition hover:bg-cream-soft hover:text-cocoa"
                        title="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {/* Reserva activa destacada */}
                    {activa ? (
                        <div className="mb-5 rounded-xl border border-blue-300 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-950/40">
                            <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                                <Clock className="h-3.5 w-3.5" />
                                Reserva activa · desde {activa.hora_inicio}
                            </p>

                            <p className="mt-2 text-lg font-bold text-chocolate">
                                {activa.cliente}
                            </p>

                            <p className="mt-1 flex items-center gap-3 text-sm text-cocoa">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {activa.hora_inicio} – {activa.hora_fin}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="h-4 w-4" />
                                    {activa.personas}{' '}
                                    {activa.personas === 1
                                        ? 'persona'
                                        : 'personas'}
                                </span>
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={onTomarPedido}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-gold-deep active:scale-95"
                                >
                                    <Check className="h-4 w-4" />
                                    Tomar pedido (atender)
                                </button>

                                {puedeGestionar && (
                                    <button
                                        onClick={liberarReserva}
                                        disabled={liberando}
                                        className="inline-flex items-center gap-2 rounded-lg border border-wheat bg-white px-4 py-2 text-sm font-semibold text-cocoa transition hover:bg-cream-soft active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5"
                                    >
                                        <Power className="h-4 w-4" />
                                        {liberando
                                            ? 'Liberando...'
                                            : 'Liberar reserva'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-5 rounded-xl border border-wheat bg-cream-soft/50 p-4 text-sm text-cocoa-soft">
                            <ThermometerSun className="mb-2 h-5 w-5 text-cocoa-soft" />
                            Esta mesa no tiene una reserva activa en este
                            momento.
                        </div>
                    )}

                    {/* Todas las reservas de hoy */}
                    <h3 className="mb-2 text-xs font-bold tracking-wide text-cocoa-soft uppercase">
                        Reservas de hoy
                    </h3>

                    <div className="space-y-2">
                        {reservas.length === 0 && (
                            <p className="rounded-lg border border-dashed border-wheat p-4 text-center text-sm text-cocoa-soft">
                                Aún no hay reservas para hoy.
                            </p>
                        )}

                        {reservasPasadas.map((r) => (
                            <div
                                key={r.id}
                                className={`rounded-lg border border-wheat bg-cream-soft/40 px-4 py-3 ${r.estado !== 'confirmada' ? 'opacity-70' : ''}`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-chocolate">
                                        {r.hora_inicio} – {r.hora_fin}{' '}
                                        <span className="ml-1 font-normal text-cocoa">
                                            · {r.cliente}
                                        </span>
                                    </p>

                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${ESTADO_CHIP[r.estado]}`}
                                    >
                                        {ESTADO_LABEL[r.estado]}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-cocoa-soft">
                                    {r.personas}{' '}
                                    {r.personas === 1 ? 'persona' : 'personas'}
                                    {r.telefono ? ` · ${r.telefono}` : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Nueva reserva */}
                    {puedeGestionar && (
                        <div className="mt-6 rounded-xl border border-wheat bg-cream-soft/50 p-4">
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wide text-cocoa-soft uppercase">
                                <CalendarPlus className="h-4 w-4" />
                                Nueva reserva
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="col-span-2 block text-sm font-semibold text-chocolate sm:col-span-1">
                                    Cliente
                                    <input
                                        type="text"
                                        value={cliente}
                                        onChange={(e) =>
                                            setCliente(e.target.value)
                                        }
                                        placeholder="Ej: Carlos Ruiz"
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>

                                <label className="col-span-2 block text-sm font-semibold text-chocolate sm:col-span-1">
                                    Teléfono
                                    <input
                                        type="text"
                                        value={telefono}
                                        onChange={(e) =>
                                            setTelefono(e.target.value)
                                        }
                                        placeholder="Opcional"
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-chocolate">
                                    Fecha
                                    <input
                                        type="date"
                                        min={formatearFechaHoy()}
                                        value={fecha}
                                        onChange={(e) =>
                                            setFecha(e.target.value)
                                        }
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-chocolate">
                                    Personas
                                    <input
                                        type="number"
                                        min="1"
                                        value={personas}
                                        onChange={(e) =>
                                            setPersonas(e.target.value)
                                        }
                                        placeholder="Ej: 3"
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-chocolate">
                                    Hora inicio
                                    <input
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e) => {
                                            setHoraInicio(e.target.value);

                                            // Hora fin por defecto: +30 min.
                                            if (!horaFin) {
                                                setHoraFin(
                                                    sumarMinutos(
                                                        e.target.value,
                                                        30,
                                                    ),
                                                );
                                            }
                                        }}
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-chocolate">
                                    Hora fin
                                    <input
                                        type="time"
                                        value={horaFin}
                                        onChange={(e) =>
                                            setHoraFin(e.target.value)
                                        }
                                        className={`mt-1 ${inputBase}`}
                                    />
                                </label>
                            </div>

                            <p className="mt-3 text-[11px] text-cocoa-soft">
                                La mesa se marca como «Reserva» unos{' '}
                                {margenInicioMinutos} min antes de que inicie la
                                reserva; antes se puede usar con normalidad. No
                                se permite otra reserva en el mismo rango de
                                horario.
                            </p>

                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={crearReserva}
                                    disabled={creando}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <CalendarPlus className="h-4 w-4" />
                                    {creando
                                        ? 'Reservando...'
                                        : 'Crear reserva'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
