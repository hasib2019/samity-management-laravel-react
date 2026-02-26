<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class SalaryComponent extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_salary_components';

    protected $fillable = [
        'name',
        'code',
        'type',
        'amount_type',
        'amount',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
