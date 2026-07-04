import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    DollarSign,
    BarChart3,
    Coffee,
    Package,
    Users,
    MapPin,
    Settings,
    UserCog,
    HelpCircle,
    FileText,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const dashboardUrl = '/dashboard';

    //  TODAS LAS PÁGINAS (SIN items)
    const mainNavItems: NavItem[] = [
        // DASHBOARD
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: ' Ventas',
            href: '/ventas',
            icon: DollarSign,
        },
        
        {
            title: 'Caja',
            href: '/caja',
            icon: DollarSign,
        },
        
        {
            title: 'Reportes',
            href: '/reportes',
            icon: BarChart3,
        },
        {
            title: ' Contador',
            href: '/contador',
            icon: DollarSign,
        },
        
        //  RESTAURANTE - TÍTULO SEPARADOR
        {
            title: ' Platos',
            href: '/platos',
            icon: Coffee,
        },
        {
            title: 'Mesas',
            href: '/mesas',
            icon: Coffee,
        },
        {
            title: ' Covers',
            href: '/covers',
            icon: Coffee,
        },
        
        //  INVENTARIO - TÍTULO SEPARADOR
        {
            title: 'Inventario',
            href: '#',
            icon: Package,
        },
        {
            title: 'Producción',
            href: '/produccion',
            icon: Package,
        },
        {
            title: 'Cardex',
            href: '/cardex',
            icon: Package,
        },
        {
            title: 'Mermas',
            href: '/mermas',
            icon: Package,
        },
        {
            title: 'Etiquetas',
            href: '/etiquetas',
            icon: Package,
        },
        
     
        {
            title: 'Clientes',
            href: '/clientes',
            icon: Users,
        },
        {
            title: 'Delivery',
            href: '/delivery',
            icon: MapPin,
        },
        
        // ⚙️ CONFIGURACIÓN - TÍTULO SEPARADOR
      
        {
            title: 'Configuración',
            href: '/configuracion',
            icon: Settings,
        },
        {
            title: ' Mi Perfil',
            href: '/perfil',
            icon: UserCog,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Documentación',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: FileText,
        },
        {
            title: 'Soporte',
            href: '/soporte',
            icon: HelpCircle,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}