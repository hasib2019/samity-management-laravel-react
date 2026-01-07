<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingsProduct extends Model
{
    protected $fillable = [
        'name',
        'currency_id',
        'interest_rate',
        'interest_method',
        'interest_period',
        'interest_posting_period',
        'min_bal_interest_rate',
        'allow_withdraw',
        'minimum_account_balance',
        'minimum_deposit_amount',
        'maintenance_fee',
        'maintenance_fee_posting_period',
        'status',
    ];

    protected $casts = [
        'interest_rate' => 'decimal:2',
        'min_bal_interest_rate' => 'decimal:2',
        'minimum_account_balance' => 'decimal:2',
        'minimum_deposit_amount' => 'decimal:2',
        'maintenance_fee' => 'decimal:2',
        'allow_withdraw' => 'boolean',
        'status' => 'boolean',
        'interest_period' => 'integer',
        'interest_posting_period' => 'integer',
    ];
}
