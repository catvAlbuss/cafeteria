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
    const host = import.meta.env.VITE_REVERB_HOST?.trim().toLowerCase();
    const localHosts = ['localhost', '127.0.0.1', '::1'];

    if (!key || !host || (import.meta.env.PROD && localHosts.includes(host))) {
        if (import.meta.env.PROD) {
            console.error('Reverb no se inició: configura VITE_REVERB_APP_KEY y un VITE_REVERB_HOST público antes de ejecutar npm run build.');
        }

        return undefined;
    }

    const forceTLS = (import.meta.env.VITE_REVERB_SCHEME ?? window.location.protocol.replace(':', '')) === 'https';
    const configuredPort = Number(import.meta.env.VITE_REVERB_PORT || (forceTLS ? 443 : 80));

    window.Pusher = Pusher;

    return new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: configuredPort,
        wssPort: configuredPort,
        forceTLS,
        enabledTransports: forceTLS ? ['wss'] : ['ws'],
        disableStats: true,
    });
}

if (typeof window !== 'undefined' && !window.Echo) {
    window.Echo = createEcho();
}

export default typeof window !== 'undefined' ? window.Echo : undefined;
