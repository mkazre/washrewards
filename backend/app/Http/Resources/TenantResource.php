<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'description' => $this->description,
            'phone' => $this->phone,
            'email' => $this->email,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => $this->rating_count,
            'logo_url' => $this->logo_path ? Storage::url($this->logo_path) : null,
            'cover_photo_url' => $this->cover_photo_path ? Storage::url($this->cover_photo_path) : null,
            'address' => $this->when($this->isFixedGarage(), $this->address),
            'suburb' => $this->suburb,
            'city' => $this->city,
            'latitude' => $this->when($this->isFixedGarage(), fn () => $this->latitude ? (float) $this->latitude : null),
            'longitude' => $this->when($this->isFixedGarage(), fn () => $this->longitude ? (float) $this->longitude : null),
            'service_areas' => $this->when($this->isMobileWash(), $this->service_areas),
            'travel_radius_km' => $this->when($this->isMobileWash(), fn () => $this->travel_radius_km ? (float) $this->travel_radius_km : null),
            'travel_fee' => $this->when($this->isMobileWash(), fn () => $this->travel_fee ? (float) $this->travel_fee : null),
            'opening_hours' => $this->opening_hours,
            'distance_km' => $this->distance_km !== null ? round((float) $this->distance_km, 1) : null,
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}
