<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $permissions = array_values(array_filter(explode('|', $permission)));

        if (
            !$request->user()
            || !$request->user()->hasAnyPermission($permissions)
        ) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
