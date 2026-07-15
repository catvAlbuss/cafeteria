import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Solo ejecutar en el cliente (navegador)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (csrfToken) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        axios.defaults.withCredentials = true;
    }

    initializeTheme();

    // Inicializa Laravel Echo (Reverb) para los canales en tiempo real
    import('@/echo');
}

// Cargar todas las páginas eager
const pages = import.meta.glob('./pages/**/*.tsx', { eager: true }) as Record<string, { default: any }>;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        // Buscar la página en el objeto pages
        const pageKey = `./pages/${name}.tsx`;
        const page = pages[pageKey];
        
        if (page) {
            return page.default;
        }
        
        // Fallback si no encuentra
        throw new Error(`Page not found: ${name}`);
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
            case name.startsWith('teams/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});