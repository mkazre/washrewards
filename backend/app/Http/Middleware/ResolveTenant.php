<?php

namespace App\Http\Middleware;

use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the "current tenant" for partner-facing routes so BelongsToTenant
 * models auto-scope to it. The authenticated user must have an active
 * membership (tenant_user) for the resolved tenant — either their sole tenant,
 * or the one requested via the X-Tenant-Id header for staff on multiple tenants.
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $memberships = $user->tenants();

            if ($tenantId = $request->header('X-Tenant-Id')) {
                $tenant = $memberships->where('tenants.id', $tenantId)->first();
            } else {
                $tenant = $memberships->first();
            }

            if ($tenant) {
                app(TenantContext::class)->set($tenant);
            }
        }

        return $next($request);
    }
}
