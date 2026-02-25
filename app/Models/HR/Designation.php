<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Designation extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_designations';

    protected $fillable = [
        'name',
        'grade',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
