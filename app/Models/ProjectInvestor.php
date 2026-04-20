<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectInvestor extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_declaration_id',
        'member_id',
        'samity_id',
        'purchased_shares',
        'invested_amount',
        'profit_amount',
        'refunded_amount',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'purchased_shares' => 'decimal:2',
        'invested_amount' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectDeclaration::class, 'project_declaration_id');
    }

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }

    public function transactions()
    {
        return $this->hasMany(ProjectShareTransaction::class);
    }
}
