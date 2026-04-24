<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberLoanApplication extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'samity_id',
        'member_id',
        'product_id',
        'application_no',
        'application_date',
        'requested_amount',
        'approved_amount',
        'tenure_months',
        'monthly_interest_rate',
        'approved_date',
        'disbursed_date',
        'purpose',
        'remarks',
        'status',
        'approved_by',
        'disbursed_by',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'application_date' => 'date',
        'approved_date' => 'date',
        'disbursed_date' => 'date',
        'requested_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'monthly_interest_rate' => 'decimal:4',
    ];

    public function samity()
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function account()
    {
        return $this->hasOne(MemberLoanAccount::class, 'member_loan_application_id');
    }
}
