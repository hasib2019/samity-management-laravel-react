<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeType extends Model
{
    use HasFactory;

    protected $table = 'committee_types';

    protected $fillable = [
        'name',
        'name_bn',
        'description',
        'validity_period', // ম্যান্ডেট কত বছর (in years)
        'member_count_options', // JSON: [3, 6, 9, 12]
        'is_active',
    ];

    protected $casts = [
        'member_count_options' => 'array',
        'is_active' => 'boolean',
    ];

    public function committees()
    {
        return $this->hasMany(Committee::class);
    }
}
