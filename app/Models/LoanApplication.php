<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'samity_id',
        'product_id',
        'amount',
        'duration_months',
        'interest_rate',
        'installment_type',
        'apply_date',
        'purpose',
        'status',
        'disbursed_date',
        'remarks',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'apply_date' => 'date',
        'disbursed_date' => 'date',
        'amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
    ];

    public function nominees(): HasMany
    {
        return $this->hasMany(LoanNominee::class);
    }

    public function guarantors(): HasMany
    {
        return $this->hasMany(LoanGuarantor::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function samity(): BelongsTo
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
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
