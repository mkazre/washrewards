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
- `app/Http/Controllers/Api` — the mobile API (consumer + partner, role-based)
- `app/Filament/Resources` — one admin resource per model above, grouped into
  **Platform** (tenants, users, settings), **Operations** (bookings, services,
  vehicles, reviews, promotions), **Finance** (transactions, settlements,
  vouchers)
- `database/seeders` — sample data mirroring the prototype (`docs/WashRewards
  SA.dc.html`): the four car washes, their packages, demo bookings, reviews,
  and a loyalty voucher

## Payments & settlement

The platform is **collect-and-settle**: the customer pays in-app, the
platform holds funds, and each tenant is paid out on a schedule.

- `App\Payments\Contracts\PaymentGateway` — interface business logic depends
  on. **No real SA gateway is wired in yet** (PayFast / Peach Payments /
  Paystack / Yoco / Ozow — still an open decision per the tech spec). Until
  one is chosen and its API keys are available,
  `App\Payments\Drivers\SandboxGateway` stands in and always succeeds
  synchronously with a `SANDBOX-` reference — set `PAYMENT_GATEWAY` in `.env`
  to switch drivers once a real one is added.
- `POST /api/bookings/{booking}/pay` — charges via the configured gateway,
  then atomically: marks the booking paid, writes a `Transaction` ledger
  entry (via `App\Services\Payments\CommissionSplitCalculator` — commission
  is charged on the service price only, never the mobile-wash travel fee),
  and checks `App\Services\Loyalty\LoyaltyService` for a newly-earned R100
  voucher.
- `php artisan settlements:generate [--date=Y-m-d]` — batches each tenant's
  completed, unsettled transactions for a day into a `Settlement`. Scheduled
  daily at 01:00 (`routes/console.php`). Mark a settlement paid from the
  admin panel (Finance → Settlements → "Mark as paid").
- `php artisan vouchers:expire` — flips active vouchers past `expires_at` to
  `expired`. Scheduled daily at 01:15.

## What's next

Phases 1–3 of the delivery plan in
`docs/WashRewards-SA-Technical-Specification.md` are done: Laravel skeleton,
Sanctum auth, multi-tenancy, core schema, the full mobile API, and payments/
settlement (behind the sandbox gateway above). What's left: swap in the real
payment gateway once chosen, and the Terraform/ECS deployment pipeline.
