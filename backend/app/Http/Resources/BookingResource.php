<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_no' => 'WR-'.str_pad($this->id, 5, '0', STR_PAD_LEFT),
            'tenant' => new TenantSummaryResource($this->whenLoaded('tenant')),
            'service' => new ServiceResource($this->whenLoaded('service')),
            'vehicle' => new VehicleResource($this->whenLoaded('vehicle')),
            'status' => $this->status,
            'scheduled_at' => $this->scheduled_at,
            'service_address' => $this->service_address,
            'service_latitude' => $this->service_latitude ? (float) $this->service_latitude : null,
            'service_longitude' => $this->service_longitude ? (float) $this->service_longitude : null,
            'price' => (float) $this->price,
            'travel_fee' => (float) $this->travel_fee,
            'total_amount' => (float) $this->total_amount,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'counts_toward_voucher' => $this->counts_toward_voucher,
            'has_review' => $this->relationLoaded('review') ? $this->review !== null : null,
            'checked_in_at' => $this->checked_in_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'created_at' => $this->created_at,
        ];
    }
}
