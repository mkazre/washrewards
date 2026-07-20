<?php

namespace App\Http\Controllers\Api\Partner;

use App\Http\Controllers\Api\Partner\Concerns\AuthorizesTenantOwnership;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    use AuthorizesTenantOwnership;

    public function index(Request $request)
    {
        $query = Booking::with(['user', 'service', 'vehicle'])->orderBy('scheduled_at');

        if ($request->boolean('today')) {
            $query->whereDate('scheduled_at', now());
        }

        $bookings = $query->paginate($request->integer('per_page', 20));

        return BookingResource::collection($bookings);
    }

    public function show(Booking $booking)
    {
        $this->assertOwnedByCurrentTenant($booking);

        return new BookingResource($booking->load(['user', 'service', 'vehicle', 'review']));
    }

    /**
     * Advances a booking through the partner check-in workflow shown in the
     * prototype: Upcoming → "Check in" → Arrived → "Mark done" → Completed.
     */
    public function advance(Booking $booking)
    {
        $this->assertOwnedByCurrentTenant($booking);

        $next = match ($booking->status) {
            'pending', 'confirmed' => 'checked_in',
            'checked_in' => 'completed',
            default => null,
        };

        abort_if($next === null, 422, 'This booking cannot be advanced any further.');

        $booking->update([
            'status' => $next,
            'checked_in_at' => $next === 'checked_in' ? now() : $booking->checked_in_at,
            'completed_at' => $next === 'completed' ? now() : null,
        ]);

        return new BookingResource($booking->fresh(['user', 'service', 'vehicle']));
    }
}
