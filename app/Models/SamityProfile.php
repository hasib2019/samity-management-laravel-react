<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class SamityProfile extends Model
{
    use Auditable;
    protected $fillable = [
        'samity_name',
        'samity_code',
        'samity_address',
        'samity_type',
        'samity_formation_date',
        'old_registration_no',
        'samity_registration_date',
        'member_admission_fee',
        'no_of_share',
        'share_price',
        'sold_share',
        'phone',
        'mobile',
        'email',
        'website',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'samity_formation_date' => 'date',
        'samity_registration_date' => 'date',
        'member_admission_fee' => 'decimal:2',
        'share_price' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
