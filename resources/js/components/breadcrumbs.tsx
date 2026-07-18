import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarClock, ChevronRight, Radio } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useSedeChannel } from '@/hooks/useSedeChannel';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

interface LiveNotification {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    tone: 'pedido' | 'listo';
    href: string;
}

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const { auth } = usePage<{
        auth?: {
            user?: { id: number; name: string };
            permissions?: string[];
        };
    }>().props;
    const permissions = auth?.permissions ?? [];
    const canListenToProduction = permissions.includes('visualizar comandas');
    const canListenToSalon = permissions.includes('crear pedidos');
    const productionAreas = permissions.includes('ver bar')
        ? ['bar']
        : permissions.includes('ver cocina')
          ? ['cocina', 'horno', 'postres']
          : [];
    const currentTitle = breadcrumbs.at(-1)?.title ?? 'Panel';
    const [now, setNow] = useState<Date>(() => new Date());
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<LiveNotification[]>([]);
    const visibleCount = unreadCount || notifications.length;

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, []);

    const currentDateTime = useMemo(() => {
        if (!now) {
            return 'Sincronizando hora...';
        }

        return new Intl.DateTimeFormat('es-PE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(now);
    }, [now]);

    const playBell = useCallback((tone: LiveNotification['tone']) => {
        try {
            const AudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;

            if (!AudioContext) {
                return;
            }

            const audioContext = new AudioContext();
            const strikeBell = (delay: number, volume: number) => {
                const startAt = audioContext.currentTime + delay;
                const harmonics = [660, 1320, 1980, 2640];

                harmonics.forEach((frequency, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    const harmonicVolume = volume / (index + 1);

                    oscillator.type = index === 0 ? 'sine' : 'triangle';
                    oscillator.frequency.setValueAtTime(frequency, startAt);
                    gain.gain.setValueAtTime(0.0001, startAt);
                    gain.gain.exponentialRampToValueAtTime(harmonicVolume, startAt + 0.012);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.25);
                    oscillator.connect(gain);
                    gain.connect(audioContext.destination);
                    oscillator.start(startAt);
                    oscillator.stop(startAt + 1.3);
                });
            };

            strikeBell(0, 0.42);

            if (tone === 'listo') {
                strikeBell(0.32, 0.3);
            }

            window.setTimeout(() => void audioContext.close(), 1800);
        } catch {
            // Browsers can block audio until the first user interaction.
        }
    }, []);

    const addNotification = useCallback((notification: Omit<LiveNotification, 'id' | 'createdAt'>) => {
        const nextNotification = {
            ...notification,
            id: `${notification.tone}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date(),
        };

        setNotifications(prev => [nextNotification, ...prev].slice(0, 8));
        setUnreadCount(prev => prev + 1);
        playBell(notification.tone);

        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const deduplicationKey = `live-notification-${notification.tone}-${notification.href}`;
            const lastNotificationAt = Number(localStorage.getItem(deduplicationKey) || 0);

            if (Date.now() - lastNotificationAt > 3000) {
                localStorage.setItem(deduplicationKey, String(Date.now()));
                const browserNotification = new Notification(notification.title, {
                    body: notification.description,
                    icon: '/logo.png',
                    tag: deduplicationKey,
                });

                browserNotification.onclick = () => {
                    window.focus();
                    router.visit(notification.href);
                    browserNotification.close();
                };
            }
        }
    }, [playBell]);

    useSedeChannel('produccion', {
        'pedido.creado': (payload: any) => {
            if (!productionAreas.includes(payload.area)) {
                return;
            }

            addNotification({
                title: `Nuevo pedido ${payload.numero ?? ''} · ${payload.area === 'bar' ? 'Bar' : 'Cocina'}`.trim(),
                description: payload.mesa?.numero
                    ? `Mesa ${payload.mesa.numero} - ${payload.cliente ?? 'Cliente'}`
                    : `${payload.tipo === 'delivery' ? 'Delivery' : 'Pedido'} - ${payload.cliente ?? 'Cliente'}`,
                tone: 'pedido',
                href: '/produccion',
            });
        },
    }, canListenToProduction);

    useSedeChannel('salon', {
        'pedido.listo': (payload: any) => {
            if (payload.mozo_id && payload.mozo_id !== auth?.user?.id) {
                return;
            }

            const mozo = payload.mozo_nombre ? `Mozo ${payload.mozo_nombre}: ` : '';
            const message = payload.mesa_numero
                ? `la mesa ${payload.mesa_numero} está lista para atender`
                : payload.mesa_id
                  ? `la mesa ${payload.mesa_id} está lista para atender`
                  : 'el pedido está listo para entregar';

            addNotification({
                title: `Pedido listo ${payload.numero ?? ''}`.trim(),
                description: `${mozo}${message}`,
                tone: 'listo',
                href: '/mesas',
            });
        },
    }, canListenToSalon);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (!target.closest('.breadcrumb-notifications') && isNotificationsOpen) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => document.removeEventListener('click', handleClickOutside);
    }, [isNotificationsOpen]);

    const openNotifications = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission();
        }

        setIsNotificationsOpen(prev => !prev);
        setUnreadCount(0);
        playBell('pedido');
    };

    return (
        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-neutral-950 md:text-lg">{currentTitle}</p>
                {breadcrumbs.length > 1 && (
                    <Breadcrumb>
                        <BreadcrumbList className="mt-0.5 flex-nowrap overflow-hidden text-xs text-neutral-600">
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1;

                                return (
                                    <Fragment key={index}>
                                        <BreadcrumbItem className="min-w-0">
                                            {isLast ? (
                                                <BreadcrumbPage className="truncate font-semibold text-neutral-900">
                                                    {item.title}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link className="truncate text-neutral-600 hover:text-orange-600" href={item.href}>
                                                        {item.title}
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                )}
            </div>

            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
                <div className="relative breadcrumb-notifications">
                    <button
                        type="button"
                        onClick={openNotifications}
                        className="relative flex h-10 items-center gap-2 rounded-lg border border-orange-200 bg-white px-2.5 text-xs font-bold text-neutral-950 shadow-sm ring-1 ring-white transition hover:border-orange-400 hover:bg-orange-50 sm:px-3"
                    >
                        <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-orange-100">
                            <Bell className="h-4 w-4 text-orange-600" />
                            {visibleCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                                    {visibleCount}
                                </span>
                            )}
                        </span>
                        <span className="hidden sm:inline">Notificaciones</span>
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-orange-100 bg-neutral-950 px-4 py-3 text-white">
                                <div>
                                    <p className="flex items-center gap-2 text-sm font-bold">
                                        <Bell className="h-4 w-4 text-orange-400" />
                                        Alertas en vivo
                                    </p>
                                    <p className="mt-0.5 text-xs text-white/70">Pedidos y avisos de salon</p>
                                </div>
                                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-200">
                                    <Radio className="h-3.5 w-3.5" />
                                    Live
                                </span>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-2">
                                {notifications.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 px-4 py-6 text-center">
                                        <Bell className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                                        <p className="text-sm font-bold text-neutral-900">Sin alertas recientes</p>
                                        <p className="mt-1 text-xs text-neutral-600">Cuando llegue un pedido sonara la campana y subira el contador.</p>
                                        <button
                                            type="button"
                                            onClick={() => playBell('pedido')}
                                            className="mt-3 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                                        >
                                            Probar sonido
                                        </button>
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={() => {
                                                setIsNotificationsOpen(false);
                                                router.visit(notification.href);
                                            }}
                                            className="mb-2 block w-full rounded-lg border border-orange-100 bg-orange-50 p-3 text-left transition hover:border-orange-300 hover:bg-orange-100 last:mb-0"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-extrabold text-neutral-950">{notification.title}</p>
                                                    <p className="mt-0.5 truncate text-xs font-medium text-neutral-700">{notification.description}</p>
                                                    <p className="mt-1 text-[11px] text-neutral-500">
                                                        {notification.createdAt.toLocaleTimeString('es-PE', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-orange-500" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold text-neutral-800 shadow-sm sm:px-3">
                    <CalendarClock className="h-4 w-4 text-orange-600" />
                    <span className="truncate whitespace-nowrap">{currentDateTime}</span>
                </div>
            </div>
        </div>
    );
}
