<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Department extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_departments';

    protected $fillable = [
        'name',
        'code',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
