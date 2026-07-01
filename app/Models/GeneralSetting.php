<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    use Auditable;

    protected $table = 'settings';

    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'autoload',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'autoload' => 'boolean',
    ];

    /**
     * Canonical definition of all site-wide settings.
     * Single source of truth used by the seeder (to create keys),
     * the controller (to validate/whitelist input), and the UI grouping.
     *
     * @return array<int, array{key:string, group:string, type:string, default:mixed}>
     */
    public static function definitions(): array
    {
        return [
            // Site Identity
            ['key' => 'site_name',        'group' => 'site_identity', 'type' => 'string', 'default' => 'Samity Management'],
            ['key' => 'site_short_name',  'group' => 'site_identity', 'type' => 'string', 'default' => 'Samity'],
            ['key' => 'site_logo',        'group' => 'site_identity', 'type' => 'image',  'default' => null],
            ['key' => 'site_favicon',     'group' => 'site_identity', 'type' => 'image',  'default' => null],
            ['key' => 'contact_email',    'group' => 'site_identity', 'type' => 'string', 'default' => null],
            ['key' => 'contact_phone',    'group' => 'site_identity', 'type' => 'string', 'default' => null],
            ['key' => 'contact_address',  'group' => 'site_identity', 'type' => 'text',   'default' => null],
            ['key' => 'footer_text',       'group' => 'site_identity', 'type' => 'string', 'default' => null],
            ['key' => 'developed_by_text', 'group' => 'site_identity', 'type' => 'string', 'default' => 'Creativeitbari'],
            ['key' => 'developed_by_url',  'group' => 'site_identity', 'type' => 'string', 'default' => 'https://creativeitbari.com'],

            // Localization
            ['key' => 'currency_code',          'group' => 'localization', 'type' => 'string',  'default' => 'BDT'],
            ['key' => 'currency_symbol',        'group' => 'localization', 'type' => 'string',  'default' => '৳'],
            ['key' => 'locale',                 'group' => 'localization', 'type' => 'string',  'default' => 'bn'],
            ['key' => 'timezone',               'group' => 'localization', 'type' => 'string',  'default' => 'Asia/Dhaka'],
            ['key' => 'date_format',            'group' => 'localization', 'type' => 'string',  'default' => 'd/m/Y'],
            ['key' => 'number_format_decimals', 'group' => 'localization', 'type' => 'integer', 'default' => '2'],

            // Financial Defaults
            ['key' => 'default_monthly_subscription_fee', 'group' => 'financial_defaults', 'type' => 'number',  'default' => '0'],
            ['key' => 'default_penalty_amount',           'group' => 'financial_defaults', 'type' => 'number',  'default' => '0'],
            ['key' => 'default_penalty_late_date',        'group' => 'financial_defaults', 'type' => 'integer', 'default' => '15'],
            ['key' => 'default_member_admission_fee',     'group' => 'financial_defaults', 'type' => 'number',  'default' => '0'],
            ['key' => 'fiscal_year_start_month',          'group' => 'financial_defaults', 'type' => 'integer', 'default' => '7'],

            // Notifications
            ['key' => 'enable_email_notifications', 'group' => 'notifications', 'type' => 'boolean', 'default' => '0'],
            ['key' => 'enable_sms_notifications',   'group' => 'notifications', 'type' => 'boolean', 'default' => '0'],
            ['key' => 'sms_sender_id',              'group' => 'notifications', 'type' => 'string',  'default' => null],
            ['key' => 'notification_from_email',    'group' => 'notifications', 'type' => 'string',  'default' => null],

            // Email (SMTP) Configuration
            ['key' => 'mail_mailer',       'group' => 'email', 'type' => 'string',   'default' => 'smtp'],
            ['key' => 'mail_host',         'group' => 'email', 'type' => 'string',   'default' => null],
            ['key' => 'mail_port',         'group' => 'email', 'type' => 'integer',  'default' => '587'],
            ['key' => 'mail_username',     'group' => 'email', 'type' => 'string',   'default' => null],
            ['key' => 'mail_password',     'group' => 'email', 'type' => 'password', 'default' => null],
            ['key' => 'mail_encryption',   'group' => 'email', 'type' => 'string',   'default' => 'tls'],
            ['key' => 'mail_from_address', 'group' => 'email', 'type' => 'string',   'default' => null],
            ['key' => 'mail_from_name',    'group' => 'email', 'type' => 'string',   'default' => 'Samity Management'],
        ];
    }

    /** Keys holding secrets that must never be exposed back to the client. */
    public static function secretKeys(): array
    {
        return array_values(array_map(
            fn ($d) => $d['key'],
            array_filter(self::definitions(), fn ($d) => $d['type'] === 'password')
        ));
    }

    /** Keys that store an uploaded file path. */
    public static function imageKeys(): array
    {
        return array_values(array_map(
            fn ($d) => $d['key'],
            array_filter(self::definitions(), fn ($d) => $d['type'] === 'image')
        ));
    }

    /** Keys editable as plain scalar form fields (everything except files). */
    public static function scalarKeys(): array
    {
        return array_values(array_map(
            fn ($d) => $d['key'],
            array_filter(self::definitions(), fn ($d) => $d['type'] !== 'image')
        ));
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
