import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,
) => boolean;

export type IsCurrentOrParentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

const BASE_URL = 'http://localhost';

function splitPathAndSearch(url: string): { path: string; search: string } {
    try {
        const parsed = new URL(url, BASE_URL);

        return { path: parsed.pathname, search: parsed.search };
    } catch {
        return { path: url, search: '' };
    }
}

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();
    const currentUrlPath = splitPathAndSearch(page.url).path;

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,
    ) => {
        const target = splitPathAndSearch(toUrl(urlToCheck));
        const actual = splitPathAndSearch(currentUrl ?? page.url);
        const pathMatches = startsWith
            ? actual.path.startsWith(target.path)
            : actual.path === target.path;

        if (!pathMatches) {
            return false;
        }

        // Los destinos con query (ej. /produccion?area=cocina) solo se
        // marcan activos si la página actual tiene exactamente esos
        // parámetros; los de ruta simple se comparan solo por pathname.
        if (target.search !== '') {
            return actual.search === target.search;
        }

        return true;
    };

    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        return isCurrentUrl(urlToCheck, currentUrl, true);
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        whenCurrentUrl,
    };
}
