<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Booking;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Only customers who completed a paid wash can review it — matches the
     * "Verified" badge shown throughout the prototype.
     */
    public function store(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        if ($booking->status !== 'completed' || $booking->payment_status !== 'paid') {
            return response()->json([
                'message' => 'Only completed, paid bookings can be reviewed.',
            ], 422);
        }

        if ($booking->review()->exists()) {
            return response()->json([
                'message' => 'This booking has already been reviewed.',
            ], 422);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'cleanliness_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'staff_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'value_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'wait_time_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $review = $booking->review()->create([
            'tenant_id' => $booking->tenant_id,
            'user_id' => $request->user()->id,
            'is_verified' => true,
            ...$validated,
        ]);

        // rating_avg/rating_count are intentionally excluded from Tenant::$fillable
        // (not admin/partner mass-assignable) — forceFill() is correct here since
        // this is trusted, internally-computed aggregation logic.
        $tenant = $booking->tenant;
        $newCount = $tenant->rating_count + 1;
        $newAvg = round((($tenant->rating_avg * $tenant->rating_count) + $validated['rating']) / $newCount, 2);

        $tenant->forceFill(['rating_count' => $newCount, 'rating_avg' => $newAvg])->save();

        return new ReviewResource($review->load('user'));
    }
}
