<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DpsApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'product_id',
        'account_no',
        'dps_amount',
        'duration',
        'interest_rate',
        'total_installment',
        'start_date',
        'maturity_date',
        'maturity_amount',
        'balance',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'maturity_date' => 'date',
        'dps_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'maturity_amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function installments()
    {
        return $this->hasMany(DpsInstallment::class);
    }

    public function nominees()
    {
        return $this->hasMany(DpsNominee::class);
    }
}
