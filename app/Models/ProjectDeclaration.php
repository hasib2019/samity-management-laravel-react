<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDeclaration extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_code',
        'project_name',
        'samity_id',
        'description',
        'declaration_date',
        'total_shares',
        'share_price',
        'target_amount',
        'sold_share_qty',
        'available_share_qty',
        'sold_amount',
        'investment_gl_id',
        'investor_fund_gl_id',
        'cash_gl_id',
        'profit_distribution_gl_id',
        'samity_income_gl_id',
        'closing_date',
        'closing_value',
        'closing_expense',
        'net_profit',
        'distributable_profit',
        'samity_income',
        'status',
        'created_by',
        'updated_by',
        'closed_by',
    ];

    protected $casts = [
        'declaration_date' => 'date',
        'closing_date' => 'date',
        'total_shares' => 'decimal:2',
        'share_price' => 'decimal:2',
        'target_amount' => 'decimal:2',
        'sold_share_qty' => 'decimal:2',
        'available_share_qty' => 'decimal:2',
        'sold_amount' => 'decimal:2',
        'closing_value' => 'decimal:2',
        'closing_expense' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'distributable_profit' => 'decimal:2',
        'samity_income' => 'decimal:2',
    ];

    public function investors()
    {
        return $this->hasMany(ProjectInvestor::class);
    }

    public function samity()
    {
        return $this->belongsTo(SamityProfile::class, 'samity_id');
    }

    public function shareTransactions()
    {
        return $this->hasMany(ProjectShareTransaction::class);
    }

    public function closing()
    {
        return $this->hasOne(ProjectClosing::class);
    }

    public function investmentGl()
    {
        return $this->belongsTo(GlAccount::class, 'investment_gl_id');
    }

    public function investorFundGl()
    {
        return $this->belongsTo(GlAccount::class, 'investor_fund_gl_id');
    }

    public function cashGl()
    {
        return $this->belongsTo(GlAccount::class, 'cash_gl_id');
    }

    public function profitDistributionGl()
    {
        return $this->belongsTo(GlAccount::class, 'profit_distribution_gl_id');
    }

    public function samityIncomeGl()
    {
        return $this->belongsTo(GlAccount::class, 'samity_income_gl_id');
    }
}
