<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject (and revoke) requests from disabled accounts even if their token
     * is otherwise still valid. Login already blocks disabled users, but a
     * token issued before deactivation must stop working immediately.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->status) {
            // Revoke a real bearer token if present (session auth uses a TransientToken
            // that has no delete()), so a disabled account cannot keep using its token.
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            }

            return response()->json(['message' => 'Your account has been disabled.'], 403);
        }

        return $next($request);
    }
}
