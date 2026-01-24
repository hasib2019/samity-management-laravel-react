<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanGuarantor extends Model
{
    protected $fillable = [
        'loan_application_id',
        'guarantor_type',
        'member_id',
        'name',
        'father_name',
        'husband_name',
        'relation',
        'address',
        'contact_no',
        'nid',
        'image',
        'signature',
        'nid_image'
    ];

    public function loanApplication(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }
}
