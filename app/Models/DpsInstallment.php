<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DpsInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'dps_application_id',
        'installment_no',
        'due_date',
        'amount',
        'fine_amount',
        'paid_date',
        'paid_amount',
        'status',
        'note'
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'amount' => 'decimal:2',
        'fine_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function dpsApplication()
    {
        return $this->belongsTo(DpsApplication::class);
    }
}
