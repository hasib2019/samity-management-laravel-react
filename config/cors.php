<?php

return [

    /*
     * Paths the CORS service responds to. The member portal calls /api/*.
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /*
     * Origins allowed to call the API. The member portal runs on a different
     * origin (main domain) than the API (subdomain), so list it here. Override
     * in production via FRONTEND_URL / PORTAL_URL in .env.
     *
     * Token auth does not use cookies, so a wildcard is acceptable; tighten to
     * your real domains in production.
     */
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'),
        env('PORTAL_URL'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * The portal uses bearer tokens (Authorization header), not cookies, so
     * credentialed requests are not required.
     */
    'supports_credentials' => false,

];
