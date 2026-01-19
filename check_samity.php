<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Manually boot Eloquent
$app->make('Illuminate\Database\Eloquent\Model')->setConnectionResolver($app['db']);

use App\Models\SamityProfile;

try {
    $count = SamityProfile::count();
    echo "SamityProfile Count: " . $count . "\n";
    if ($count > 0) {
        echo "First Samity: " . json_encode(SamityProfile::first()) . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
