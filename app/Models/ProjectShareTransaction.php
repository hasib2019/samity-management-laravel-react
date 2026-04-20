<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectShareTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_declaration_id',
        'project_investor_id',
        'member_id',
        'tran_date',
        'tran_type',
        'share_qty',
        'rate',
        'amount',
        'batch_num',
        'remarks',
        'status',
        'created_by',
    ];

    protected $casts = [
        'tran_date' => 'date',
        'share_qty' => 'decimal:2',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(ProjectDeclaration::class, 'project_declaration_id');
    }

    public function investor()
    {
        return $this->belongsTo(ProjectInvestor::class, 'project_investor_id');
    }

    public function member()
    {
        return $this->belongsTo(MemberInfo::class, 'member_id');
    }
}
