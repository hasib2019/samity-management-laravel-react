<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeElection extends Model
{
    use HasFactory;

    protected $table = 'committee_elections';

    protected $fillable = [
        'committee_id',
        'election_date',
        'election_venue',
        'total_members',
        'total_votes_cast',
        'status', // scheduled, completed, cancelled
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'election_date' => 'date',
    ];

    public function committee()
    {
        return $this->belongsTo(Committee::class);
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
