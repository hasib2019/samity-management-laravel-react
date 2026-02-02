<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FdrApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'product_id',
        'account_no',
        'fdr_amount',
        'duration',
        'interest_rate',
        'interest_payment_type',
        'start_date',
        'maturity_date',
        'maturity_amount',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'maturity_date' => 'date',
        'fdr_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'maturity_amount' => 'decimal:2',
    ];

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function nominees()
    {
        return $this->hasMany(FdrNominee::class);
    }
}
