<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;

class DashboardController extends Controller
{
    /**
     * Network-wide commission/revenue console — the mobile app's "Platform
     * (Owner)" screen. Unlike Partner\DashboardController, this deliberately
     * queries across every tenant via anyTenant(), since TenantScope would
     * otherwise silently narrow these aggregates to whichever tenant (if
     * any) ResolveTenant attached to this request.
     */
    public function index(Request $request)
    {
        $startOfMonth = Date::now()->startOfMonth();

        $transactionsThisMonth = Transaction::anyTenant()
            ->where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth);

        $commissionThisMonth = (clone $transactionsThisMonth)->sum('platform_commission');
        $grossThisMonth = (clone $transactionsThisMonth)->sum('gross_amount');
        $bookingsThisMonth = (clone $transactionsThisMonth)->count();

        $activePartners = Tenant::query()->where('status', 'active')->count();

        return response()->json([
            'commission_this_month' => (float) $commissionThisMonth,
            'gross_bookings_this_month' => (float) $grossThisMonth,
            'bookings_per_month' => $bookingsThisMonth,
            'active_partners' => $activePartners,
            'avg_commission_per_partner' => $activePartners > 0
                ? round(((float) $commissionThisMonth) / $activePartners, 2)
                : 0.0,
            'default_commission_rate' => (float) PlatformSetting::current()->default_commission_rate,
        ]);
    }
}
