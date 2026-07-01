<?php

/*
|--------------------------------------------------------------------------
| Application Language Lines
|--------------------------------------------------------------------------
|
| Custom app-specific strings (auth flows, generic API error shapes), kept
| separate from Laravel's own validation.php / auth.php. Converted module
| by module — see the multi-language rollout plan.
|
*/

return [

    'auth' => [
        'invalid_credentials' => 'The provided credentials are incorrect.',
        'account_disabled' => 'Your account is disabled.',
        'logged_out' => 'Logged out successfully.',
    ],

    'http' => [
        'validation_failed' => 'The given data was invalid.',
        'unauthenticated' => 'Unauthenticated.',
        'unauthorized' => 'This action is unauthorized.',
        'not_found' => 'Resource not found.',
        'server_error' => 'Server error. Please try again later.',
    ],

];
