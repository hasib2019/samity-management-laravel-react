<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeDocument extends Model
{
    use HasFactory;

    protected $table = 'committee_documents';

    protected $fillable = [
        'committee_id',
        'document_name',
        'document_type', // meeting_minutes, election_record, etc
        'file_path',
        'file_name',
        'file_size',
        'uploaded_by',
        'remarks',
    ];

    public function committee()
    {
        return $this->belongsTo(Committee::class);
    }

    public function uploadedByUser()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
