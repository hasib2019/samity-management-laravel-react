<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoucherRequest extends Model
{
    protected $fillable = [
        'voucher_type_id',
        'member_id',
        'method_id',
        'customer_account_id',
        'amount',
        'converted_amount',
        'description',
        'requirements',
        'attachment',
        'status',
        'transaction_id',
    ];

    public function voucherType(): BelongsTo
    {
        return $this->belongsTo(Type::class, 'voucher_type_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}

