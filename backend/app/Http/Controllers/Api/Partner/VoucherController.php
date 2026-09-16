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
     * A partner scans a customer's wallet-voucher QR (its qr_token) — or,
     * without a camera, types in the short human-readable code shown under
     * the QR — to redeem it in person. Mirrors Api\VoucherController::redeem(),
     * but keyed by the scanned/typed value rather than route-bound customer
     * ownership, since here it's the *partner* redeeming, not the voucher's
     * owner.
     */
    public function redeem(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => ['required_without:code', 'nullable', 'string'],
            'code' => ['required_without:qr_token', 'nullable', 'string'],
            'booking_id' => ['nullable', Rule::exists('bookings', 'id')],
        ]);

        $voucher = Voucher::query()
            ->where(function ($query) use ($validated) {
                if (! empty($validated['qr_token'])) {
                    $query->orWhere('qr_token', $validated['qr_token']);
                }
                if (! empty($validated['code'])) {
                    $query->orWhere('code', $validated['code']);
                }
            })
            ->first();

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
