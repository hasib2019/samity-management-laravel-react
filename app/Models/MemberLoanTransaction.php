<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberLoanTransaction extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'member_loan_account_id',
        'member_loan_application_id',
        'samity_id',
        'member_id',
        'product_id',
        'transaction_date',
        'reference_no',
        'batch_num',
        'transaction_type',
        'input_emi_amount',
        'input_interest_amount',
        'input_total_amount',
        'accrued_interest_amount',
        'overdue_interest_amount',
        'applied_interest_amount',
        'applied_overdue_interest_amount',
        'applied_principal_amount',
        'principal_balance_after',
        'interest_balance_after',
        'overdue_balance_after',
        'total_outstanding_after',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'input_emi_amount' => 'decimal:2',
        'input_interest_amount' => 'decimal:2',
        'input_total_amount' => 'decimal:2',
        'accrued_interest_amount' => 'decimal:2',
        'overdue_interest_amount' => 'decimal:2',
        'applied_interest_amount' => 'decimal:2',
        'applied_overdue_interest_amount' => 'decimal:2',
        'applied_principal_amount' => 'decimal:2',
        'principal_balance_after' => 'decimal:2',
        'interest_balance_after' => 'decimal:2',
        'overdue_balance_after' => 'decimal:2',
        'total_outstanding_after' => 'decimal:2',
    ];

    public function account()
    {
        return $this->belongsTo(MemberLoanAccount::class, 'member_loan_account_id');
    }

    public function application()
    {
        return $this->belongsTo(MemberLoanApplication::class, 'member_loan_application_id');
    }
}
