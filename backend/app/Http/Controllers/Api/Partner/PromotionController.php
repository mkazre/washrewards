<?php

namespace App\Http\Controllers\Api\Partner;

use App\Http\Controllers\Api\Partner\Concerns\AuthorizesTenantOwnership;
use App\Http\Controllers\Controller;
use App\Http\Resources\PromotionResource;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    use AuthorizesTenantOwnership;

    public function index()
    {
        return PromotionResource::collection(Promotion::orderByDesc('starts_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['required', 'in:percent,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'code' => ['nullable', 'string', 'max:50', 'unique:promotions,code'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
        ]);

        return new PromotionResource(Promotion::create($validated + ['is_active' => true]));
    }

    public function show(Promotion $promotion)
    {
        $this->assertOwnedByCurrentTenant($promotion);

        return new PromotionResource($promotion);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $this->assertOwnedByCurrentTenant($promotion);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['sometimes', 'required', 'in:percent,fixed'],
            'discount_value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'code' => ['nullable', 'string', 'max:50', 'unique:promotions,code,'.$promotion->id],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'required', 'date', 'after:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $promotion->update($validated);

        return new PromotionResource($promotion);
    }

    public function destroy(Promotion $promotion)
    {
        $this->assertOwnedByCurrentTenant($promotion);

        $promotion->delete();

        return response()->json(status: 204);
    }
}
