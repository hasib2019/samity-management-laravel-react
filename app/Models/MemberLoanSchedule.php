<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberLoanSchedule extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'member_loan_account_id',
        'schedule_no',
        'due_date',
        'opening_principal',
        'scheduled_emi',
        'scheduled_interest',
        'scheduled_principal',
        'accrued_interest',
        'overdue_interest',
        'paid_interest',
        'paid_principal',
        'paid_overdue_interest',
        'closing_principal',
        'last_payment_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'last_payment_date' => 'date',
        'opening_principal' => 'decimal:2',
        'scheduled_emi' => 'decimal:2',
        'scheduled_interest' => 'decimal:2',
        'scheduled_principal' => 'decimal:2',
        'accrued_interest' => 'decimal:2',
        'overdue_interest' => 'decimal:2',
        'paid_interest' => 'decimal:2',
        'paid_principal' => 'decimal:2',
        'paid_overdue_interest' => 'decimal:2',
        'closing_principal' => 'decimal:2',
    ];

    public function account()
    {
        return $this->belongsTo(MemberLoanAccount::class, 'member_loan_account_id');
    }
}
