import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Receipt,
    Banknote,
    BarChart3,
    Coins,
    CookingPot,
    Armchair,
    Ticket,
    ChefHat,
    Martini,
    Boxes,
    BookOpen,
    Trash2,
    Users,
    Truck,
    PackageSearch,
    MapPin,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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

function SidebarBranch({ canManageTeams }: { canManageTeams: boolean }) {
    const page = usePage();
    const currentTeam = page.props.currentTeam;

    return (
        <div className="flex w-full min-w-0 items-center justify-stretch border-y border-sidebar-border bg-sidebar-branch px-2 py-2">
            {canManageTeams ? (
                <TeamSwitcher label="Sede Principal" />
            ) : (
                <div className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm leading-tight">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15">
                        <MapPin className="size-4 text-sidebar-primary" />
                    </span>
                    <span className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-[10px] font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
                            Sede Principal
                        </span>
                        <span className="truncate font-semibold text-sidebar-foreground">
                            {currentTeam?.name ?? 'Sin sede'}
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
}

export function AppSidebar() {
    const page = usePage();
    const dashboardUrl = '/dashboard';
    const permissions = page.props.auth?.permissions ?? [];
    const roles = page.props.auth?.roles ?? [];

    const currentTeam = page.props.currentTeam;
    const canManageTeams =
        roles.includes('Gerente') ||
        ['owner', 'admin'].includes(currentTeam?.role ?? '');
    const canManageCashSession =
        roles.includes('Gerente') ||
        roles.includes('Cajero') ||
        ['owner', 'admin'].includes(currentTeam?.role ?? '');
    const isProductionOperator =
        roles.includes('Cocinero') || roles.includes('Bar');

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
            icon: Receipt,
            permission: 'ver ventas',
        },
        {
            title: 'Caja',
            href: '/caja',
            icon: Banknote,
            permission: 'ver caja',
        },
        {
            title: 'Reportes',
            href: '/reportes',
            icon: BarChart3,
            permission: 'ver reportes',
        },
        {
            title: 'Turno de caja',
            href: '/contador',
            icon: Coins,
            permission: 'ver contador',
        },

        //  RESTAURANTE - TÍTULO SEPARADOR
        {
            title: ' Platos',
            href: '/platos',
            icon: CookingPot,
            permission: 'ver platos',
        },
        {
            title: 'Mesas',
            href: '/mesas',
            icon: Armchair,
            permission: 'ver mesas',
        },
        {
            title: ' Covers',
            href: '/covers',
            icon: Ticket,
            permission: 'ver covers',
        },

        {
            title: 'Cocina',
            href: '/produccion?area=cocina',
            icon: ChefHat,
            permission: 'ver cocina',
        },
        {
            title: 'Bar',
            href: '/produccion?area=bar',
            icon: Martini,
            permission: 'ver bar',
        },
        {
            title: 'Insumos',
            href: '/insumos',
            icon: Boxes,
            permission: 'ver insumos',
        },
        {
            title: 'Cardex',
            href: '/cardex',
            icon: BookOpen,
            permission: 'ver cardex',
        },
        {
            title: 'Mermas',
            href: '/mermas',
            icon: Trash2,
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
            icon: Truck,
            permission: 'ver delivery',
        },
    ];

    const mainNavItems: NavItem[] = allNavItems.filter((item) =>
        item.href === '/contador'
            ? canManageCashSession
            : !item.permission || permissions.includes(item.permission),
    );

    if (isProductionOperator) {
        mainNavItems.push({
            title: 'Mi inventario',
            href: '/mi-inventario',
            icon: PackageSearch,
        });
    }

    return (
        <Sidebar collapsible="icon">
            {/* ZONA 1 / LOGO */}
            <SidebarHeader className="bg-sidebar-zone p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* ZONA 2 / SEDE PRINCIPAL */}
            <SidebarBranch canManageTeams={canManageTeams} />

            {/* ZONA 3 / NAVEGACIÓN */}
            <SidebarContent className="bg-sidebar">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            {/* ZONA 4 / PIE */}
            <SidebarFooter className="bg-sidebar-zone">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
