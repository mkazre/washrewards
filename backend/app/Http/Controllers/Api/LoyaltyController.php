<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VoucherResource;
use App\Services\Loyalty\LoyaltyService;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(private readonly LoyaltyService $loyalty) {}

    /**
     * Tier/level progress + voucher wallet, in the shape the redesigned
     * mobile app's Rewards screen renders directly (levelName/levelNum/
     * monthWashes/nextThreshold/levelPct/levelRows/wallet).
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $progress = $this->loyalty->currentTier($user);

        $wallet = $user->vouchers()
            ->where('status', 'active')
            ->orderByDesc('earned_at')
            ->get();

        return response()->json([
            'tier' => [
                'level' => $progress['tier']?->level,
                'name' => $progress['tier']?->name,
                'reward_description' => $progress['tier']?->reward_description,
            ],
            'month_washes' => $progress['month_washes'],
            'next_threshold' => $progress['next_threshold'],
            'level_pct' => $progress['level_pct'],
            'level_rows' => $progress['tiers']->map(fn ($tier) => [
                'level' => $tier->level,
                'name' => $tier->name,
                'reward_description' => $tier->reward_description,
                'achieved' => $progress['month_washes'] >= $tier->washes_required,
                'current' => $progress['tier']?->id === $tier->id,
            ]),
            'wallet' => VoucherResource::collection($wallet),
            'wallet_total' => (float) $wallet->sum('amount'),
        ]);
    }
}
