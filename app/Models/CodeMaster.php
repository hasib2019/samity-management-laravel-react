<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CodeMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'code_type',
        'return_value',
        'display_value',
        'is_active',
        'display_serial',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_serial' => 'integer',
    ];
}
