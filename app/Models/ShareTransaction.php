<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShareTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'share_account_id',
        'tran_date',
        'tran_type',
        'quantity',
        'face_value',
        'amount',
        'related_account_id',
        'remarks',
        'status',
        'created_by',
    ];

    public function shareAccount()
    {
        return $this->belongsTo(ShareAccount::class);
    }
}
