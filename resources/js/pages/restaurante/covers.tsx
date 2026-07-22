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
    Check
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

const toArray = <T,>(value: T[] | { data?: T[] } | Record<string, T> | null | undefined): T[] => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray((value as { data?: T[] }).data)) return (value as { data: T[] }).data;
    if (value && typeof value === 'object') return Object.values(value as Record<string, T>);
    return [];
};

// ============================================================
// CONFIGURACIONES COMPARTIDAS
// ============================================================
const getEstadoConfig = (estado: string) => {
    switch (estado) {
        case 'activo': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo', icon: CheckCircle };
        case 'programado': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programado', icon: Clock };
        case 'finalizado': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Finalizado', icon: XCircle };
        case 'pausado': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pausado', icon: Pause };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Desconocido', icon: AlertCircle };
    }
};

const getTipoConfig = (tipo: string) => {
    switch (tipo) {
        case 'promocion': return { icon: Gift, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Promoción' };
        case 'evento': return { icon: Heart, color: 'text-red-500', bg: 'bg-red-50', label: 'Evento' };
        case 'festividad': return { icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Festividad' };
        case 'temporada': return { icon: Leaf, color: 'text-green-500', bg: 'bg-green-50', label: 'Temporada' };
        default: return { icon: Tag, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Otro' };
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
    onGuardado: () => void;
}

function CoverFormModal({ isOpen, cover, onClose, onGuardado }: CoverFormModalProps) {
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
        if (!date) return '';
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
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
                const fechaInicio = cover.fechaInicio ? formatDateToInput(cover.fechaInicio) : '';
                const fechaFin = cover.fechaFin ? formatDateToInput(cover.fechaFin) : '';

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

    if (!isOpen) return null;

    const tipos = [
        { value: 'promocion', label: '🎁 Promoción' },
        { value: 'evento', label: '❤️ Evento' },
        { value: 'festividad', label: '⭐ Festividad' },
        { value: 'temporada', label: '🌿 Temporada' },
    ];

    const guardar = () => {
        if (!form.titulo.trim()) return setError('Ingresa el título del cover');
        if (!form.fechaInicio || !form.fechaFin) return setError('Ingresa las fechas de inicio y fin');
        if (form.fechaInicio > form.fechaFin) return setError('La fecha de inicio no puede ser mayor a la fecha fin');
        setError('');

        const payload = {
            ...form,
            fechaInicio: form.fechaInicio,
            fechaFin: form.fechaFin,
            imagen: form.imagen || '/images/default-cover.jpg'
        };

        setGuardando(true);

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                setGuardando(false);
                onGuardado();
                onClose();
            },
            onError: (errors: Record<string, string>) => {
                setGuardando(false);
                setError(Object.values(errors).join(' '));
            },
        };

        if (esEdicion) {
            router.put(`/covers/${cover!.id}`, payload, opciones);
        } else {
            router.post('/covers', payload, opciones);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#2D1B1A] to-[#4A2C2A] px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C9A96E] rounded-xl flex items-center justify-center shadow-lg">
                            {esEdicion ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {esEdicion ? '✏️ Editar Cover' : '✨ Nuevo Cover'}
                            </h2>
                            <p className="text-gray-300 text-xs">
                                {esEdicion ? 'Actualiza la campaña' : 'Crea una nueva promoción, evento o festividad'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/60 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Columna izquierda */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Nombre del Cover</label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={form.titulo}
                                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                    placeholder="Ej: Brunch Familiar"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Descripción</label>
                                <textarea
                                    rows={3}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white resize-none"
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    placeholder="Breve descripción del cover"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Tipo de Cover</label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                    value={form.tipo}
                                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                >
                                    {tipos.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        style={{ colorScheme: 'light' }}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={form.fechaInicio}
                                        onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Fecha Fin</label>
                                    <input
                                        type="date"
                                        style={{ colorScheme: 'light' }}
                                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-[#2D1B1A] text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white"
                                        value={form.fechaFin}
                                        onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha: imagen (mismo patrón "Ctrl+V" de Platos) */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#2D1B1A] mb-1.5">Imagen</label>
                                <div
                                    className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${previewImagen ? 'border-[#C9A96E] bg-[#FBF7F0]' : 'border-gray-300 bg-gray-50 hover:border-[#C9A96E] hover:bg-[#FBF7F0]'
                                        }`}
                                    onPaste={(e) => {
                                        const items = e.clipboardData?.items;
                                        if (!items) return;
                                        for (const item of items) {
                                            if (item.type.startsWith('image/')) {
                                                const file = item.getAsFile();
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64 = reader.result as string;
                                                        setPreviewImagen(base64);
                                                        setForm(f => ({ ...f, imagen: base64 }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                                break;
                                            }
                                        }
                                    }}
                                    onClick={() => {
                                        if (!previewImagen) document.getElementById('coverFileInput')?.click();
                                    }}
                                >
                                    {previewImagen ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={previewImagen} alt="Vista previa" className="w-full h-32 rounded-lg object-cover border-2 border-[#C9A96E]" />
                                            <div className="flex items-center gap-2 w-full">
                                                <p className="text-xs text-gray-400 flex-1 text-left">Ctrl+V para reemplazar</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setPreviewImagen(''); setForm(f => ({ ...f, imagen: '' })); }}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-4xl mb-2">🖼️</div>
                                            <p className="text-sm font-medium text-[#2D1B1A]">
                                                Presiona <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs font-bold">Ctrl + V</kbd> para pegar
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">O haz clic para seleccionar un archivo</p>
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
                                                    const base64 = reader.result as string;
                                                    setPreviewImagen(base64);
                                                    setForm(f => ({ ...f, imagen: base64 }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Si no seleccionas ninguna, se usará una imagen por defecto</p>
                            </div>

                            {/* Vista previa tipo tarjeta */}
                            <div>
                                <p className="text-xs font-semibold text-[#5A3D2B] uppercase mb-1.5">Vista previa</p>
                                <div className="rounded-xl overflow-hidden border border-[#F3E1C8]">
                                    <div className="h-20 bg-[#F8EEE1] overflow-hidden">
                                        {previewImagen && <img src={previewImagen} className="w-full h-full object-cover" alt="" />}
                                    </div>
                                    <div className="p-3 bg-white">
                                        <p className="text-sm font-bold text-[#2D1B1A] truncate">{form.titulo || 'Nombre del cover'}</p>
                                        <p className="text-xs text-gray-400 truncate">{form.descripcion || 'Descripción...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-sm transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={guardar}
                        disabled={guardando}
                        className="px-6 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#B8975D] text-white font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" />
                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Cover'}
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

    const [covers, setCovers] = useState<Cover[]>(() => toArray<Cover>(coversIniciales));
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
        if (flash?.success) swalSuccess('Éxito', flash.success);
        if (flash?.error) swalError('Error', flash.error);
    }, [flash]);

    // ===== ESTADÍSTICAS =====
    const estadisticas = {
        activos: covers.filter(c => c.estado === 'activo').length,
        programados: covers.filter(c => c.estado === 'programado').length,
        finalizados: covers.filter(c => c.estado === 'finalizado').length,
        clicks: covers.reduce((sum, c) => sum + c.clicks, 0),
    };

    // ===== COVERS FILTRADOS =====
    const coversFiltrados = covers.filter(c => {
        const tipoOk = !filtroTipo || c.tipo === filtroTipo;
        const estadoOk = !filtroEstado || c.estado === filtroEstado;
        const busquedaOk = !busqueda ||
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
            confirmButtonColor: '#C9A96E',
            cancelButtonColor: '#6B7280',
        });

        if (!confirm.isConfirmed) return;

        setCargando(true);
        router.patch(`/covers/${id}/estado`, { estado: nuevoEstado }, {
            onSuccess: () => {
                swalSuccess('Estado actualizado', 'El cover ha sido actualizado correctamente.');
                router.reload({ only: ['covers'] });
            },
            onError: (errors) => swalError('Error al cambiar estado', errorsToText(errors)),
            onFinish: () => setCargando(false),
        });
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
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
        });

        if (!confirm.isConfirmed) return;

        setCargando(true);
        router.delete(`/covers/${id}`, {
            onSuccess: () => {
                swalSuccess('Eliminado', 'El cover ha sido eliminado correctamente.');
                router.reload({ only: ['covers'] });
            },
            onError: (errors) => swalError('Error al eliminar cover', errorsToText(errors)),
            onFinish: () => setCargando(false),
        });
    };

    // ===== VER ESTADÍSTICAS =====
    const verEstadisticas = (cover: Cover) => {
        Swal.fire({
            title: `📊 ${cover.titulo}`,
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
            confirmButtonColor: '#C9A96E',
            width: 500,
        });
    };

    // ===== RENDER =====
    return (
        <>
            <Head title="Covers - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]"> Covers</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión de promociones, eventos y festividades</p>
                    </div>
                    <button
                        onClick={abrirCrear}
                        disabled={cargando}
                        className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cover
                    </button>
                </div>

                {/* ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Activos</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{estadisticas.activos}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Programados</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">{estadisticas.programados}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3E1C8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#5A3D2B] font-medium">Finalizados</p>
                                <p className="text-3xl font-bold text-gray-600 mt-1">{estadisticas.finalizados}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2D1B1A] rounded-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm font-medium">Clicks totales</p>
                                <p className="text-3xl font-bold mt-1">{formatNumber(estadisticas.clicks)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6B53]" />
                            <input
                                type="text"
                                placeholder="Buscar covers..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-[#8D6B53]/30 rounded-xl text-sm text-[#2D1B1A] placeholder:text-[#8D6B53]/50 bg-[#FBF7F0] focus:border-[#C9A96E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/20 transition"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full border-2 border-[#8D6B53]/30 rounded-xl p-2.5 text-sm text-[#2D1B1A] bg-[#FBF7F0] focus:border-[#C9A96E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/20 transition"
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
                            className="w-full border-2 border-[#8D6B53]/30 rounded-xl p-2.5 text-sm text-[#2D1B1A] bg-[#FBF7F0] focus:border-[#C9A96E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/20 transition"
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
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition py-2.5"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* GRID DE COVERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {coversFiltrados.map((cover) => {
                        const estadoConfig = getEstadoConfig(cover.estado);
                        const tipoConfig = getTipoConfig(cover.tipo);
                        const EstadoIcon = estadoConfig.icon;
                        const TipoIcon = tipoConfig.icon;

                        return (
                            <div
                                key={cover.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#F3E1C8] group"
                            >
                                <div className="h-48 bg-[#F8EEE1] flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={cover.imagen}
                                        alt={cover.titulo}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%23F3E1C8"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%238A5A2B" font-family="Arial" font-size="32" font-weight="700">Dolce Cafe</text></svg>';
                                        }}
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-1`}>
                                            <EstadoIcon className="w-3 h-3" />
                                            {estadoConfig.label}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${tipoConfig.bg} ${tipoConfig.color} flex items-center gap-1`}>
                                            <TipoIcon className="w-3 h-3" />
                                            {tipoConfig.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-[#2D1B1A]">{cover.titulo}</h3>
                                    <p className="text-sm text-[#5A3D2B] mt-1 line-clamp-2">{cover.descripcion || 'Sin descripción'}</p>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{cover.fechaInicio} - {cover.fechaFin}</span>
                                        </div>
                                        <button
                                            onClick={() => verEstadisticas(cover)}
                                            className="flex items-center gap-1 hover:text-[#C9A96E] transition"
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>{formatNumber(cover.clicks)} clicks</span>
                                        </button>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => abrirEditar(cover)}
                                            disabled={cargando}
                                            className="flex-1 bg-[#C9A96E] hover:bg-[#B8975D] text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>

                                        {cover.estado === 'activo' ? (
                                            <button
                                                onClick={() => cambiarEstado(cover.id, cover.estado)}
                                                disabled={cargando}
                                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <Pause className="w-4 h-4" /> Pausar
                                            </button>
                                        ) : cover.estado === 'programado' ? (
                                            <button
                                                onClick={() => cambiarEstado(cover.id, cover.estado)}
                                                disabled={cargando}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <Play className="w-4 h-4" /> Activar
                                            </button>
                                        ) : cover.estado === 'pausado' ? (
                                            <button
                                                onClick={() => cambiarEstado(cover.id, cover.estado)}
                                                disabled={cargando}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <Play className="w-4 h-4" /> Reactivar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => verEstadisticas(cover)}
                                                className="flex-1 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" /> Ver
                                            </button>
                                        )}

                                        <button
                                            onClick={() => eliminarCover(cover.id, cover.titulo)}
                                            disabled={cargando}
                                            className="px-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {coversFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-[#F3E1C8]">
                        <div className="flex flex-col items-center gap-2">
                            <Search className="w-12 h-12 text-gray-300" />
                            <p className="text-lg font-medium text-[#5A3D2B]">No hay covers que coincidan con los filtros</p>
                            <button
                                onClick={() => {
                                    setFiltroTipo('');
                                    setFiltroEstado('');
                                    setBusqueda('');
                                }}
                                className="text-[#C9A96E] hover:underline text-sm font-medium"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}

                {/* TABLA HISTORIAL */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]"> Historial de Covers</h2>
                        <span className="text-xs text-[#5A3D2B]">Últimas campañas</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FBF3E7]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Campaña</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Inicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Fin</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Clicks</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {covers.slice(0, 6).map((cover) => {
                                    const estadoConfig = getEstadoConfig(cover.estado);
                                    const tipoConfig = getTipoConfig(cover.tipo);
                                    return (
                                        <tr key={cover.id} className="hover:bg-[#FBF3E7] transition">
                                            <td className="px-4 py-3 font-medium text-[#2D1B1A]">{cover.titulo}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoConfig.bg} ${tipoConfig.color}`}>
                                                    {tipoConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#5A3D2B]">{cover.fechaInicio}</td>
                                            <td className="px-4 py-3 text-[#5A3D2B]">{cover.fechaFin}</td>
                                            <td className="px-4 py-3 text-[#5A3D2B]">{formatNumber(cover.clicks)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                                                    {estadoConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => abrirEditar(cover)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => verEstadisticas(cover)}
                                                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                                                        title="Ver"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarCover(cover.id, cover.titulo)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                    onClose={() => { setModalFormAbierto(false); setCoverEditando(null); }}
                    onGuardado={() => {
                        swalSuccess(
                            coverEditando ? '✅ Cover actualizado' : '✅ Cover creado',
                            'Los cambios se guardaron correctamente.'
                        );
                        router.reload({ only: ['covers'] });
                    }}
                />

            </div>
        </>
    );
}