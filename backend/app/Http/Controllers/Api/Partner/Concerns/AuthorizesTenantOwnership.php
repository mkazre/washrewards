<?php

namespace App\Http\Controllers\Api\Partner\Concerns;

use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;

/**
 * Route-model-bound params on partner routes resolve via SubstituteBindings,
 * which lives in Laravel's built-in `api` middleware group and therefore runs
 * BEFORE our custom `tenant` middleware sets TenantContext — so the
 * BelongsToTenant global scope isn't active yet when the model is resolved,
 * and a bound {booking}/{service}/{promotion} can belong to another tenant.
 * Every partner controller action taking a bound model must call this.
 */
trait AuthorizesTenantOwnership
{
    private function assertOwnedByCurrentTenant(Model $model): void
    {
        abort_unless(
            $model->tenant_id === app(TenantContext::class)->id(),
            404
        );
    }
}
