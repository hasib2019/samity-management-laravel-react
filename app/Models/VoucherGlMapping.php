<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoucherGlMapping extends Model
{
    protected $fillable = [
        'voucher_type_id',
        'debit_glac_id',
        'credit_glac_id',
        'naration',
        'status',
    ];

    public function voucherType(): BelongsTo
    {
        return $this->belongsTo(Type::class, 'voucher_type_id');
    }
}

