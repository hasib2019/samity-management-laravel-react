<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Enable Sanctum SPA (cookie/session) auth for same-origin frontend requests.
        $middleware->statefulApi();

        // Resolve request locale (user preference / Accept-Language / system default)
        // before controllers run, so __()/validation messages come back translated.
        $middleware->api(append: [
            \App\Http\Middleware\SetLocale::class,
        ]);

        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'active' => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Uniform JSON responses for API/JSON requests; never leak internals in production.
        $exceptions->render(function (\Throwable $e, $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null; // default rendering for web routes
            }

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'message' => __('messages.http.validation_failed'),
                    'errors' => $e->errors(),
                ], 422);
            }

            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json(['message' => __('messages.http.unauthenticated')], 401);
            }

            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return response()->json(['message' => __('messages.http.unauthorized')], 403);
            }

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return response()->json(['message' => __('messages.http.not_found')], 404);
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                return response()->json(['message' => $e->getMessage() ?: 'HTTP error.'], $e->getStatusCode());
            }

            // Genuine server faults: show details only when debugging locally, otherwise stay generic.
            if (config('app.debug')) {
                return null;
            }

            \Illuminate\Support\Facades\Log::error('Unhandled API exception', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json(['message' => __('messages.http.server_error')], 500);
        });
    })->create();
