<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectClosing extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_declaration_id',
        'closing_date',
        'total_invested',
        'closing_value',
        'closing_expense',
        'net_profit',
        'distributable_profit',
        'samity_income',
        'total_investors',
        'remarks',
        'status',
        'created_by',
    ];

    protected $casts = [
        'closing_date' => 'date',
        'total_invested' => 'decimal:2',
        'closing_value' => 'decimal:2',
        'closing_expense' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'distributable_profit' => 'decimal:2',
        'samity_income' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectDeclaration::class, 'project_declaration_id');
    }
}
