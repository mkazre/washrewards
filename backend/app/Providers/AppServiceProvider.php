<?php

namespace App\Providers;

use App\Payments\Contracts\PaymentGateway;
use App\Payments\Drivers\SandboxGateway;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);

        $this->app->bind(PaymentGateway::class, function ($app) {
            $driver = config('payments.default', 'sandbox');
            $class = config("payments.drivers.{$driver}", SandboxGateway::class);

            return $app->make($class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
