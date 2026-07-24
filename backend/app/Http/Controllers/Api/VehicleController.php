<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        return VehicleResource::collection(
            $request->user()->vehicles()->orderByDesc('is_default')->orderByDesc('created_at')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'make' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:255'],
            'plate' => ['required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            $request->user()->vehicles()->update(['is_default' => false]);
        }

        $vehicle = $request->user()->vehicles()->create($validated);

        return new VehicleResource($vehicle);
    }

    public function show(Request $request, int $vehicle)
    {
        return new VehicleResource($request->user()->vehicles()->findOrFail($vehicle));
    }

    public function update(Request $request, int $vehicle)
    {
        $vehicle = $request->user()->vehicles()->findOrFail($vehicle);

        $validated = $request->validate([
            'make' => ['sometimes', 'required', 'string', 'max:255'],
            'model' => ['sometimes', 'required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:255'],
            'plate' => ['sometimes', 'required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            $request->user()->vehicles()->where('id', '!=', $vehicle->id)->update(['is_default' => false]);
        }

        $vehicle->update($validated);

        return new VehicleResource($vehicle);
    }

    public function destroy(Request $request, int $vehicle)
    {
        $vehicle = $request->user()->vehicles()->findOrFail($vehicle);

        if ($vehicle->bookings()->exists()) {
            return response()->json([
                'message' => 'This vehicle has booking history and can’t be removed.',
            ], 422);
        }

        $vehicle->delete();

        return response()->json(status: 204);
    }
}
