<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;

/**
 * Pushes the SMTP credentials stored in the General Settings into the runtime
 * mail config, so emails are sent using whatever the admin configured in the UI
 * instead of the static .env values. Call apply() right before sending mail.
 */
class MailConfigService
{
    public function __construct(private SettingsService $settings)
    {
    }

    /**
     * Apply the DB mail settings to the runtime config.
     *
     * @return bool true when SMTP is configured (a host is present), false otherwise.
     */
    public function apply(): bool
    {
        $host = $this->settings->get('mail_host');

        if (! $host) {
            return false; // Not configured — leave the default (e.g. log) mailer in place.
        }

        $mailer = $this->settings->get('mail_mailer', 'smtp') ?: 'smtp';
        $encryption = strtolower((string) $this->settings->get('mail_encryption', 'tls'));

        // Laravel 12 / Symfony mailer uses a transport "scheme": implicit TLS
        // (port 465) is "smtps"; STARTTLS (port 587) uses the default "smtp".
        $scheme = $encryption === 'ssl' ? 'smtps' : null;

        Config::set('mail.default', $mailer);
        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', (int) ($this->settings->get('mail_port') ?: 587));
        Config::set('mail.mailers.smtp.username', $this->settings->get('mail_username'));
        Config::set('mail.mailers.smtp.password', $this->settings->get('mail_password'));
        Config::set('mail.mailers.smtp.scheme', $scheme);

        $fromAddress = $this->settings->get('mail_from_address');
        if ($fromAddress) {
            Config::set('mail.from', [
                'address' => $fromAddress,
                'name' => $this->settings->get('mail_from_name')
                    ?: $this->settings->get('site_name', 'Samity Management'),
            ]);
        }

        return true;
    }

    /** True when SMTP is configured (a host has been set). */
    public function isConfigured(): bool
    {
        return (bool) $this->settings->get('mail_host');
    }
}
