import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, Home } from 'lucide-react';

type Props = {
    status: number;
};

const MESSAGES: Record<number, { title: string; description: string }> = {
    403: {
        title: 'No tienes acceso a esta sección',
        description: 'Tu rol no cuenta con permiso para ver esta página. Si crees que es un error, pídele a un Gerente que revise tus permisos.',
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
        description: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.',
    },
    503: {
        title: 'Servicio no disponible',
        description: 'El sistema está en mantenimiento. Vuelve a intentarlo en breve.',
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
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FBF3E7] px-6 text-center dark:bg-[#180F09]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E1C8] dark:bg-[#3A2314]">
                    <ShieldAlert className="h-8 w-8 text-[#8A5A2B] dark:text-[#C9A96E]" />
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-widest text-[#8A5A2B] dark:text-[#C9A96E] uppercase">Error {status}</p>
                    <h1 className="font-serif text-2xl font-bold text-[#3A2314] dark:text-[#F5E6D3]">{title}</h1>
                    <p className="max-w-md text-sm text-[#3A2314]/70 dark:text-[#F5E6D3]/70">{description}</p>
                </div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#5A3A1E] px-5 py-2.5 text-sm font-semibold text-[#FBF3E7] transition hover:bg-[#3A2314] dark:bg-[#C9A96E] dark:text-[#2A1810] dark:hover:bg-[#B8975D]"
                >
                    <Home className="h-4 w-4" />
                    Volver al inicio
                </Link>
            </div>
        </>
    );
}

ErrorPage.layout = (page: React.ReactNode) => page;
