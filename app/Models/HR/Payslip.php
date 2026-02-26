<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Payslip extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_payslips';

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'gross',
        'total_deduction',
        'net',
        'components',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'components' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function run()
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }
}
