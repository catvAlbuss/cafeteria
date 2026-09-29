import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="fixed top-0 right-0 left-0 z-30 flex min-h-16.25 shrink-0 items-center border-b border-border bg-background px-3 shadow-sm transition-[left,height] duration-200 ease-linear md:left-(--sidebar-width) md:px-4 group-has-data-[collapsible=icon]/sidebar-wrapper:md:left-(--sidebar-width-icon) group-has-data-[collapsible=icon]/sidebar-wrapper:md:min-h-12">
            <div className="flex w-full min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:bg-accent" />
                <div
                    className="hidden h-6 w-px shrink-0 bg-border sm:block"
                    aria-hidden="true"
                />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
