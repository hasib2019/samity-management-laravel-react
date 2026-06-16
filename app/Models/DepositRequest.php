<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepositRequest extends Model
{
    protected $fillable = [
        'member_id',
        'method_id',
        'savings_account_id',
        'is_subscription',
        'period_month',
        'period_year',
        'penalty_amount',
        'amount',
        'total_amount',
        'charge',
        'description',
        'requirements',
        'attachment',
        'status',
        'transaction_id'
    ];

    protected $casts = [
        'is_subscription' => 'boolean',
        'period_month' => 'integer',
        'period_year' => 'integer',
        'penalty_amount' => 'decimal:2',
        'amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'charge' => 'decimal:2',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    // Assuming there might be a PaymentMethod model or similar
    // public function method(): BelongsTo
    // {
    //     return $this->belongsTo(PaymentMethod::class, 'method_id');
    // }

    public function savingsAccount(): BelongsTo
    {
        return $this->belongsTo(SavingsAccount::class, 'savings_account_id');
    }
    
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
