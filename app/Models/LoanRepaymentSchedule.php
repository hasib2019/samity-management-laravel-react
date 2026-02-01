<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanRepaymentSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_application_id',
        'installment_no',
        'due_date',
        'principal_amount',
        'interest_amount',
        'total_amount',
        'status',
        'paid_date',
        'fine_amount',
        'paid_amount',
        'paid_principal',
        'paid_interest',
        'paid_fine'
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'principal_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'fine_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_principal' => 'decimal:2',
        'paid_interest' => 'decimal:2',
        'paid_fine' => 'decimal:2',
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class, 'loan_application_id');
    }
}
