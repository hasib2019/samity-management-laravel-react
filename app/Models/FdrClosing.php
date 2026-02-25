<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FdrClosing extends Model
{
    use HasFactory;

    protected $table = 'fdr_closings';

    protected $fillable = [
        'fdr_application_id',
        'closing_date',
        'principal_amount',
        'total_interest_paid',
        'penalty_amount',
        'total_paid',
        'status',
        'remarks',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'closing_date' => 'date',
        'principal_amount' => 'decimal:2',
        'total_interest_paid' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'total_paid' => 'decimal:2',
    ];

    public function fdrApplication()
    {
        return $this->belongsTo(FdrApplication::class);
    }
}
