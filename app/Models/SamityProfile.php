<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SamityProfile extends Model
{
    protected $fillable = [
        'samity_name',
        'samity_code',
        'samity_address',
        'samity_type',
        'created_by',
        'updated_by'
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
