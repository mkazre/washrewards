<?php

namespace App\Providers;

use App\Models\PlatformSetting;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\Drivers\SandboxGateway;
use App\Sms\Contracts\SmsSender;
use App\Sms\Drivers\SandboxSmsSender;
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
            $driver = PlatformSetting::effectivePaymentGateway();
            $class = config("payments.drivers.{$driver}", SandboxGateway::class);

            return $app->make($class);
        });

        $this->app->bind(SmsSender::class, function ($app) {
            $driver = PlatformSetting::effectiveSmsDriver();
            $class = config("sms.drivers.{$driver}", SandboxSmsSender::class);

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
