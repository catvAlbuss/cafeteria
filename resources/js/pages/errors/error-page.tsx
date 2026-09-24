import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, Home } from 'lucide-react';

type Props = {
    status: number;
};

const MESSAGES: Record<number, { title: string; description: string }> = {
    403: {
        title: 'No tienes acceso a esta sección',
        description:
            'Tu rol no cuenta con permiso para ver esta página. Si crees que es un error, pídele a un Gerente que revise tus permisos.',
    },
    404: {
        title: 'Página no encontrada',
        description: 'La página que buscas no existe o fue movida.',
    },
    419: {
        title: 'Tu sesión expiró',
        description: 'Por seguridad, vuelve a iniciar sesión para continuar.',
    },
    429: {
        title: 'Demasiados intentos',
        description: 'Espera un momento antes de volver a intentarlo.',
    },
    500: {
        title: 'Algo salió mal',
        description:
            'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.',
    },
    503: {
        title: 'Servicio no disponible',
        description:
            'El sistema está en mantenimiento. Vuelve a intentarlo en breve.',
    },
};

export default function ErrorPage({ status }: Props) {
    const { title, description } = MESSAGES[status] ?? {
        title: 'Ocurrió un error',
        description: 'Algo no salió como esperábamos.',
    };

    return (
        <>
            <Head title={`${status} - ${title}`} />
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream-soft px-6 text-center dark:bg-walnut">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand dark:bg-espresso">
                    <ShieldAlert className="h-8 w-8 text-cinnamon dark:text-gold" />
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-widest text-cinnamon uppercase dark:text-gold">
                        Error {status}
                    </p>
                    <h1 className="font-serif text-2xl font-bold text-espresso dark:text-latte">
                        {title}
                    </h1>
                    <p className="max-w-md text-sm text-espresso/70 dark:text-latte/70">
                        {description}
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-cinnamon px-5 py-2.5 text-sm font-semibold text-cream-soft transition hover:bg-espresso dark:bg-gold dark:text-ink dark:hover:bg-gold-deep"
                >
                    <Home className="h-4 w-4" />
                    Volver al inicio
                </Link>
            </div>
        </>
    );
}

ErrorPage.layout = (page: React.ReactNode) => page;
