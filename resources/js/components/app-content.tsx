import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({
    variant = 'sidebar',
    children,
    className,
    ...props
}: Props) {
    if (variant === 'sidebar') {
        return (
           <SidebarInset
    {...props}
    className={`min-h-svh w-full overflow-y-auto bg-[#FBF7F0] ${className ?? ''}`}
>
    {children}
</SidebarInset>
        );
    }

    return (
        <main
            className={`mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl bg-[#FBF7F0] ${className ?? ''}`}
            {...props}
        >
            {children}
        </main>
    );
}