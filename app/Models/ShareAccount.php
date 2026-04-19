<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShareAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'product_id',
        'account_no',
        'total_shares',
        'face_value',
        'current_balance',
        'status',
        'created_by',
        'updated_by',
    ];

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function transactions()
    {
        return $this->hasMany(ShareTransaction::class);
    }
}
