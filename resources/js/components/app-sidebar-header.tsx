import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { state, isMobile } = useSidebar();

    const headerPosition = isMobile
        ? 'left-0 w-full'
        : state === 'collapsed'
          ? 'left-(--sidebar-width-icon) w-[calc(100%-var(--sidebar-width-icon))]'
          : 'left-(--sidebar-width) w-[calc(100%-var(--sidebar-width))]';

    return (
        <header
            className={`
                fixed
                top-0
                right-0
                z-30
                flex
                h-16
                min-h-16
                shrink-0
                items-center
                border-b
                border-[#F3E1C8]
                bg-white
                px-4
                py-2
                shadow-sm
                transition-[left,width,height]
                duration-200
                ease-linear
                ${headerPosition}
                md:px-6
            `}
        >
            <div className="flex w-full min-w-0 items-center gap-3">
                <SidebarTrigger className="-ml-1 shrink-0 text-[#5A3D2B] hover:bg-[#F6EBDD]" />

                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}