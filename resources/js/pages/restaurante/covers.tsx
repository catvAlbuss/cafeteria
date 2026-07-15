import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
    Filter,
    CalendarDays,
    Gift,
    Heart,
    Sparkles,
    Star,
    Cake,
    Snowflake,
    Sun,
    Leaf,
    Coffee
} from 'lucide-react';

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

export default function Covers() {
    //  Datos de ejemplo
    const { covers: coversIniciales = [] } = usePage<{ covers?: Cover[] | { data?: Cover[] } | Record<string, Cover> }>().props;
    const [covers] = useState<Cover[]>(() => toArray<Cover>(coversIniciales));

    //  Estado de filtros
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [busqueda, setBusqueda] = useState('');

    //  Estadísticas
    const estadisticas = {
        activos: covers.filter(c => c.estado === 'activo').length,
        programados: covers.filter(c => c.estado === 'programado').length,
        finalizados: covers.filter(c => c.estado === 'finalizado').length,
        clicks: covers.reduce((sum, c) => sum + c.clicks, 0),
    };

    //  Covers filtrados
    const coversFiltrados = covers.filter(c => {
        const tipoOk = !filtroTipo || c.tipo === filtroTipo;
        const estadoOk = !filtroEstado || c.estado === filtroEstado;
        const busquedaOk = !busqueda || 
            c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.descripcion.toLowerCase().includes(busqueda.toLowerCase());
        return tipoOk && estadoOk && busquedaOk;
    });

    //  Configuración de estados
    const getEstadoConfig = (estado: string) => {
        switch(estado) {
            case 'activo': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo', icon: CheckCircle };
            case 'programado': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programado', icon: Clock };
            case 'finalizado': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Finalizado', icon: XCircle };
            case 'pausado': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pausado', icon: XCircle };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Desconocido', icon: XCircle };
        }
    };

    //  Configuración de tipos
    const getTipoConfig = (tipo: string) => {
        switch(tipo) {
            case 'promocion': return { icon: Gift, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Promoción' };
            case 'evento': return { icon: Heart, color: 'text-red-500', bg: 'bg-red-50', label: 'Evento' };
            case 'festividad': return { icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Festividad' };
            case 'temporada': return { icon: Leaf, color: 'text-green-500', bg: 'bg-green-50', label: 'Temporada' };
            default: return { icon: Tag, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Otro' };
        }
    };

    //  Formatear moneda
    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-PE');
    };

    return (
        <>
            <Head title="Covers - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">
                
                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">🎯 Covers</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión de promociones, eventos y festividades</p>
                    </div>
                    <button className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#B8975D] text-white px-5 py-2.5 rounded-xl shadow-md transition font-semibold">
                        <Plus className="w-4 h-4" />
                        Nuevo Cover
                    </button>
                </div>

                {/* ===== ESTADÍSTICAS ===== */}
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

                {/* ===== FILTROS ===== */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F3E1C8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar covers..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
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
                            className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent outline-none"
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
                            className="bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white rounded-xl text-sm font-semibold transition"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* ===== GRID DE COVERS ===== */}
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
                                    <p className="text-sm text-[#5A3D2B] mt-1 line-clamp-2">{cover.descripcion}</p>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{cover.fechaInicio} - {cover.fechaFin}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            <span>{formatNumber(cover.clicks)} clicks</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 bg-[#C9A96E] hover:bg-[#B8975D] text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                                            <Edit className="w-4 h-4" /> Editar
                                        </button>
                                        {cover.estado === 'activo' ? (
                                            <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                                                <XCircle className="w-4 h-4" /> Pausar
                                            </button>
                                        ) : cover.estado === 'programado' ? (
                                            <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Activar
                                            </button>
                                        ) : (
                                            <button className="flex-1 bg-[#2D1B1A] hover:bg-[#1A0F0E] text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                                                <Eye className="w-4 h-4" /> Ver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {coversFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        No hay covers que coincidan con los filtros
                    </div>
                )}

                {/* ===== TABLA HISTORIAL ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#F3E1C8] overflow-hidden">
                    <div className="flex justify-between items-center p-5 border-b border-[#F3E1C8]">
                        <h2 className="text-xl font-bold text-[#2D1B1A]">📋 Historial de Covers</h2>
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </>
    );
}
