import { Link, usePage } from '@inertiajs/react';
import { 
    Bell, 
    CalendarDays, 
    Mail, 
    Settings, 
    LogOut,
    ChevronRight,
    Menu
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem } from '@/types';


interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();

    // 🔔 Notificaciones
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [notificaciones, setNotificaciones] = useState([
        { id: 1, pedido: '#001', mesa: '05', cliente: 'Juan Pérez', productos: '2x Cappuccino · 1x Cheesecake', tiempo: 'hace 2 min', estado: 'pendiente' },
        { id: 2, pedido: '#002', mesa: '03', cliente: 'María López', productos: '1x Latte · 2x Croissants', tiempo: 'hace 5 min', estado: 'pendiente' },
        { id: 3, pedido: '#003', mesa: '08', cliente: 'Carlos Ruiz', productos: '3x Cafés americanos', tiempo: 'hace 8 min', estado: 'pendiente' },
    ]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notificaciones-container') && notificacionesAbiertas) {
                setNotificacionesAbiertas(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [notificacionesAbiertas]);

    const pendientes = notificaciones.filter(n => n.estado === 'pendiente').length;
    const user = auth?.user || { name: 'Usuario', avatar: null };

    return (
        <>
            {/* ===== HEADER PRINCIPAL - DOLCE CAFE ===== */}
            <header className="h-24 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 border-b border-orange-400 flex items-center justify-between px-6 md:px-8 shadow-xl">
                
                {/* LADO IZQUIERDO */}
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                            Sistema Administrativo
                        </h2>
                        <p className="text-orange-100 text-sm mt-0.5">
                            Bienvenido al sistema
                        </p>
                    </div>
                </div>

                {/* LADO DERECHO */}
                <div className="flex items-center gap-2 md:gap-3">
                    
                    {/* 🔔 Campanita */}
                    <div className="relative notificaciones-container">
                        <button
                            onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-md hover:bg-white/30 hover:scale-105 transition-all duration-300 relative"
                        >
                            <Bell className="h-5 w-5" />
                            {pendientes > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {pendientes}
                                </span>
                            )}
                        </button>

                        {/* Panel de notificaciones */}
                        {notificacionesAbiertas && (
                            <div className="absolute right-0 mt-3 w-80 max-h-[450px] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-100 z-50">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-[#2D1B1A] flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-orange-500" />
                                        Notificaciones
                                    </h3>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {pendientes} pendientes
                                    </span>
                                </div>

                                <div className="p-2">
                                    {pendientes === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            ✅ No hay pedidos pendientes
                                        </div>
                                    ) : (
                                        notificaciones.filter(n => n.estado === 'pendiente').map((noti) => (
                                            <div key={noti.id} className="p-3 rounded-xl hover:bg-orange-50 transition border border-gray-100 mb-2 last:mb-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                                                                {noti.pedido}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{noti.tiempo}</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-[#2D1B1A] mt-1">
                                                            🪑 Mesa {noti.mesa} - {noti.cliente}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{noti.productos}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => window.location.href = `/produccion?pedido=${noti.id}`}
                                                        className="ml-2 px-3 py-1.5 bg-[#C9A96E] hover:bg-[#B8975D] text-white rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1"
                                                    >
                                                        Tomar <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 border-t border-gray-100">
                                    <button
                                        onClick={() => window.location.href = '/produccion'}
                                        className="w-full text-center text-sm text-[#C9A96E] hover:text-[#B8975D] font-medium transition flex items-center justify-center gap-1"
                                    >
                                        Ver todos los pedidos <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 📅 Calendario */}
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-md hover:bg-white/30 hover:scale-105 transition-all duration-300">
                        <CalendarDays className="h-5 w-5" />
                    </button>

                    {/* ✉️ Correo */}
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-md hover:bg-white/30 hover:scale-105 transition-all duration-300">
                        <Mail className="h-5 w-5" />
                    </button>

                    {/* ⚙️ Configuración */}
                    <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-md hover:bg-white/30 hover:scale-105 transition-all duration-300">
                        <Settings className="h-5 w-5" />
                    </button>

                    {/* 👤 Perfil */}
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-md hover:bg-white/30 hover:scale-105 transition-all duration-300">
                                    <Avatar className="h-8 w-8 rounded-full">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* 🚪 Logout */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="ml-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105 transition-all duration-300"
                    >
                        <LogOut className="h-5 w-5" />
                    </Link>

                </div>
            </header>

            {/* ===== BREADCRUMBS ===== */}
            <div className="flex w-full border-b border-sidebar-border/70 bg-white/80">
                <div className="mx-auto flex min-h-12 w-full items-center justify-start px-6 py-2 text-neutral-500">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
        </>
    );
}
