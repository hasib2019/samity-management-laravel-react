<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawRequest extends Model
{
    protected $fillable = [
        'member_id',
        'method_id',
        'savings_account_id',
        'amount',
        'total_amount',
        'charge',
        'description',
        'requirements',
        'attachment',
        'status',
        'transaction_id'
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function savingsAccount(): BelongsTo
    {
        return $this->belongsTo(SavingsAccount::class, 'savings_account_id');
    }
    
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
