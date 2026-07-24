<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = $request->user()->bookings()
            ->with(['tenant', 'service', 'vehicle', 'review'])
            ->orderByDesc('scheduled_at')
            ->paginate($request->integer('per_page', 20));

        return BookingResource::collection($bookings);
    }

    /**
     * Create a booking. Payment capture is a Phase 3 concern (gateway
     * integration) — this creates the booking as `pending`/unpaid; a
     * follow-up payment-confirmation endpoint will transition it to
     * `confirmed`/`paid` once the gateway is wired in.
     */
    public function store(StoreBookingRequest $request)
    {
        $validated = $request->validated();

        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $service = Service::findOrFail($validated['service_id']);
        $travelFee = $tenant->isMobileWash() ? (float) $tenant->travel_fee : 0;

        $booking = $request->user()->bookings()->create([
            'tenant_id' => $tenant->id,
            'vehicle_id' => $validated['vehicle_id'],
            'service_id' => $service->id,
            'status' => 'pending',
            'scheduled_at' => $validated['scheduled_at'],
            'service_address' => $validated['service_address'] ?? null,
            'service_latitude' => $validated['service_latitude'] ?? null,
            'service_longitude' => $validated['service_longitude'] ?? null,
            'price' => $service->price,
            'travel_fee' => $travelFee,
            'total_amount' => $service->price + $travelFee,
            'payment_status' => 'pending',
            'payment_method' => $validated['payment_method'],
        ]);

        return new BookingResource($booking->load(['tenant', 'service', 'vehicle']));
    }

    public function show(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        return new BookingResource($booking->load(['tenant', 'service', 'vehicle', 'review']));
    }

    public function cancel(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        if (! in_array($booking->status, ['pending', 'confirmed'], true)) {
            return response()->json([
                'message' => 'This booking can no longer be cancelled.',
            ], 422);
        }

        $booking->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return new BookingResource($booking->load(['tenant', 'service', 'vehicle']));
    }
}
