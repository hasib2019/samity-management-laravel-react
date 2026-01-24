<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanAccount extends Model
{
    use Auditable;

    protected $fillable = [
        'loan_application_id',
        'member_id',
        'account_no',
        'principal_amount',
        'interest_amount',
        'total_payable',
        'current_balance',
        'total_paid',
        'principal_paid',
        'interest_paid',
        'disbursed_date',
        'closed_date',
        'status'
    ];

    protected $casts = [
        'disbursed_date' => 'date',
        'closed_date' => 'date',
        'principal_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'total_payable' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'principal_paid' => 'decimal:2',
        'interest_paid' => 'decimal:2',
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }
}
