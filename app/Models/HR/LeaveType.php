<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class LeaveType extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_leave_types';

    protected $fillable = [
        'name',
        'max_days_per_year',
        'is_paid',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
