<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->status) {
            return response()->json(['message' => 'Your account is disabled.'], 403);
        }

        // Cookie/session based SPA auth (token is never exposed to JavaScript).
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $user->load('roles.permissions'),
            'menus' => $user->getAuthorizedMenus(),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => $user->load('roles.permissions'),
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

        return response()->json(['message' => 'Logged out successfully']);
    }
}
