<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanNominee extends Model
{
    protected $fillable = [
        'loan_application_id',
        'nominee_type',
        'member_id',
        'nominee_name',
        'relation',
        'dob',
        'nid',
        'percentage',
        'image',
        'signature',
        'nid_image',
        'other_documents'
    ];

    protected $casts = [
        'dob' => 'date',
        'percentage' => 'decimal:2',
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
