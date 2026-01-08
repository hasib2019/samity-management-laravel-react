<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'month',
        'year',
        'is_active',
        'penalty_start_date',
        'note',
        'created_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'penalty_start_date' => 'date',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
