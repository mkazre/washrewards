<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;

class ConfigController extends Controller
{
    /**
     * Public, unauthenticated feature flags the app needs before a user is
     * signed in — which social login buttons to show, and map credentials.
     * Safe to cache client-side for the app session.
     */
    public function index()
    {
        return response()->json(PlatformSetting::current()->publicConfig());
    }
}
