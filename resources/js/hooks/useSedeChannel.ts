import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import echo from '@/echo';

type EventHandlers = Record<string, (payload: any) => void>;

/**
 * Subscribes to the current sede's private channel (`sede.{teamId}.{area}`)
 * for the duration of the component's lifetime.
 */
export function useSedeChannel(area: string, events: EventHandlers) {
    const { currentTeam } = usePage<{ currentTeam?: { id: number } }>().props;
    const teamId = currentTeam?.id;

    useEffect(() => {
        if (!echo || !teamId) return;

        const channelName = `sede.${teamId}.${area}`;
        const channel = echo.private(channelName);

        Object.entries(events).forEach(([event, handler]) => {
            channel.listen(`.${event}`, handler);
        });

        return () => {
            echo?.leave(channelName);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId, area]);
}
