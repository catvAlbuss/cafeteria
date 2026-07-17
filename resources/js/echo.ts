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

    const meta = (name: string) => document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim();
    const key = meta('reverb-key') || import.meta.env.VITE_REVERB_APP_KEY;
    const rawHost = meta('reverb-host') || import.meta.env.VITE_REVERB_HOST;
    const host = rawHost?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const localHosts = ['localhost', '127.0.0.1', '::1'];

    if (!key || !host || (import.meta.env.PROD && localHosts.includes(host))) {
        if (import.meta.env.PROD) {
            console.error('Reverb no se inició: configura REVERB_APP_KEY y REVERB_HOST con un dominio público.');
        }

        return undefined;
    }

    const scheme = meta('reverb-scheme') || import.meta.env.VITE_REVERB_SCHEME || window.location.protocol.replace(':', '');
    const forceTLS = scheme === 'https';
    const configuredPort = Number(meta('reverb-port') || import.meta.env.VITE_REVERB_PORT || (forceTLS ? 443 : 80));

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
