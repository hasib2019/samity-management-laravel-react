<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PayrollRun extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_payroll_runs';

    protected $fillable = [
        'period_year',
        'period_month',
        'status',
        'processed_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'processed_at' => 'datetime',
    ];

    public function payslips()
    {
        return $this->hasMany(Payslip::class, 'payroll_run_id');
    }
}
