<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavingsAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_number',
        'member_id',
        'product_id',
        'status',
        'principal_amount',
        'current_balance',
        'profit_balance',
        'tenure_month',
        'description',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'profit_balance' => 'decimal:2',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
