import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="fixed right-0 top-0 z-30 flex min-h-16 shrink-0 items-center border-b border-neutral-200/80 bg-white/90 px-3 shadow-sm backdrop-blur-sm transition-[left,height] duration-200 ease-linear left-0 md:left-(--sidebar-width) md:px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:md:left-(--sidebar-width-icon) group-has-data-[variant=inset]/sidebar-wrapper:group-has-data-[collapsible=icon]/sidebar-wrapper:md:left-[calc(var(--sidebar-width-icon)+0.5rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:md:min-h-12">
            <div className="flex w-full min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 shrink-0 text-neutral-700 hover:bg-neutral-100" />
                <div className="hidden h-6 w-px shrink-0 bg-neutral-200 sm:block" aria-hidden="true" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
