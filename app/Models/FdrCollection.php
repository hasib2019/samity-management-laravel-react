<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FdrCollection extends Model
{
    use HasFactory;

    protected $table = 'fdr_collections';

    protected $fillable = [
        'fdr_application_id',
        'collection_date',
        'interest_amount',
        'period_from',
        'period_to',
        'collection_type',
        'status',
        'remarks',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'collection_date' => 'date',
        'period_from' => 'date',
        'period_to' => 'date',
        'interest_amount' => 'decimal:2',
    ];

    public function fdrApplication()
    {
        return $this->belongsTo(FdrApplication::class);
    }
}
