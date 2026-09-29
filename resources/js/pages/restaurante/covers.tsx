import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
    Calendar,
    Tag,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    Gift,
    Heart,
    Star,
    Leaf,
    Pause,
    Play,
    AlertCircle,
    X,
    Check,
    Image as ImageIcon,
} from 'lucide-react';
import { swalError, swalSuccess, errorsToText } from '@/lib/swal';

interface Cover {
    id: number;
    titulo: string;
    descripcion: string;
    tipo: 'promocion' | 'evento' | 'festividad' | 'temporada';
    estado: 'activo' | 'programado' | 'finalizado' | 'pausado';
    imagen: string;
    fechaInicio: string;
    fechaFin: string;
    clicks: number;
    categoria?: string;
}

const toArray = <T,>(
    value: T[] | { data?: T[] } | Record<string, T> | null | undefined,
): T[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && Array.isArray((value as { data?: T[] }).data)) {
        return (value as { data: T[] }).data;
    }

    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, T>);
    }

    return [];
};

// ============================================================
// CONFIGURACIONES COMPARTIDAS
// ============================================================
const getEstadoConfig = (estado: string) => {
    switch (estado) {
        case 'activo':
            return {
                bg: 'bg-green-100',
                text: 'text-green-700',
                label: 'Activo',
                icon: CheckCircle,
            };
        case 'programado':
            return {
                bg: 'bg-blue-100',
                text: 'text-blue-700',
                label: 'Programado',
                icon: Clock,
            };
        case 'finalizado':
            return {
                bg: 'bg-sand',
                text: 'text-cocoa',
                label: 'Finalizado',
                icon: XCircle,
            };
        case 'pausado':
            return {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                label: 'Pausado',
                icon: Pause,
            };
        default:
            return {
                bg: 'bg-sand',
                text: 'text-cocoa',
                label: 'Desconocido',
                icon: AlertCircle,
            };
    }
};

const getTipoConfig = (tipo: string) => {
    switch (tipo) {
        case 'promocion':
            return {
                icon: Gift,
                color: 'text-orange-500',
                bg: 'bg-orange-50',
                label: 'Promoción',
            };
        case 'evento':
            return {
                icon: Heart,
                color: 'text-red-500',
                bg: 'bg-red-50',
                label: 'Evento',
            };
        case 'festividad':
            return {
                icon: Star,
                color: 'text-purple-500',
                bg: 'bg-purple-50',
                label: 'Festividad',
            };
        case 'temporada':
            return {
                icon: Leaf,
                color: 'text-green-500',
                bg: 'bg-green-50',
                label: 'Temporada',
            };
        default:
            return {
                icon: Tag,
                color: 'text-cocoa',
                bg: 'bg-cream-soft',
                label: 'Otro',
            };
    }
};

const formatNumber = (num: number): string => num.toLocaleString('es-PE');

// ============================================================
// MODAL: Crear / Editar Cover
// ============================================================
interface CoverFormModalProps {
    isOpen: boolean;
    cover: Cover | null; // null = creando, con datos = editando
    onClose: () => void;
}

function CoverFormModal({ isOpen, cover, onClose }: CoverFormModalProps) {
    const esEdicion = !!cover;
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'promocion',
        fechaInicio: '',
        fechaFin: '',
        imagen: '',
    });
    const [previewImagen, setPreviewImagen] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    // ✅ Convertir DD/MM/YYYY a YYYY-MM-DD para input type="date"
    const formatDateToInput = (date: string) => {
        if (!date) {
            return '';
        }

        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
        }

        if (date.includes('/')) {
            const parts = date.split('/');

            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        return date;
    };

    useEffect(() => {
        if (isOpen) {
            if (cover) {
                const fechaInicio = cover.fechaInicio
                    ? formatDateToInput(cover.fechaInicio)
                    : '';
                const fechaFin = cover.fechaFin
                    ? formatDateToInput(cover.fechaFin)
                    : '';

                setForm({
                    titulo: cover.titulo,
                    descripcion: cover.descripcion || '',
                    tipo: cover.tipo,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    imagen: cover.imagen || '',
                });

                setPreviewImagen(cover.imagen || '');
            } else {
                setForm({
                    titulo: '',
                    descripcion: '',
                    tipo: 'promocion',
                    fechaInicio: '',
                    fechaFin: '',
                    imagen: '',
                });
                setPreviewImagen('');
            }

            setError('');
        }
    }, [isOpen, cover]);

    // Captura global de Ctrl+V mientras el modal está abierto.
    // Esto permite pegar imágenes desde cualquier lugar del modal.
    useEffect(() => {
        if (!isOpen) {
return;
}

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;

            if (!items) {
return;
}

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();

                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result as string;
                            setPreviewImagen(base64);
                            setForm((f) => ({ ...f, imagen: base64 }));
                        };
                        reader.readAsDataURL(file);
                    }

                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);

        return () => document.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    if (!isOpen) {
return null;
}

    const tipos = [
        { value: 'promocion', label: 'Promoción' },
        { value: 'evento', label: 'Evento' },
        { value: 'festividad', label: 'Festividad' },
        { value: 'temporada', label: 'Temporada' },
    ];
    const guardar = () => {
        if (!form.titulo.trim()) {
            return setError('Ingresa el título del cover');
        }

        if (!form.fechaInicio || !form.fechaFin) {
            return setError('Ingresa las fechas de inicio y fin');
        }

        if (form.fechaInicio > form.fechaFin) {
            return setError(
                'La fecha de inicio no puede ser mayor a la fecha fin',
            );
        }

        setError('');

        // Construir payload
        const payload: any = {
            titulo: form.titulo,
            descripcion: form.descripcion || '',
            tipo: form.tipo,
            fechaInicio: form.fechaInicio,
            fechaFin: form.fechaFin,
        };

        // Solo agregar imagen si hay una nueva (base64) o si estamos creando
        if (form.imagen && form.imagen.startsWith('data:')) {
            payload.imagen = form.imagen;
        } else if (!esEdicion) {
            payload.imagen = '/images/default-cover.jpg';
        }
        // Si estamos editando y no hay imagen nueva → NO enviamos el campo
        // (el backend conserva la imagen anterior)

        setGuardando(true);

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                setGuardando(false);
                onClose();

                router.reload({ only: ['covers'] });
                swalSuccess(
                    esEdicion ? 'Cover actualizado' : 'Cover creado',
                    'Los cambios se guardaron correctamente.',
                );
            },
            onError: (errors: Record<string, string>) => {
                setGuardando(false);
                const mensaje = Object.values(errors).join(' ');
                setError(mensaje);
                swalError('Error al guardar', mensaje);
            },
            onFinish: () => {
                setGuardando(false);
            },
        };

        if (esEdicion) {
            router.post(
                `/covers/${cover!.id}`,
                {
                    ...payload,
                    _method: 'patch',
                },
                opciones,
            );
        } else {
            router.post('/covers', payload, opciones);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl animate-in overflow-hidden rounded-3xl bg-card shadow-2xl duration-300 zoom-in-95">
                {/* HEADER */}
                <div className="flex items-center justify-between bg-gradient-to-r from-roast to-espresso px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold shadow-lg">
                            {esEdicion ? (
                                <Edit className="h-5 w-5 text-white" />
                            ) : (
                                <Plus className="h-5 w-5 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {esEdicion ? 'Editar Cover' : 'Nuevo Cover'}
                            </h2>
                            <p className="text-xs text-white/60">
                                {esEdicion
                                    ? 'Actualiza la campaña'
                                    : 'Crea una nueva promoción, evento o festividad'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Columna izquierda */}
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Nombre del Cover
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={form.titulo}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            titulo: e.target.value,
                                        })
                                    }
                                    placeholder="Ej: Brunch Familiar"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Descripción
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full resize-none rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none placeholder:text-cocoa-soft hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={form.descripcion}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            descripcion: e.target.value,
                                        })
                                    }
                                    placeholder="Breve descripción del cover"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Tipo de Cover
                                </label>
                                <select
                                    className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-4 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                    value={form.tipo}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tipo: e.target.value,
                                        })
                                    }
                                >
                                    {tipos.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        style={{ colorScheme: 'light' }}
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-3 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={form.fechaInicio}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                fechaInicio: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        style={{ colorScheme: 'light' }}
                                        className="w-full rounded-xl border-2 border-wheat bg-cream-soft px-3 py-3 text-sm text-chocolate transition outline-none hover:bg-card focus:border-transparent focus:ring-2 focus:ring-gold"
                                        value={form.fechaFin}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                fechaFin: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha: imagen (mismo patrón "Ctrl+V" de Platos) */}
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-chocolate">
                                    Imagen
                                </label>
                                <div
                                    className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
                                        previewImagen
                                            ? 'border-gold bg-cream'
                                            : 'border-wheat bg-cream-soft hover:border-gold hover:bg-cream'
                                    }`}
                                    onPaste={(e) => {
                                        const items = e.clipboardData?.items;

                                        if (!items) {
                                            return;
                                        }

                                        for (const item of items) {
                                            if (
                                                item.type.startsWith('image/')
                                            ) {
                                                const file = item.getAsFile();

                                                if (file) {
                                                    const reader =
                                                        new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64 =
                                                            reader.result as string;
                                                        setPreviewImagen(
                                                            base64,
                                                        );
                                                        setForm((f) => ({
                                                            ...f,
                                                            imagen: base64,
                                                        }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }

                                                break;
                                            }
                                        }
                                    }}
                                    onClick={() => {
                                        if (!previewImagen) {
                                            document
                                                .getElementById(
                                                    'coverFileInput',
                                                )
                                                ?.click();
                                        }
                                    }}
                                >
                                    {previewImagen ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <img
                                                src={previewImagen}
                                                alt="Vista previa"
                                                className="h-32 w-full rounded-lg border-2 border-gold object-cover"
                                            />
                                            <div className="flex w-full items-center gap-2">
                                                <p className="flex-1 text-left text-xs text-cocoa-soft">
                                                    Ctrl+V para reemplazar
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewImagen('');
                                                        setForm((f) => ({
                                                            ...f,
                                                            imagen: '',
                                                        }));
                                                    }}
                                                    className="p-1 text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="mb-2">
                                                <ImageIcon className="mx-auto h-12 w-12 text-cocoa-soft" />
                                            </div>
                                            <p className="text-sm font-medium text-chocolate">
                                                Presiona{' '}
                                                <kbd className="rounded bg-wheat px-2 py-0.5 text-xs font-bold">
                                                    Ctrl + V
                                                </kbd>{' '}
                                                para pegar
                                            </p>
                                            <p className="mt-1 text-xs text-cocoa-soft">
                                                O haz clic para seleccionar un
                                                archivo
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        id="coverFileInput"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    const base64 =
                                                        reader.result as string;
                                                    setPreviewImagen(base64);
                                                    setForm((f) => ({
                                                        ...f,
                                                        imagen: base64,
                                                    }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-[10px] text-cocoa-soft">
                                    Si no seleccionas ninguna, se usará una
                                    imagen por defecto
                                </p>
                            </div>

                            {/* Vista previa tipo tarjeta */}
                            <div>
                                <p className="mb-1.5 text-xs font-semibold text-cocoa uppercase">
                                    Vista previa
                                </p>
                                <div className="overflow-hidden rounded-xl border border-sand">
                                    <div className="h-20 overflow-hidden bg-cream-grain">
                                        {previewImagen && (
                                            <img
                                                src={previewImagen}
                                                className="h-full w-full object-cover"
                                                alt=""
                                            />
                                        )}
                                    </div>
                                    <div className="bg-card p-3">
                                        <p className="truncate text-sm font-bold text-chocolate">
                                            {form.titulo || 'Nombre del cover'}
                                        </p>
                                        <p className="truncate text-xs text-cocoa-soft">
                                            {form.descripcion ||
                                                'Descripción...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 border-t border-sand bg-cream-soft/50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border-2 border-wheat px-6 py-2.5 text-sm font-semibold text-cocoa transition hover:bg-sand"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={guardar}
                        disabled={guardando}
                        className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink shadow-md transition hover:bg-gold-deep hover:shadow-lg disabled:opacity-50"
                    >
                        <Check className="h-4 w-4" />
                        {guardando
                            ? 'Guardando...'
                            : esEdicion
                              ? 'Guardar cambios'
                              : 'Crear Cover'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function Covers() {
    const { covers: coversIniciales = [], flash } = usePage<{
        covers?: Cover[] | { data?: Cover[] } | Record<string, Cover>;
        flash?: { success?: string; error?: string };
    }>().props;

    const [covers, setCovers] = useState<Cover[]>(() =>
        toArray<Cover>(coversIniciales),
    );
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(false);

    // Modal de crear/editar
    const [modalFormAbierto, setModalFormAbierto] = useState(false);
    const [coverEditando, setCoverEditando] = useState<Cover | null>(null);

    useEffect(() => {
        setCovers(toArray<Cover>(coversIniciales));
    }, [coversIniciales]);

    useEffect(() => {
        if (flash?.success) {
            swalSuccess('Éxito', flash.success);
        }

        if (flash?.error) {
            swalError('Error', flash.error);
        }
    }, [flash]);

    // ===== ESTADÍSTICAS =====
    const estadisticas = {
        activos: covers.filter((c) => c.estado === 'activo').length,
        programados: covers.filter((c) => c.estado === 'programado').length,
        finalizados: covers.filter((c) => c.estado === 'finalizado').length,
        clicks: covers.reduce((sum, c) => sum + c.clicks, 0),
    };

    // ===== COVERS FILTRADOS =====
    const coversFiltrados = covers.filter((c) => {
        const tipoOk = !filtroTipo || c.tipo === filtroTipo;
        const estadoOk = !filtroEstado || c.estado === filtroEstado;
        const busquedaOk =
            !busqueda ||
            c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.descripcion.toLowerCase().includes(busqueda.toLowerCase());

        return tipoOk && estadoOk && busquedaOk;
    });

    // ===== ABRIR MODAL =====
    const abrirCrear = () => {
        setCoverEditando(null);
        setModalFormAbierto(true);
    };

    const abrirEditar = (cover: Cover) => {
        setCoverEditando(cover);
        setModalFormAbierto(true);
    };

    // ===== CAMBIAR ESTADO =====
    const cambiarEstado = async (id: number, estadoActual: string) => {
        let nuevoEstado = '';
        let mensaje = '';

        switch (estadoActual) {
            case 'activo':
                nuevoEstado = 'pausado';
                mensaje = '¿Deseas pausar este cover?';
                break;
            case 'programado':
                nuevoEstado = 'activo';
                mensaje = '¿Deseas activar este cover?';
                break;
            case 'pausado':
                nuevoEstado = 'activo';
                mensaje = '¿Deseas reactivar este cover?';
                break;
            default:
                return;
        }

        const confirm = await Swal.fire({
            title: 'Confirmar',
            text: mensaje,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--gold)',
            cancelButtonColor: '#6B7280',
        });

        if (!confirm.isConfirmed) {
            return;
        }

        setCargando(true);
        router.patch(
            `/covers/${id}/estado`,
            { estado: nuevoEstado },
            {
                onSuccess: () => {
                    swalSuccess(
                        'Estado actualizado',
                        'El cover ha sido actualizado correctamente.',
                    );
                    router.reload({ only: ['covers'] });
                },
                onError: (errors) =>
                    swalError('Error al cambiar estado', errorsToText(errors)),
                onFinish: () => setCargando(false),
            },
        );
    };

    // ===== ELIMINAR =====
    const eliminarCover = async (id: number, titulo: string) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar cover?',
            text: `¿Estás seguro de eliminar "${titulo}"? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--destructive)',
            cancelButtonColor: '#6B7280',
        });

        if (!confirm.isConfirmed) {
            return;
        }

        setCargando(true);
        router.delete(`/covers/${id}`, {
            onSuccess: () => {
                swalSuccess(
                    'Eliminado',
                    'El cover ha sido eliminado correctamente.',
                );
                router.reload({ only: ['covers'] });
            },
            onError: (errors) =>
                swalError('Error al eliminar cover', errorsToText(errors)),
            onFinish: () => setCargando(false),
        });
    };

    // ===== VER ESTADÍSTICAS =====
    const verEstadisticas = (cover: Cover) => {
        Swal.fire({
            title: `${cover.titulo}`,
            html: `
                <div class="text-left space-y-2">
                    <p><strong>ID:</strong> #${cover.id}</p>
                    <p><strong>Tipo:</strong> ${getTipoConfig(cover.tipo).label}</p>
                    <p><strong>Estado:</strong> ${getEstadoConfig(cover.estado).label}</p>
                    <p><strong>Clicks:</strong> ${formatNumber(cover.clicks)}</p>
                    <p><strong>Período:</strong> ${cover.fechaInicio} - ${cover.fechaFin}</p>
                    <p><strong>Descripción:</strong> ${cover.descripcion || 'Sin descripción'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: 'var(--gold)',
            width: 500,
        });
    };

    // ===== RENDER =====
    return (
        <>
            <Head title="Covers - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* HEADER */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-chocolate">
                            {' '}
                            Covers
                        </h1>
                        <p className="mt-1 text-sm text-cocoa">
                            Gestión de promociones, eventos y festividades
                        </p>
                    </div>
                    <button
                        onClick={abrirCrear}
                        disabled={cargando}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-ink shadow-md transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Cover
                    </button>
                </div>

                {/* ESTADÍSTICAS */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Activos
                                </p>
                                <p className="mt-1 text-3xl font-bold text-green-600">
                                    {estadisticas.activos}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Programados
                                </p>
                                <p className="mt-1 text-3xl font-bold text-blue-600">
                                    {estadisticas.programados}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sand bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-cocoa">
                                    Finalizados
                                </p>
                                <p className="mt-1 text-3xl font-bold text-cocoa">
                                    {estadisticas.finalizados}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand">
                                <XCircle className="h-6 w-6 text-cocoa" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-roast p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/60">
                                    Clicks totales
                                </p>
                                <p className="mt-1 text-3xl font-bold">
                                    {formatNumber(estadisticas.clicks)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <TrendingUp className="h-6 w-6 text-gold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="rounded-2xl border border-sand bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cocoa-soft" />
                            <input
                                type="text"
                                placeholder="Buscar covers..."
                                className="w-full rounded-xl border-2 border-cocoa-soft/30 bg-cream py-2.5 pr-4 pl-10 text-sm text-chocolate transition placeholder:text-cocoa-soft/50 focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/20 focus:outline-none"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full rounded-xl border-2 border-cocoa-soft/30 bg-cream p-2.5 text-sm text-chocolate transition focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/20 focus:outline-none"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="promocion">Promociones</option>
                            <option value="evento">Eventos</option>
                            <option value="festividad">Festividades</option>
                            <option value="temporada">Temporadas</option>
                        </select>
                        <select
                            className="w-full rounded-xl border-2 border-cocoa-soft/30 bg-cream p-2.5 text-sm text-chocolate transition focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/20 focus:outline-none"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="programado">Programado</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="pausado">Pausado</option>
                        </select>
                        <button
                            onClick={() => {
                                setFiltroTipo('');
                                setFiltroEstado('');
                                setBusqueda('');
                            }}
                            className="rounded-xl bg-roast py-2.5 text-sm font-semibold text-white transition hover:bg-ink"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* GRID DE COVERS */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {coversFiltrados.map((cover) => {
                        const estadoConfig = getEstadoConfig(cover.estado);
                        const tipoConfig = getTipoConfig(cover.tipo);
                        const EstadoIcon = estadoConfig.icon;
                        const TipoIcon = tipoConfig.icon;

                        return (
                            <div
                                key={cover.id}
                                className="group overflow-hidden rounded-2xl border border-sand bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-cream-grain">
                                    <img
                                        src={cover.imagen}
                                        alt={cover.titulo}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%23F3E1C8"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%238A5A2B" font-family="Arial" font-size="32" font-weight="700">Dolce Cafe</text></svg>';
                                        }}
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1`}
                                        >
                                            <EstadoIcon className="h-3 w-3" />
                                            {estadoConfig.label}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${tipoConfig.bg} ${tipoConfig.color} flex items-center gap-1`}
                                        >
                                            <TipoIcon className="h-3 w-3" />
                                            {tipoConfig.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-chocolate">
                                        {cover.titulo}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-cocoa">
                                        {cover.descripcion || 'Sin descripción'}
                                    </p>

                                    <div className="mt-3 flex items-center gap-4 text-xs text-cocoa-soft">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {cover.fechaInicio} -{' '}
                                                {cover.fechaFin}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                verEstadisticas(cover)
                                            }
                                            className="flex items-center gap-1 transition hover:text-gold"
                                        >
                                            <Eye className="h-3 w-3" />
                                            <span>
                                                {formatNumber(cover.clicks)}{' '}
                                                clicks
                                            </span>
                                        </button>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => abrirEditar(cover)}
                                            disabled={cargando}
                                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gold py-2 text-sm font-semibold text-ink transition hover:bg-gold-deep disabled:opacity-50"
                                        >
                                            <Edit className="h-4 w-4" /> Editar
                                        </button>

                                        {cover.estado === 'activo' ? (
                                            <button
                                                onClick={() =>
                                                    cambiarEstado(
                                                        cover.id,
                                                        cover.estado,
                                                    )
                                                }
                                                disabled={cargando}
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50"
                                            >
                                                <Pause className="h-4 w-4" />{' '}
                                                Pausar
                                            </button>
                                        ) : cover.estado === 'programado' ? (
                                            <button
                                                onClick={() =>
                                                    cambiarEstado(
                                                        cover.id,
                                                        cover.estado,
                                                    )
                                                }
                                                disabled={cargando}
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <Play className="h-4 w-4" />{' '}
                                                Activar
                                            </button>
                                        ) : cover.estado === 'pausado' ? (
                                            <button
                                                onClick={() =>
                                                    cambiarEstado(
                                                        cover.id,
                                                        cover.estado,
                                                    )
                                                }
                                                disabled={cargando}
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <Play className="h-4 w-4" />{' '}
                                                Reactivar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    verEstadisticas(cover)
                                                }
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-roast py-2 text-sm font-semibold text-white transition hover:bg-ink"
                                            >
                                                <Eye className="h-4 w-4" /> Ver
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                eliminarCover(
                                                    cover.id,
                                                    cover.titulo,
                                                )
                                            }
                                            disabled={cargando}
                                            className="flex items-center justify-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {coversFiltrados.length === 0 && (
                    <div className="rounded-2xl border border-sand bg-card py-10 text-center text-cocoa-soft">
                        <div className="flex flex-col items-center gap-2">
                            <Search className="h-12 w-12 text-cocoa-soft" />
                            <p className="text-lg font-medium text-cocoa">
                                No hay covers que coincidan con los filtros
                            </p>
                            <button
                                onClick={() => {
                                    setFiltroTipo('');
                                    setFiltroEstado('');
                                    setBusqueda('');
                                }}
                                className="text-sm font-medium text-gold hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* TABLA HISTORIAL */}
                <div className="overflow-hidden rounded-2xl border border-sand bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-sand p-5">
                        <h2 className="text-xl font-bold text-chocolate">
                            {' '}
                            Historial de Covers
                        </h2>
                        <span className="text-xs text-cocoa">
                            Últimas campañas
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b-2 border-sand bg-cream-soft text-cocoa dark:border-roast/60 dark:bg-roast/70 dark:text-cocoa">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-cocoa-soft uppercase">
                                        Campaña
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-cocoa-soft uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-cocoa-soft uppercase">
                                        Inicio
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-cocoa-soft uppercase">
                                        Fin
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-cocoa-soft uppercase">
                                        Clicks
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-cocoa-soft uppercase">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-cocoa-soft uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sand text-sm">
                                {covers.slice(0, 6).map((cover) => {
                                    const estadoConfig = getEstadoConfig(
                                        cover.estado,
                                    );
                                    const tipoConfig = getTipoConfig(
                                        cover.tipo,
                                    );

                                    return (
                                        <tr
                                            key={cover.id}
                                            className="transition hover:bg-cream-soft"
                                        >
                                            <td className="px-4 py-3 font-medium text-chocolate">
                                                {cover.titulo}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoConfig.bg} ${tipoConfig.color}`}
                                                >
                                                    {tipoConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-cocoa">
                                                {cover.fechaInicio}
                                            </td>
                                            <td className="px-4 py-3 text-cocoa">
                                                {cover.fechaFin}
                                            </td>
                                            <td className="px-4 py-3 text-cocoa">
                                                {formatNumber(cover.clicks)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}
                                                >
                                                    {estadoConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            abrirEditar(cover)
                                                        }
                                                        className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            verEstadisticas(
                                                                cover,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-cocoa transition hover:bg-sand"
                                                        title="Ver"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            eliminarCover(
                                                                cover.id,
                                                                cover.titulo,
                                                            )
                                                        }
                                                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                                                        title="Eliminar"
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
                    </div>
                </div>

                {/* MODAL CREAR / EDITAR */}
                <CoverFormModal
                    isOpen={modalFormAbierto}
                    cover={coverEditando}
                    onClose={() => {
                        setModalFormAbierto(false);
                        setCoverEditando(null);
                    }}
                />
            </div>
        </>
    );
}
