<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_number',
        'member_id',
        'savings_product_id',
        'status',
        'opening_balance',
        'description',
        'created_user_id',
        'updated_user_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'opening_balance' => 'decimal:2',
    ];

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product()
    {
        return $this->belongsTo(SavingsProduct::class, 'savings_product_id');
    }
}
