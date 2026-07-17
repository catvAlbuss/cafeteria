import { Link, usePage } from '@inertiajs/react';
import { 
    CalendarDays, 
    Mail, 
    Settings, 
    LogOut,
} from 'lucide-react';
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
