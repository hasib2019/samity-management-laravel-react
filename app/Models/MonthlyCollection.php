<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'month',
        'year',
        'amount_collected',
        'penalty_collected',
        'collection_date',
        'collected_by',
        'note',
    ];

    protected $casts = [
        'amount_collected' => 'decimal:2',
        'penalty_collected' => 'decimal:2',
        'collection_date' => 'date',
    ];

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function collectedBy()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
