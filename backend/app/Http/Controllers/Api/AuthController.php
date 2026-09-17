<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Auth\OtpService;
use App\Services\Auth\SocialAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly SocialAuthService $social,
    ) {}

    /**
     * Google/Apple/Facebook sign-in. The mobile app runs the provider's
     * native flow itself and hands us the resulting id_token (Google/Apple)
     * or access_token (Facebook) — this never sees the user's provider
     * password, only a token we independently verify. `name` is optional
     * and only used as a fallback for Apple, whose token never carries one.
     */
    public function socialLogin(Request $request, string $provider)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        if (! in_array($provider, ['google', 'apple', 'facebook'], true)) {
            return response()->json(['message' => 'Unknown sign-in provider.'], 404);
        }

        $result = $this->social->verify($provider, $validated['token']);

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $user = $this->social->findOrCreateUser($result['email'], $result['name'] ?? $validated['name'] ?? null);

        return response()->json([
            'user' => new UserResource($user->load('tenants')),
            'token' => $user->createToken('mobile')->plainTextToken,
        ]);
    }

    /**
     * Primary mobile-app login: send a 4-digit SMS code to the given phone
     * number. Works for both new and returning customers — verifyOtp() below
     * finds-or-creates the User, so there's no separate "sign up" step.
     */
    public function requestOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
        ]);

        $code = $this->otp->request($validated['phone']);

        return response()->json([
            'message' => 'A verification code has been sent.',
            // Only ever present while the Sandbox driver is active (Settings
            // → OTP delivery) — nothing was actually texted in that mode, so
            // there's nothing sensitive to leak, and it lets the app skip a
            // real phone/CloudWatch round-trip while testing. Real SNS sends
            // never include this.
            'debug_code' => PlatformSetting::effectiveSmsDriver() === 'sandbox' ? $code : null,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:32'],
            'code' => ['required', 'string'],
        ]);

        $result = $this->otp->verify($validated['phone'], $validated['code']);

        if (! $result['ok']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $user = $this->otp->findOrCreateUser($validated['phone']);

        return response()->json([
            'user' => new UserResource($user->load('tenants')),
            'token' => $user->createToken('mobile')->plainTextToken,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'user' => new UserResource($user->load('tenants')),
            'token' => $user->createToken('mobile')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($validated)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        return response()->json([
            'user' => new UserResource($user->load('tenants')),
            'token' => $user->createToken('mobile')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json(new UserResource($request->user()->load('tenants')));
    }
}
