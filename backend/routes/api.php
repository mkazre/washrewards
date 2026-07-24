<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Partner\BookingController as PartnerBookingController;
use App\Http\Controllers\Api\Partner\DashboardController as PartnerDashboardController;
use App\Http\Controllers\Api\Partner\PromotionController as PartnerPromotionController;
use App\Http\Controllers\Api\Partner\ServiceController as PartnerServiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Consumer discovery — browsable without an account, matching the app's
// "list view + map view" nearby-washes screen.
Route::get('/tenants', [TenantController::class, 'index']);
Route::get('/tenants/{tenant}', [TenantController::class, 'show']);

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
    });
});
