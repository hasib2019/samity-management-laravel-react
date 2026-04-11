<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeMember extends Model
{
    use HasFactory;

    protected $table = 'committee_members';

    protected $fillable = [
        'committee_id',
        'member_info_id',
        'designation', // চেয়ারম্যান, ভাইস চেয়ারম্যান, সদস্য etc
        'position', // Position order
        'mobile',
        'email',
        'remarks',
    ];

    public function committee()
    {
        return $this->belongsTo(Committee::class);
    }

    public function memberInfo()
    {
        return $this->belongsTo(MemberInfo::class);
    }
}
