<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class MemberInfo extends Model
{
    use Auditable;
    protected $fillable = [
        'member_code',
        'occupation_id',
        'samity_id',
        'education_level_id',
        'marital_status_id',
        'gender_id',
        'nid',
        'dob',
        'member_name',
        'member_name_bangla',
        'father_name',
        'mother_name',
        'spouse_name',
        'mobile',
        'email',
        'committee_organizer',
        'committee_contact_person',
        'committee_signatory_person',
        'others_docs',
        'member_admission_date',
        'brn',
        'is_active',
        'is_samity_member',
        'documents',
        'member_photo',
        'member_sign',
        'nid_photo',
        'others',
        'user_id',
        'religion_id',
        'share_price',
        'no_of_share',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'dob' => 'date',
        'member_admission_date' => 'date',
        'others_docs' => 'array',
        'documents' => 'array',
        'is_active' => 'boolean',
        'is_samity_member' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updator()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function samity()
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function savingsAccounts()
    {
        return $this->hasMany(SavingsAccount::class, 'member_id');
    }

    public function shareAccounts()
    {
        return $this->hasMany(ShareAccount::class, 'member_id');
    }
}
