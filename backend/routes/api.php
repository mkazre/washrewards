<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Partner\BookingController as PartnerBookingController;
use App\Http\Controllers\Api\Partner\DashboardController as PartnerDashboardController;
use App\Http\Controllers\Api\Partner\PromotionController as PartnerPromotionController;
use App\Http\Controllers\Api\Partner\ServiceController as PartnerServiceController;
use App\Http\Controllers\Api\Partner\VoucherController as PartnerVoucherController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Platform\DashboardController as PlatformDashboardController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\Webhooks\OzowWebhookController;
use App\Http\Controllers\Api\Webhooks\PayFastWebhookController;
use App\Http\Controllers\Api\Webhooks\PaystackWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Primary mobile-app login. Combines sign-up + sign-in — verifyOtp() finds
// or creates the customer by phone, so there's no separate registration step.
Route::post('/auth/otp/request', [AuthController::class, 'requestOtp'])->middleware('throttle:5,1');
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');

// Consumer discovery — browsable without an account, matching the app's
// "list view + map view" nearby-washes screen.
Route::get('/tenants', [TenantController::class, 'index']);
Route::get('/tenants/{tenant}', [TenantController::class, 'show']);

// Payment gateway callbacks — unauthenticated (the gateway calls these, not
// the app) but each verifies its own signature/hash before trusting the body.
Route::post('/webhooks/payfast', PayFastWebhookController::class);
Route::post('/webhooks/paystack', PaystackWebhookController::class);
Route::post('/webhooks/ozow', OzowWebhookController::class);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::apiResource('vehicles', VehicleController::class);

    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/pay', [PaymentController::class, 'pay']);
    Route::post('/bookings/{booking}/review', [ReviewController::class, 'store']);

    Route::get('/loyalty/summary', [LoyaltyController::class, 'summary']);

    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::post('/vouchers/{voucher}/redeem', [VoucherController::class, 'redeem']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Partner side of the app — same account, role-based via tenant_user
    // membership. `partner` middleware requires ResolveTenant to have found one.
    Route::middleware('partner')->prefix('partner')->group(function () {
        Route::get('/dashboard', [PartnerDashboardController::class, 'index']);

        Route::get('/bookings', [PartnerBookingController::class, 'index']);
        Route::get('/bookings/{booking}', [PartnerBookingController::class, 'show']);
        Route::post('/bookings/{booking}/advance', [PartnerBookingController::class, 'advance']);

        Route::apiResource('services', PartnerServiceController::class);
        Route::apiResource('promotions', PartnerPromotionController::class);

        Route::post('/vouchers/redeem', [PartnerVoucherController::class, 'redeem']);
    });

    // Platform-owner console — the mobile app's "Platform" tab. Gated on
    // is_admin, the same flag that gates the Filament admin panel.
    Route::middleware('platform.owner')->prefix('platform')->group(function () {
        Route::get('/dashboard', [PlatformDashboardController::class, 'index']);
    });
});
