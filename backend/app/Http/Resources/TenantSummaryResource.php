<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Lightweight tenant shape for list/map discovery views. See TenantResource
 * for the full detail payload (services, reviews, opening hours).
 */
class TenantSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'suburb' => $this->suburb,
            'city' => $this->city,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => $this->rating_count,
            'from_price' => $this->from_price !== null ? (float) $this->from_price : null,
            'logo_url' => $this->logo_path ? Storage::url($this->logo_path) : null,
            'distance_km' => $this->distance_km !== null ? round((float) $this->distance_km, 1) : null,
            'latitude' => $this->when($this->isFixedGarage(), fn () => $this->latitude ? (float) $this->latitude : null),
            'longitude' => $this->when($this->isFixedGarage(), fn () => $this->longitude ? (float) $this->longitude : null),
            'travel_radius_km' => $this->when($this->isMobileWash(), fn () => $this->travel_radius_km ? (float) $this->travel_radius_km : null),
            'travel_fee' => $this->when($this->isMobileWash(), fn () => $this->travel_fee ? (float) $this->travel_fee : null),
        ];
    }
}
