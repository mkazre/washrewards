<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    /**
     * Registers (or re-claims, if a previous user shared this device) an
     * Expo push token for the current user. Called on every app launch once
     * signed in — cheap and idempotent, so no need to track whether it
     * changed since the last call. expo_push_token is globally unique, so a
     * token previously owned by a different account (shared/reset device)
     * is reassigned rather than left to violate that constraint.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string'],
            'platform' => ['nullable', 'string', 'in:ios,android'],
        ]);

        DeviceToken::where('expo_push_token', $validated['expo_push_token'])
            ->where('user_id', '!=', $request->user()->id)
            ->delete();

        $request->user()->deviceTokens()->updateOrCreate(
            ['expo_push_token' => $validated['expo_push_token']],
            ['platform' => $validated['platform'] ?? null, 'last_used_at' => now()]
        );

        return response()->json(['message' => 'Registered.']);
    }

    /**
     * Called on logout so a shared/reset device stops receiving this user's
     * pushes for whoever signs in next.
     */
    public function unregister(Request $request)
    {
        $validated = $request->validate([
            'expo_push_token' => ['required', 'string'],
        ]);

        $request->user()->deviceTokens()
            ->where('expo_push_token', $validated['expo_push_token'])
            ->delete();

        return response()->json(['message' => 'Unregistered.']);
    }
}
