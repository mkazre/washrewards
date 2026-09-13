<?php

namespace App\Http\Controllers\Api\Partner;

use App\Http\Controllers\Controller;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VoucherController extends Controller
{
    /**
     * A partner scans a customer's wallet-voucher QR (its qr_token) to
     * redeem it in person — mirrors Api\VoucherController::redeem(), but
     * keyed by the scanned token rather than route-bound customer ownership,
     * since here it's the *partner* redeeming, not the voucher's owner.
     */
    public function redeem(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => ['required', 'string'],
            'booking_id' => ['nullable', Rule::exists('bookings', 'id')],
        ]);

        $voucher = Voucher::query()->where('qr_token', $validated['qr_token'])->first();

        if (! $voucher) {
            return response()->json(['message' => 'This voucher code was not recognised.'], 404);
        }

        if ($voucher->status !== 'active') {
            return response()->json(['message' => 'This voucher is not available to redeem.'], 422);
        }

        if ($voucher->expires_at && $voucher->expires_at->isPast()) {
            return response()->json(['message' => 'This voucher has expired.'], 422);
        }

        $voucher->update([
            'status' => 'redeemed',
            'redeemed_at' => now(),
            'redeemed_booking_id' => $validated['booking_id'] ?? null,
        ]);

        return new VoucherResource($voucher);
    }
}
