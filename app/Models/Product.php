<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'product_mst';

    protected $fillable = [
        'product_code',
        'product_name',
        'product_type',
        'product_category',
        'rate_type',
        'min_amount',
        'max_amount',
        'tenure_required',
        'min_tenure_month',
        'max_tenure_month',
        'profit_applicable',
        'profit_rate',
        'profit_calculation',
        'profit_posting',
        'installment_required',
        'installment_type',
        'installment_amount',
        'loan_calculation',
        'grace_period_month',
        'penalty_applicable',
        'penalty_rate',
        'gl_principal_id',
        'gl_profit_id',
        'gl_penalty_id',
        'gl_income_id',
        'gl_expense_id',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tenure_required' => 'boolean',
        'profit_applicable' => 'boolean',
        'installment_required' => 'boolean',
        'penalty_applicable' => 'boolean',
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'profit_rate' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'penalty_rate' => 'decimal:2',
    ];

    // Relationships
    public function glPrincipal() { return $this->belongsTo(GlAccount::class, 'gl_principal_id'); }
    public function glProfit() { return $this->belongsTo(GlAccount::class, 'gl_profit_id'); }
    public function glPenalty() { return $this->belongsTo(GlAccount::class, 'gl_penalty_id'); }
    public function glIncome() { return $this->belongsTo(GlAccount::class, 'gl_income_id'); }
    public function glExpense() { return $this->belongsTo(GlAccount::class, 'gl_expense_id'); }
}
