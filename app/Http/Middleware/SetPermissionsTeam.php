<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetPermissionsTeam
{
    /**
     * Bind the authenticated user's current sede as the team context for
     * Spatie Permission, so hasRole()/can() checks resolve correctly.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($user->current_team_id);
        }

        return $next($request);
    }
}
