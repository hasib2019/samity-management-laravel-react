<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class EmployeeSalary extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_employee_salaries';

    protected $fillable = [
        'employee_id',
        'base_salary',
        'effective_from',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'effective_from' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
