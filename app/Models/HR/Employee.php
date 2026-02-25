<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Employee extends Model
{
    use HasFactory, Auditable;

    protected $table = 'hr_employees';

    protected $fillable = [
        'code',
        'full_name',
        'dob',
        'gender',
        'marital_status',
        'contact_phone',
        'email',
        'address',
        'join_date',
        'confirm_date',
        'resign_date',
        'department_id',
        'designation_id',
        'supervisor_id',
        'employment_type',
        'branch_id',
        'status',
        'nid',
        'tin',
        'bank_name',
        'bank_branch',
        'bank_account_no',
        'emergency_contact_name',
        'emergency_contact_phone',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'dob' => 'date',
        'join_date' => 'date',
        'confirm_date' => 'date',
        'resign_date' => 'date',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class, 'employee_id');
    }
}
