<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'customer_id',
        'product_id',
        'samity_id',
        'payment_mode',
        'tran_num',
        'tran_code',
        'batch_num',
        'tran_type',
        'tran_date',
        'glac_id',
        'naration',
        'dr_amt',
        'cr_amt',
        'status',
        'channel_code',
        'rev_tran_id',
        'cheque_num',
        'cheque_date',
        'bank_id',
        'branch_id',
        'transfer_ac_no',
        'authorize_status',
        'authorized_by',
        'authorized_at',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'tran_date' => 'date',
        'cheque_date' => 'date',
        'authorized_at' => 'datetime',
        'dr_amt' => 'decimal:2',
        'cr_amt' => 'decimal:2',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'customer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
    
    public function samity(): BelongsTo
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function authorizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }

    public function glAccount(): BelongsTo
    {
        return $this->belongsTo(GlAccount::class, 'glac_id');
    }
}
