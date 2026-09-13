<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the in-app "Platform (Owner)" console routes — mirrors
 * EnsurePartnerAccess, but for network-wide (not tenant-scoped) access.
 * Reuses the same is_admin flag that gates the Filament admin panel
 * (see User::canAccessPanel()), since a platform owner is a platform admin.
 */
class EnsurePlatformOwnerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless((bool) $request->user()?->is_admin, 403, 'You do not have access to the Platform console.');

        return $next($request);
    }
}
