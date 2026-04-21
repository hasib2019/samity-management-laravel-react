<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberLoanAccount extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'member_loan_application_id',
        'samity_id',
        'member_id',
        'product_id',
        'account_no',
        'disbursed_date',
        'original_principal',
        'outstanding_principal',
        'accrued_interest_balance',
        'overdue_interest_balance',
        'total_outstanding',
        'scheduled_emi',
        'monthly_interest_rate',
        'last_accrual_date',
        'next_accrual_date',
        'last_payment_date',
        'total_interest_accrued',
        'total_overdue_interest_accrued',
        'total_paid_amount',
        'total_principal_paid',
        'total_interest_paid',
        'total_overdue_interest_paid',
        'closed_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'disbursed_date' => 'date',
        'last_accrual_date' => 'date',
        'next_accrual_date' => 'date',
        'last_payment_date' => 'date',
        'closed_date' => 'date',
        'original_principal' => 'decimal:2',
        'outstanding_principal' => 'decimal:2',
        'accrued_interest_balance' => 'decimal:2',
        'overdue_interest_balance' => 'decimal:2',
        'total_outstanding' => 'decimal:2',
        'scheduled_emi' => 'decimal:2',
        'monthly_interest_rate' => 'decimal:4',
        'total_interest_accrued' => 'decimal:2',
        'total_overdue_interest_accrued' => 'decimal:2',
        'total_paid_amount' => 'decimal:2',
        'total_principal_paid' => 'decimal:2',
        'total_interest_paid' => 'decimal:2',
        'total_overdue_interest_paid' => 'decimal:2',
    ];

    public function application()
    {
        return $this->belongsTo(MemberLoanApplication::class, 'member_loan_application_id');
    }

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function samity()
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function schedules()
    {
        return $this->hasMany(MemberLoanSchedule::class, 'member_loan_account_id');
    }

    public function transactions()
    {
        return $this->hasMany(MemberLoanTransaction::class, 'member_loan_account_id');
    }
}
