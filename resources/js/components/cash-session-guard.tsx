import { Link, usePage } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSedeChannel } from '@/hooks/useSedeChannel';

type JornadaCaja = { abierta: boolean; puedeAbrir: boolean };

export function CashSessionGuard({ children }: { children: ReactNode }) {
    const page = usePage<{ jornadaCaja?: JornadaCaja }>();
    const jornadaProp = page.props.jornadaCaja;
    const [jornada, setJornada] = useState(jornadaProp);
    const isCashSessionPage = page.url.startsWith('/contador');

    useEffect(() => {
        setJornada(jornadaProp);
    }, [jornadaProp]);

    useSedeChannel('caja', {
        'caja.actualizada': (caja: { estado: 'Abierta' | 'Cerrada' }) => {
            setJornada((current) =>
                current
                    ? { ...current, abierta: caja.estado === 'Abierta' }
                    : current,
            );
        },
    });

    if (!jornada || jornada.abierta || isCashSessionPage) {
        return children;
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-cream p-6">
            <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-card p-8 text-center shadow-xl">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <LockKeyhole className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-chocolate">
                    Sede cerrada
                </h1>
                <p className="mt-3 text-sm leading-6 text-cocoa">
                    La operación comenzará cuando gerencia, administración o
                    caja abran la jornada.
                </p>
                {jornada.puedeAbrir && (
                    <Link
                        href="/contador"
                        className="mt-6 inline-flex rounded-xl bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold-deep"
                    >
                        Abrir turno de caja
                    </Link>
                )}
            </div>
        </div>
    );
}
