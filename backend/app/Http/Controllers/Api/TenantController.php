<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Http\Resources\TenantSummaryResource;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    /**
     * Consumer discovery — list + map. Fixed-garage tenants get a computed
     * distance (Haversine, km) and can be sorted/filtered by it; mobile-wash
     * tenants have no fixed pin so are matched by `area` against their
     * service_areas instead, per the spec's discovery rules for each type.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'in:fixed_garage,mobile_wash'],
            'search' => ['sometimes', 'string', 'max:255'],
            'lat' => ['sometimes', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'numeric', 'between:-180,180'],
            'radius_km' => ['sometimes', 'numeric', 'min:0'],
            'area' => ['sometimes', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Tenant::query()
            ->where('status', 'active')
            ->withMin(['services as from_price' => fn ($q) => $q->where('is_active', true)], 'price');

        if ($type = $validated['type'] ?? null) {
            $query->where('type', $type);
        }

        if ($search = $validated['search'] ?? null) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($area = $validated['area'] ?? null) {
            $query->where(function ($q) use ($area) {
                $q->where('type', 'fixed_garage')
                    ->orWhere(function ($q2) use ($area) {
                        $q2->where('type', 'mobile_wash')->whereJsonContains('service_areas', $area);
                    });
            });
        }

        if (isset($validated['lat'], $validated['lng'])) {
            $lat = $validated['lat'];
            $lng = $validated['lng'];
            $haversine = '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))';
            $query->selectRaw("tenants.*, CASE WHEN latitude IS NOT NULL THEN {$haversine} ELSE NULL END as distance_km", [$lat, $lng, $lat]);

            if ($radius = $validated['radius_km'] ?? null) {
                $query->havingRaw('distance_km IS NULL OR distance_km <= ?', [$radius]);
            }

            $query->orderByRaw('distance_km IS NULL, distance_km ASC');
        } else {
            $query->orderByDesc('rating_avg');
        }

        $tenants = $query->paginate($validated['per_page'] ?? 20);

        return TenantSummaryResource::collection($tenants);
    }

    public function show(Request $request, Tenant $tenant)
    {
        abort_unless($tenant->status === 'active', 404);

        $tenant->load([
            'services' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'reviews' => fn ($q) => $q->with('user:id,name')->latest()->limit(20),
        ]);

        if ($request->filled('lat') && $request->filled('lng') && $tenant->latitude && $tenant->longitude) {
            $tenant->distance_km = $this->haversineKm(
                (float) $request->query('lat'),
                (float) $request->query('lng'),
                (float) $tenant->latitude,
                (float) $tenant->longitude,
            );
        }

        return new TenantResource($tenant);
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371;

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lngDelta / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
