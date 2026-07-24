<?php

namespace App\Http\Controllers\Api\Partner;

use App\Http\Controllers\Api\Partner\Concerns\AuthorizesTenantOwnership;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    use AuthorizesTenantOwnership;

    public function index()
    {
        return ServiceResource::collection(Service::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'is_popular' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        return new ServiceResource(Service::create($validated));
    }

    public function show(Service $service)
    {
        $this->assertOwnedByCurrentTenant($service);

        return new ServiceResource($service);
    }

    public function update(Request $request, Service $service)
    {
        $this->assertOwnedByCurrentTenant($service);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:1'],
            'is_popular' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $service->update($validated);

        return new ServiceResource($service);
    }

    public function destroy(Service $service)
    {
        $this->assertOwnedByCurrentTenant($service);

        $service->delete();

        return response()->json(status: 204);
    }
}
