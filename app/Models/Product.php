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
        'face_value',
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
        'sav_dep_lib_cr_gl_id',
        'sav_penalty_income_cr_gl_id',
        'sav_cash_bank_dr_gl_id',
        'sav_interest_exp_dr_gl_id',
        'dps_dep_lib_cr_gl_id',
        'dps_penalty_income_cr_gl_id',
        'dps_cash_bank_dr_gl_id',
        'dps_interest_exp_dr_gl_id',
        'fdr_dep_lib_cr_gl_id',
        'fdr_penalty_income_cr_gl_id',
        'fdr_cash_bank_dr_gl_id',
        'fdr_interest_exp_dr_gl_id',
        'shr_capital_cr_gl_id',
        'shr_cash_bank_dr_gl_id',
        'shr_fee_income_cr_gl_id',
        'loan_portfolio_dr_gl_id',
        'loan_cash_bank_cr_gl_id',
        'loan_interest_income_cr_gl_id',
        'loan_penalty_income_cr_gl_id',
        'loan_waiver_exp_dr_gl_id',
        'loan_loss_provision_exp_dr_gl_id',
        'mem_loan_portfolio_dr_gl_id',
        'mem_loan_cash_bank_cr_gl_id',
        'mem_loan_interest_income_cr_gl_id',
        'mem_loan_penalty_income_cr_gl_id',
        'mem_loan_waiver_exp_dr_gl_id',
        'mem_loan_loss_provision_exp_dr_gl_id',
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
    public function savDepLibCrGl() { return $this->belongsTo(GlAccount::class, 'sav_dep_lib_cr_gl_id'); }
    public function savPenaltyIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'sav_penalty_income_cr_gl_id'); }
    public function savCashBankDrGl() { return $this->belongsTo(GlAccount::class, 'sav_cash_bank_dr_gl_id'); }
    public function savInterestExpDrGl() { return $this->belongsTo(GlAccount::class, 'sav_interest_exp_dr_gl_id'); }
    public function dpsDepLibCrGl() { return $this->belongsTo(GlAccount::class, 'dps_dep_lib_cr_gl_id'); }
    public function dpsPenaltyIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'dps_penalty_income_cr_gl_id'); }
    public function dpsCashBankDrGl() { return $this->belongsTo(GlAccount::class, 'dps_cash_bank_dr_gl_id'); }
    public function dpsInterestExpDrGl() { return $this->belongsTo(GlAccount::class, 'dps_interest_exp_dr_gl_id'); }
    public function fdrDepLibCrGl() { return $this->belongsTo(GlAccount::class, 'fdr_dep_lib_cr_gl_id'); }
    public function fdrPenaltyIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'fdr_penalty_income_cr_gl_id'); }
    public function fdrCashBankDrGl() { return $this->belongsTo(GlAccount::class, 'fdr_cash_bank_dr_gl_id'); }
    public function fdrInterestExpDrGl() { return $this->belongsTo(GlAccount::class, 'fdr_interest_exp_dr_gl_id'); }
    public function shrCapitalCrGl() { return $this->belongsTo(GlAccount::class, 'shr_capital_cr_gl_id'); }
    public function shrCashBankDrGl() { return $this->belongsTo(GlAccount::class, 'shr_cash_bank_dr_gl_id'); }
    public function shrFeeIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'shr_fee_income_cr_gl_id'); }
    public function loanPortfolioDrGl() { return $this->belongsTo(GlAccount::class, 'loan_portfolio_dr_gl_id'); }
    public function loanCashBankCrGl() { return $this->belongsTo(GlAccount::class, 'loan_cash_bank_cr_gl_id'); }
    public function loanInterestIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'loan_interest_income_cr_gl_id'); }
    public function loanPenaltyIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'loan_penalty_income_cr_gl_id'); }
    public function loanWaiverExpDrGl() { return $this->belongsTo(GlAccount::class, 'loan_waiver_exp_dr_gl_id'); }
    public function loanLossProvisionExpDrGl() { return $this->belongsTo(GlAccount::class, 'loan_loss_provision_exp_dr_gl_id'); }
    public function memLoanPortfolioDrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_portfolio_dr_gl_id'); }
    public function memLoanCashBankCrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_cash_bank_cr_gl_id'); }
    public function memLoanInterestIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_interest_income_cr_gl_id'); }
    public function memLoanPenaltyIncomeCrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_penalty_income_cr_gl_id'); }
    public function memLoanWaiverExpDrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_waiver_exp_dr_gl_id'); }
    public function memLoanLossProvisionExpDrGl() { return $this->belongsTo(GlAccount::class, 'mem_loan_loss_provision_exp_dr_gl_id'); }
}
