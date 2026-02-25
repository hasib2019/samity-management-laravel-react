<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class EmployeeDocument extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_employee_documents';

    protected $fillable = [
        'employee_id',
        'type',
        'file_path',
        'meta',
        'uploaded_by',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
