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
    const permissions = page.props.auth.permissions;

    //  TODAS LAS PÁGINAS (se filtran según el permiso de "ver" de cada rol)
    const allNavItems: NavItem[] = [
        // DASHBOARD - siempre visible, sin permiso asociado
        {
            title: 'Inicio',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: ' Ventas',
            href: '/ventas',
            icon: DollarSign,
            permission: 'ver ventas',
        },
        {
            title: 'Caja',
            href: '/caja',
            icon: DollarSign,
            permission: 'ver caja',
        },
        {
            title: 'Reportes',
            href: '/reportes',
            icon: BarChart3,
            permission: 'ver reportes',
        },
        {
            title: ' Contador',
            href: '/contador',
            icon: DollarSign,
            permission: 'ver contador',
        },

        //  RESTAURANTE - TÍTULO SEPARADOR
        {
            title: ' Platos',
            href: '/platos',
            icon: Coffee,
            permission: 'ver platos',
        },
        {
            title: 'Mesas',
            href: '/mesas',
            icon: Coffee,
            permission: 'ver mesas',
        },
        {
            title: ' Covers',
            href: '/covers',
            icon: Coffee,
            permission: 'ver covers',
        },

        {
            title: 'Producción',
            href: '/produccion',
            icon: Package,
            permission: 'ver produccion',
        },
        {
            title: 'Insumos',
            href: '/insumos',
            icon: Package,
            permission: 'ver insumos',
        },
        {
            title: 'Cardex',
            href: '/cardex',
            icon: Package,
            permission: 'ver cardex',
        },
        {
            title: 'Mermas',
            href: '/mermas',
            icon: Package,
            permission: 'ver mermas',
        },

        {
            title: 'Clientes',
            href: '/clientes',
            icon: Users,
            permission: 'ver clientes',
        },
        {
            title: 'Delivery',
            href: '/delivery',
            icon: MapPin,
            permission: 'ver delivery',
        },
    ];

    const mainNavItems: NavItem[] = allNavItems.filter(
        (item) => !item.permission || permissions.includes(item.permission),
    );

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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}