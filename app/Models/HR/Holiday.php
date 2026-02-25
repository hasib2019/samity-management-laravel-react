<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Holiday extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_holidays';

    protected $fillable = [
        'date',
        'title',
        'branch_id',
        'is_recurring',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
