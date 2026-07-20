<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards partner-only routes: requires ResolveTenant to have already
 * resolved a tenant for this user (i.e. they have a tenant_user membership).
 */
class EnsurePartnerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(app(TenantContext::class)->check(), 403, 'You do not have access to any business on WashRewards SA.');

        return $next($request);
    }
}
