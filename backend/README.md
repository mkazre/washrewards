# WashRewards SA — Backend

Laravel 12 API + Filament admin for the WashRewards SA car-wash booking and
loyalty platform. See [`docs/`](../docs/) at the repo root for the full
technical specification and product prototype.

## Stack

- **Laravel 12** (PHP 8.3+), run locally via **Laravel Sail** (Docker)
- **MySQL 8** + **Redis** (cache, sessions, queues)
- **Laravel Sanctum** — token auth for the React Native mobile app
- **Filament v4** — admin dashboard at `/admin`, themed navy `#091830` / amber
  `#F59E0B` with Space Grotesk (headings) and Inter (body)
- **Shared-DB, row-level multi-tenancy** — see [Multi-tenancy](#multi-tenancy) below

## Getting started

```bash
composer install
cp .env.example .env
php artisan key:generate

./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
```

The app is then available at `http://localhost`, the admin panel at
`http://localhost/admin`.

**Seeded admin login:** `admin@washrewards.co.za` / `password`
(all seeded users share the `password` password — see
`database/seeders/UserSeeder.php`).

Use `./vendor/bin/sail artisan ...` / `./vendor/bin/sail composer ...` for any
artisan or composer command so it runs inside the container.

## Multi-tenancy

Every car-wash business is a `Tenant` (`fixed_garage` or `mobile_wash`). The
platform uses **shared-database, row-level multi-tenancy**:

- `App\Models\Concerns\BelongsToTenant` — trait applied to tenant-owned models
  (`Service`, `Booking`, `Review`, `Promotion`, `Transaction`, `Settlement`).
  Adds a global scope that filters by `tenant_id`, and auto-fills `tenant_id`
  on create from the resolved tenant context.
- `App\Support\Tenancy\TenantContext` — request-scoped singleton holding the
  "current tenant," if any.
- `App\Http\Middleware\ResolveTenant` (alias `tenant`) — resolves the current
  tenant from the authenticated user's `tenant_user` membership (or the
  `X-Tenant-Id` header, for staff on multiple tenants) and sets it on
  `TenantContext`.

When no tenant is resolved (e.g. unauthenticated consumer discovery
endpoints), tenant-scoped models are queried **unscoped** across all tenants —
that's intentional, since consumers browse across the whole marketplace. The
Filament admin panel never resolves a tenant, so platform operators always see
all tenants' data.

## Project layout

- `app/Models` — `User`, `Tenant`, `Vehicle`, `Service`, `Booking`, `Review`,
  `Promotion`, `Transaction`, `Settlement`, `Voucher`, `PlatformSetting`
- `app/Filament/Resources` — one admin resource per model above, grouped into
  **Platform** (tenants, users, settings), **Operations** (bookings, services,
  vehicles, reviews, promotions), **Finance** (transactions, settlements,
  vouchers)
- `database/seeders` — sample data mirroring the prototype (`docs/WashRewards
  SA.dc.html`): the four car washes, their packages, demo bookings, reviews,
  and a loyalty voucher

## What's next

This is Phase 1 (foundation) of the delivery plan in
`docs/WashRewards-SA-Technical-Specification.md`: Laravel skeleton, Sanctum
auth, multi-tenancy foundation, and the core schema. Later phases build out
the full mobile API, payment gateway integration (collect-and-settle with
scheduled per-tenant payouts), and the Terraform/ECS deployment pipeline.
