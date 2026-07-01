<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(protected SettingsService $settings)
    {
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('messages.auth.invalid_credentials')],
            ]);
        }

        if (!$user->status) {
            return response()->json(['message' => __('messages.auth.account_disabled')], 403);
        }

        // Cookie/session based SPA auth (token is never exposed to JavaScript).
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $this->withResolvedLanguage($user->load('roles.permissions')),
            'menus' => $user->getAuthorizedMenus(),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => $this->withResolvedLanguage($user->load('roles.permissions')),
            'menus' => $user->getAuthorizedMenus(),
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke a bearer token if one was used; otherwise tear down the SPA session.
        $token = $request->user()?->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => __('messages.auth.logged_out')]);
    }

    public function updateLanguage(Request $request)
    {
        $request->validate([
            'language' => 'required|in:en,bn',
        ]);

        $request->user()->update(['language' => $request->language]);

        return response()->json(['language' => $request->language]);
    }

    /**
     * Attach the effective language (user preference, falling back to the
     * system default) to the user payload so the frontend can sync i18next
     * to it right after login/me without a second request.
     */
    protected function withResolvedLanguage(User $user): User
    {
        $user->setAttribute('language', $user->language ?? $this->settings->get('locale', 'bn'));

        return $user;
    }
}
