import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import echo from '@/echo';

type EventHandlers = Record<string, (payload: any) => void>;

export function useSedeChannel(area: string, events: EventHandlers, enabled = true) {
    const { currentTeam } = usePage<{ currentTeam?: { id: number } }>().props;
    const teamId = currentTeam?.id;

    // Siempre apunta a la versión más reciente de los handlers,
    // sin forzar una nueva suscripción al canal en cada render.
    const eventsRef = useRef(events);
    eventsRef.current = events;

    useEffect(() => {
        if (!echo || !teamId || !enabled) return;

        const channelName = `sede.${teamId}.${area}`;
        const channel = echo.private(channelName);

        // Un único wrapper estable por evento, que siempre delega
        // al handler actual guardado en el ref.
        const stableHandlers: EventHandlers = {};
        Object.keys(eventsRef.current).forEach((event) => {
            stableHandlers[event] = (payload: any) => eventsRef.current[event]?.(payload);
            channel.listen(`.${event}`, stableHandlers[event]);
        });

        return () => {
            Object.entries(stableHandlers).forEach(([event, handler]) => {
                channel.stopListening(`.${event}`, handler);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId, area, enabled]);
}