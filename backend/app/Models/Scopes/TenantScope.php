<?php

namespace App\Models\Scopes;

use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Row-level tenant isolation. Only filters when a tenant has been resolved
 * into the request (see ResolveTenant middleware) — e.g. an authenticated
 * partner/staff session. Unauthenticated consumer discovery requests have no
 * tenant in context, so queries run unscoped across all tenants on purpose.
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(TenantContext::class);

        if ($context->check()) {
            $builder->where($model->qualifyColumn('tenant_id'), $context->id());
        }
    }
}
