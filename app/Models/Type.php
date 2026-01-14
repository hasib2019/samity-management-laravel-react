<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Type extends Model
{
    protected $fillable = [
        'type_for',
        'name',
        'code',
        'description',
        'status',
    ];

    public function cashBankMappings(): HasMany
    {
        return $this->hasMany(CashBankMapping::class, 'type_id');
    }
}

