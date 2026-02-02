<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FdrNominee extends Model
{
    use HasFactory;

    protected $fillable = [
        'fdr_application_id',
        'nominee_name',
        'relation',
        'dob',
        'nid',
        'percentage',
        'image'
    ];

    protected $casts = [
        'dob' => 'date',
        'percentage' => 'decimal:2',
    ];

    public function fdrApplication()
    {
        return $this->belongsTo(FdrApplication::class);
    }
}
