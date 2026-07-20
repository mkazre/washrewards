<?php

namespace App\Http\Controllers\Api\Partner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;

class DashboardController extends Controller
{
    /**
     * Business dashboard stats — revenue, bookings, customers, ratings, per
     * the partner dashboard screen in the prototype. `tenant` middleware has
     * already scoped every tenant-owned model to the current business.
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenants()->first();
        $startOfMonth = Date::now()->startOfMonth();

        $revenueThisMonth = Transaction::where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('partner_earnings');

        $todayBookings = Booking::whereDate('scheduled_at', Date::today());

        return response()->json([
            'revenue_this_month' => (float) $revenueThisMonth,
            'today_bookings_count' => (clone $todayBookings)->count(),
            'today_bookings_upcoming' => (clone $todayBookings)->whereIn('status', ['pending', 'confirmed'])->count(),
            'customers_this_month' => Booking::where('created_at', '>=', $startOfMonth)->distinct('user_id')->count('user_id'),
            'rating_avg' => (float) $tenant->rating_avg,
            'rating_count' => $tenant->rating_count,
        ]);
    }
}
