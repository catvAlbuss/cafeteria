<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureReliableInertiaResponses
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->isDocumentNavigation($request)) {
            $request->headers->remove('X-Inertia');
            $request->headers->remove('X-Inertia-Version');
            $request->headers->remove('X-Requested-With');
        }

        $response = $next($request);

        if ($this->isInertiaPageResponse($response)) {
            $response->headers->set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
            $response->headers->set('Vary', 'X-Inertia', false);
        }

        return $response;
    }

    private function isDocumentNavigation(Request $request): bool
    {
        return $request->isMethod('GET')
            && $request->headers->get('Sec-Fetch-Mode') === 'navigate'
            && $request->headers->get('Sec-Fetch-Dest') === 'document';
    }

    private function isInertiaPageResponse(Response $response): bool
    {
        $contentType = (string) $response->headers->get('Content-Type');

        return $response->headers->get('X-Inertia') === 'true'
            || str_starts_with($contentType, 'text/html');
    }
}
