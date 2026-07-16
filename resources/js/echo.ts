import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<'reverb'>;
    }
}

function createEcho(): Echo<'reverb'> | undefined {
    if (typeof window === 'undefined') return undefined;

    const key = import.meta.env.VITE_REVERB_APP_KEY;
    const host = import.meta.env.VITE_REVERB_HOST;
    const localHosts = ['localhost', '127.0.0.1', '::1'];

    if (!key || !host || (import.meta.env.PROD && localHosts.includes(host))) {
        return undefined;
    }

    window.Pusher = Pusher;

    return new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}

if (typeof window !== 'undefined' && !window.Echo) {
    window.Echo = createEcho();
}

export default typeof window !== 'undefined' ? window.Echo : undefined;
