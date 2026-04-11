<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Committee extends Model
{
    use HasFactory;

    protected $table = 'committees';

    protected $fillable = [
        'samity_id',
        'committee_type_id',
        'name',
        'name_bn',
        'meeting_date',
        'election_date',
        'effective_date',
        'end_date', // auto calculated from effective_date + validity_period
        'member_count',
        'status', // draft, submitted, approved, rejected
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'meeting_date' => 'date',
        'election_date' => 'date',
        'effective_date' => 'date',
        'end_date' => 'date',
    ];

    public function samity()
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function committeeType()
    {
        return $this->belongsTo(CommitteeType::class);
    }

    public function members()
    {
        return $this->hasMany(CommitteeMember::class);
    }

    public function documents()
    {
        return $this->hasMany(CommitteeDocument::class);
    }

    public function elections()
    {
        return $this->hasMany(CommitteeElection::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
