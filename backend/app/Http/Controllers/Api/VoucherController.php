<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VoucherResource;
use App\Models\PlatformSetting;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VoucherController extends Controller
{
    /**
     * Wallet + loyalty progress. Automatic voucher issuance after N paid
     * washes is the Phase 4 loyalty engine — for now this reports current
     * progress within the cycle from existing paid bookings.
     */
    public function index(Request $request)
    {
        $settings = PlatformSetting::current();
        $threshold = $settings->voucher_wash_threshold;

        $totalPaidWashes = $request->user()->bookings()
            ->where('payment_status', 'paid')
            ->where('counts_toward_voucher', true)
            ->count();

        $washCount = $totalPaidWashes % $threshold;

        return response()->json([
            'data' => VoucherResource::collection(
                $request->user()->vouchers()->orderByDesc('earned_at')->get()
            ),
            'progress' => [
                'wash_count' => $washCount,
                'threshold' => $threshold,
                'remaining' => $threshold - $washCount,
                'voucher_amount' => (float) $settings->voucher_amount,
            ],
        ]);
    }

    public function redeem(Request $request, Voucher $voucher)
    {
        abort_unless($voucher->user_id === $request->user()->id, 403);

        if ($voucher->status !== 'active') {
            return response()->json(['message' => 'This voucher is not available to redeem.'], 422);
        }

        $validated = $request->validate([
            'booking_id' => ['nullable', Rule::exists('bookings', 'id')->where('user_id', $request->user()->id)],
        ]);

        $voucher->update([
            'status' => 'redeemed',
            'redeemed_at' => now(),
            'redeemed_booking_id' => $validated['booking_id'] ?? null,
        ]);

        return new VoucherResource($voucher);
    }
}
