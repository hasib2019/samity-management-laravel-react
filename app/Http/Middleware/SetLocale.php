<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    protected const SUPPORTED = ['en', 'bn'];

    /**
     * Resolution order: the authenticated user's saved preference, then the
     * Accept-Language header the frontend sends (driven by its i18next state),
     * then the system-wide default in General Settings.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $settings = app(SettingsService::class);

        $locale = $request->user()?->language
            ?? $this->fromAcceptLanguageHeader($request)
            ?? $settings->get('locale', 'bn');

        if (! in_array($locale, self::SUPPORTED, true)) {
            $locale = 'bn';
        }

        App::setLocale($locale);

        return $next($request);
    }

    protected function fromAcceptLanguageHeader(Request $request): ?string
    {
        $header = strtolower((string) $request->header('Accept-Language'));
        $lang = trim(explode(',', $header)[0] ?? '');

        return in_array($lang, self::SUPPORTED, true) ? $lang : null;
    }
}
