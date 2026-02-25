<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Shift extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_shifts';

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'grace_minutes',
        'break_minutes',
        'weekly_off_pattern',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'weekly_off_pattern' => 'array',
    ];
}
