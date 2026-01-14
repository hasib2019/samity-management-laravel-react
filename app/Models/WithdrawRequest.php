<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawRequest extends Model
{
    protected $fillable = [
        'member_id',
        'method_id',
        'debit_account_id',
        'amount',
        'converted_amount',
        'description',
        'requirements',
        'attachment',
        'status',
        'transaction_id',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function debitAccount(): BelongsTo
    {
        return $this->belongsTo(SavingsAccount::class, 'debit_account_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}

