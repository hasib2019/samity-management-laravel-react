<?php

namespace App\Services;

use App\Helpers\BalanceHelper;
use App\Models\MemberLoanAccount;
use App\Models\MemberLoanApplication;
use App\Models\MemberLoanTransaction;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MemberLoanService
{
    public function nextAccrualDate(string $disbursedDate): string
    {
        return Carbon::parse($disbursedDate)->addDays(30)->toDateString();
    }

    public function approveApplication(MemberLoanApplication $application, array $data): MemberLoanApplication
    {
        $approvedAmount = (float) ($data['approved_amount'] ?? $application->requested_amount);
        $monthlyRate = (float) ($data['monthly_interest_rate'] ?? $application->monthly_interest_rate ?? 1);
        $tenure = (int) ($data['tenure_months'] ?? $application->tenure_months);

        $application->update([
            'approved_amount' => $approvedAmount,
            'monthly_interest_rate' => $monthlyRate,
            'tenure_months' => $tenure,
            'approved_date' => $data['approved_date'],
            'remarks' => $data['remarks'] ?? $application->remarks,
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return $application->fresh(['member', 'samity', 'product']);
    }

    public function rejectApplication(MemberLoanApplication $application, ?string $remarks = null): MemberLoanApplication
    {
        $application->update([
            'status' => 'rejected',
            'remarks' => $remarks,
            'updated_by' => Auth::id(),
        ]);

        return $application->fresh(['member', 'samity', 'product']);
    }

    public function disburseApplication(MemberLoanApplication $application, string $disbursedDate, ?string $remarks = null): MemberLoanAccount
    {
        return DB::transaction(function () use ($application, $disbursedDate, $remarks) {
            $application->loadMissing('product', 'member', 'samity', 'account');

            if ($application->status !== 'approved') {
                throw new \RuntimeException('Only approved applications can be disbursed.');
            }

            if ($application->account) {
                throw new \RuntimeException('This application is already disbursed.');
            }

            $product = $application->product;
            $this->assertProductGlSetup($product);

            $principal = (float) $application->approved_amount;
            $rate = (float) $application->monthly_interest_rate;
            $this->assertCashAvailability($application->samity_id, $product, $principal);

            $account = MemberLoanAccount::create([
                'member_loan_application_id' => $application->id,
                'samity_id' => $application->samity_id,
                'member_id' => $application->member_id,
                'product_id' => $application->product_id,
                'account_no' => $this->generateAccountNo($application),
                'disbursed_date' => $disbursedDate,
                'original_principal' => $principal,
                'outstanding_principal' => $principal,
                'total_outstanding' => $principal,
                'monthly_interest_rate' => $rate,
                'next_accrual_date' => $this->nextAccrualDate($disbursedDate),
                'created_by' => Auth::id(),
            ]);

            $application->update([
                'disbursed_date' => $disbursedDate,
                'disbursed_by' => Auth::id(),
                'status' => 'disbursed',
                'updated_by' => Auth::id(),
            ]);

            $batchNum = $this->generateBatchNum('MLD');

            MemberLoanTransaction::create([
                'member_loan_account_id' => $account->id,
                'member_loan_application_id' => $application->id,
                'samity_id' => $account->samity_id,
                'member_id' => $account->member_id,
                'product_id' => $account->product_id,
                'transaction_date' => $disbursedDate,
                'batch_num' => $batchNum,
                'reference_no' => $account->account_no,
                'transaction_type' => 'disbursement',
                'input_emi_amount' => 0,
                'input_interest_amount' => 0,
                'input_total_amount' => $principal,
                'applied_principal_amount' => $principal,
                'principal_balance_after' => $principal,
                'interest_balance_after' => 0,
                'overdue_balance_after' => 0,
                'total_outstanding_after' => $principal,
                'remarks' => $remarks ?: 'Member loan disbursement',
                'created_by' => Auth::id(),
            ]);

            $this->postDisbursementAccounting($account, $product, $principal, $disbursedDate, $batchNum, $remarks);

            return $account->fresh(['application', 'member', 'product', 'samity']);
        });
    }

    public function accrueUntil(MemberLoanAccount $account, string $asOfDate, ?string $remarks = null): MemberLoanAccount
    {
        return DB::transaction(function () use ($account, $asOfDate, $remarks) {
            $account = $account->fresh(['application', 'product']);
            $product = $account->product;
            $this->assertProductGlSetup($product);

            $asOf = Carbon::parse($asOfDate)->startOfDay();
            $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;

            while ($nextAccrualDate && $nextAccrualDate->lessThanOrEqualTo($asOf) && $account->status !== 'closed') {
                $interestAmount = round((float) $account->outstanding_principal * ((float) $account->monthly_interest_rate / 100), 2);

                $batchNum = $this->generateBatchNum('MLA');

                $account->update([
                    'accrued_interest_balance' => round((float) $account->accrued_interest_balance + $interestAmount, 2),
                    'total_interest_accrued' => round((float) $account->total_interest_accrued + $interestAmount, 2),
                    'last_accrual_date' => $nextAccrualDate->toDateString(),
                    'next_accrual_date' => $nextAccrualDate->copy()->addDays(30)->toDateString(),
                    'updated_by' => Auth::id(),
                ]);

                $account->update([
                    'total_outstanding' => $this->calculateOutstandingTotal($account->fresh()),
                    'status' => $this->computeAccountStatus($account->fresh(), $nextAccrualDate->toDateString()),
                ]);

                MemberLoanTransaction::create([
                    'member_loan_account_id' => $account->id,
                    'member_loan_application_id' => $account->member_loan_application_id,
                    'samity_id' => $account->samity_id,
                    'member_id' => $account->member_id,
                    'product_id' => $account->product_id,
                    'transaction_date' => $nextAccrualDate->toDateString(),
                    'batch_num' => $batchNum,
                    'reference_no' => $account->account_no,
                    'transaction_type' => 'monthly_accrual',
                    'accrued_interest_amount' => $interestAmount,
                    'principal_balance_after' => $account->outstanding_principal,
                    'interest_balance_after' => $account->accrued_interest_balance,
                    'overdue_balance_after' => 0,
                    'total_outstanding_after' => $account->total_outstanding,
                    'remarks' => $remarks ?: '30 day member loan interest accrual',
                    'created_by' => Auth::id(),
                ]);

                $this->postAccrualAccounting($account, $product, $interestAmount, 0, $nextAccrualDate->toDateString(), $batchNum);

                $account = $account->fresh(['application', 'product']);
                $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;
            }

            return $account->fresh(['application', 'product', 'member']);
        });
    }

    public function processRepayment(MemberLoanAccount $account, array $data, string $transactionType = 'repayment'): MemberLoanAccount
    {
        return DB::transaction(function () use ($account, $data, $transactionType) {
            $paymentDate = $data['payment_date'];
            $account = $this->accrueUntil($account, $paymentDate);
            $account->loadMissing('product');

            if ($account->status === 'closed') {
                throw new \RuntimeException('Closed account cannot receive payment.');
            }

            $emiInput = round((float) ($data['emi_amount'] ?? 0), 2);
            $interestInput = round((float) ($data['interest_amount'] ?? 0), 2);

            if ($emiInput <= 0 && $interestInput <= 0) {
                $paymentAmount = round((float) ($data['payment_amount'] ?? 0), 2);
                $emiInput = min($paymentAmount, (float) $account->outstanding_principal);
                $interestInput = round($paymentAmount - $emiInput, 2);
            }

            $totalInput = round($emiInput + $interestInput, 2);

            if ($totalInput <= 0) {
                throw new \RuntimeException('At least one payment amount is required.');
            }

            if ($emiInput - (float) $account->outstanding_principal > 0.009) {
                throw new \RuntimeException('Outstanding balance input exceeds current principal due.');
            }

            $availableInterest = round((float) $account->overdue_interest_balance + (float) $account->accrued_interest_balance, 2);
            if ($interestInput - $availableInterest > 0.009) {
                throw new \RuntimeException('Interest input exceeds current interest due.');
            }

            $appliedPrincipal = $emiInput;
            $appliedOverdue = min($interestInput, (float) $account->overdue_interest_balance);
            $appliedInterest = round($interestInput - $appliedOverdue, 2);

            $account->update([
                'overdue_interest_balance' => round((float) $account->overdue_interest_balance - $appliedOverdue, 2),
                'accrued_interest_balance' => round((float) $account->accrued_interest_balance - $appliedInterest, 2),
                'outstanding_principal' => round((float) $account->outstanding_principal - $appliedPrincipal, 2),
                'total_paid_amount' => round((float) $account->total_paid_amount + $totalInput, 2),
                'total_principal_paid' => round((float) $account->total_principal_paid + $appliedPrincipal, 2),
                'total_interest_paid' => round((float) $account->total_interest_paid + $appliedInterest, 2),
                'total_overdue_interest_paid' => round((float) $account->total_overdue_interest_paid + $appliedOverdue, 2),
                'last_payment_date' => $paymentDate,
                'updated_by' => Auth::id(),
            ]);

            $account = $account->fresh(['product']);
            $account->update([
                'total_outstanding' => $this->calculateOutstandingTotal($account),
                'status' => $this->computeAccountStatus($account, $paymentDate),
            ]);

            if ((float) $account->total_outstanding <= 0.009) {
                $account->update([
                    'outstanding_principal' => 0,
                    'accrued_interest_balance' => 0,
                    'overdue_interest_balance' => 0,
                    'total_outstanding' => 0,
                    'status' => 'closed',
                    'closed_date' => $paymentDate,
                ]);
                $account->application()->update([
                    'status' => 'closed',
                    'updated_by' => Auth::id(),
                ]);
            }

            $batchNum = $this->generateBatchNum($transactionType === 'closure' ? 'MLC' : 'MLR');
            MemberLoanTransaction::create([
                'member_loan_account_id' => $account->id,
                'member_loan_application_id' => $account->member_loan_application_id,
                'samity_id' => $account->samity_id,
                'member_id' => $account->member_id,
                'product_id' => $account->product_id,
                'transaction_date' => $paymentDate,
                'batch_num' => $batchNum,
                'reference_no' => $account->account_no,
                'transaction_type' => $transactionType,
                'input_emi_amount' => $emiInput,
                'input_interest_amount' => $interestInput,
                'input_total_amount' => $totalInput,
                'applied_interest_amount' => $appliedInterest,
                'applied_overdue_interest_amount' => $appliedOverdue,
                'applied_principal_amount' => $appliedPrincipal,
                'principal_balance_after' => $account->outstanding_principal,
                'interest_balance_after' => $account->accrued_interest_balance,
                'overdue_balance_after' => $account->overdue_interest_balance,
                'total_outstanding_after' => $account->total_outstanding,
                'remarks' => $data['remarks'] ?? ($transactionType === 'closure' ? 'Loan closure payment' : 'Member loan repayment'),
                'created_by' => Auth::id(),
            ]);

            $this->postRepaymentAccounting($account, $account->product, $totalInput, $paymentDate, $batchNum, $data['remarks'] ?? null);

            return $account->fresh(['application', 'member', 'product', 'samity']);
        });
    }

    public function closeAccount(MemberLoanAccount $account, array $data): MemberLoanAccount
    {
        $account = $this->accrueUntil($account, $data['closing_date']);
        $account = $account->fresh();

        $settlementAmount = round((float) ($data['settlement_amount'] ?? $account->total_outstanding), 2);
        $requiredAmount = round((float) $account->total_outstanding, 2);

        if (abs($settlementAmount - $requiredAmount) > 0.009) {
            throw new \RuntimeException('Closing amount must match the full outstanding balance.');
        }

        $interestAmount = round((float) $account->accrued_interest_balance + (float) $account->overdue_interest_balance, 2);

        return $this->processRepayment($account, [
            'payment_date' => $data['closing_date'],
            'emi_amount' => (float) $account->outstanding_principal,
            'interest_amount' => $interestAmount,
            'payment_amount' => $settlementAmount,
            'remarks' => $data['remarks'] ?? 'Loan closure settlement',
        ], 'closure');
    }

    public function statement(MemberLoanAccount $account, string $month): array
    {
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
        $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();

        $previousTx = $account->transactions()
            ->whereDate('transaction_date', '<', $start)
            ->latest('transaction_date')
            ->latest('id')
            ->first();

        $monthTransactions = $account->transactions()
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get();

        $closingTx = $monthTransactions->last() ?: $previousTx;

        return [
            'month' => $month,
            'account_no' => $account->account_no,
            'opening_balance' => $previousTx ? (float) $previousTx->total_outstanding_after : 0,
            'interest_charged' => (float) $monthTransactions->sum('accrued_interest_amount'),
            'overdue_interest_charged' => 0,
            'payments_received' => (float) $monthTransactions
                ->whereIn('transaction_type', ['repayment', 'closure'])
                ->sum('input_total_amount'),
            'closing_balance' => $closingTx ? (float) $closingTx->total_outstanding_after : 0,
            'transactions' => $monthTransactions,
        ];
    }

    public function balance(MemberLoanAccount $account): array
    {
        return [
            'account_no' => $account->account_no,
            'outstanding_principal' => (float) $account->outstanding_principal,
            'accrued_interest_balance' => (float) $account->accrued_interest_balance,
            'overdue_interest_balance' => (float) $account->overdue_interest_balance,
            'total_outstanding' => (float) $account->total_outstanding,
            'next_accrual_date' => $account->next_accrual_date,
            'status' => $account->status,
        ];
    }

    public function previewBalance(MemberLoanAccount $account, ?string $asOfDate = null): array
    {
        $principal = round((float) $account->outstanding_principal, 2);
        $accruedInterest = round((float) $account->accrued_interest_balance, 2);
        $overdueInterest = round((float) $account->overdue_interest_balance, 2);
        $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;

        if ($asOfDate) {
            $asOf = Carbon::parse($asOfDate)->startOfDay();

            while ($nextAccrualDate && $nextAccrualDate->lessThanOrEqualTo($asOf) && $principal > 0.009) {
                $interestAmount = round($principal * ((float) $account->monthly_interest_rate / 100), 2);
                $accruedInterest = round($accruedInterest + $interestAmount, 2);
                $nextAccrualDate = $nextAccrualDate->copy()->addDays(30);
            }
        }

        $totalOutstanding = round($principal + $accruedInterest + $overdueInterest, 2);

        return [
            'account_no' => $account->account_no,
            'outstanding_principal' => $principal,
            'accrued_interest_balance' => $accruedInterest,
            'overdue_interest_balance' => $overdueInterest,
            'total_outstanding' => $totalOutstanding,
            'next_accrual_date' => $nextAccrualDate?->toDateString(),
            'status' => $this->computePreviewStatus($totalOutstanding, $nextAccrualDate, $asOfDate),
            'preview_only' => true,
        ];
    }

    private function calculateOutstandingTotal(MemberLoanAccount $account): float
    {
        return round(
            (float) $account->outstanding_principal +
            (float) $account->accrued_interest_balance +
            (float) $account->overdue_interest_balance,
            2
        );
    }

    private function computeAccountStatus(MemberLoanAccount $account, string $asOfDate): string
    {
        if ((float) $account->total_outstanding <= 0.009) {
            return 'closed';
        }
        
        return Carbon::parse($account->next_accrual_date)->lte(Carbon::parse($asOfDate)) ? 'overdue' : 'active';
    }

    private function computePreviewStatus(float $totalOutstanding, ?Carbon $nextAccrualDate, ?string $asOfDate): string
    {
        if ($totalOutstanding <= 0.009) {
            return 'closed';
        }

        if (!$nextAccrualDate || !$asOfDate) {
            return 'active';
        }

        return $nextAccrualDate->lte(Carbon::parse($asOfDate)) ? 'overdue' : 'active';
    }

    private function postDisbursementAccounting(MemberLoanAccount $account, Product $product, float $amount, string $tranDate, string $batchNum, ?string $remarks): void
    {
        $common = $this->baseJournalData($account, $product, $tranDate, $batchNum, 'MLDIS', 'MemberLoanDisbursement', $remarks ?: 'Member loan disbursement');

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->mem_loan_portfolio_dr_gl_id,
            'dr_amt' => $amount,
            'cr_amt' => 0,
            'naration' => ($remarks ?: 'Member loan disbursement') . ' (Loan Outstanding)',
        ]));

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->mem_loan_cash_bank_cr_gl_id,
            'dr_amt' => 0,
            'cr_amt' => $amount,
            'naration' => ($remarks ?: 'Member loan disbursement') . ' (Cash/Bank Source)',
        ]));
    }

    private function postAccrualAccounting(MemberLoanAccount $account, Product $product, float $interest, float $overdue, string $tranDate, string $batchNum): void
    {
        if ($interest <= 0 && $overdue <= 0) {
            return;
        }

        $common = $this->baseJournalData($account, $product, $tranDate, $batchNum, 'MLACC', 'MemberLoanAccrual', 'Member loan monthly accrual');

        if ($interest > 0) {
            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->mem_loan_portfolio_dr_gl_id,
                'dr_amt' => $interest,
                'cr_amt' => 0,
                'naration' => 'Member loan interest receivable accrued',
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->mem_loan_interest_income_cr_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $interest,
                'naration' => 'Member loan interest income accrued',
            ]));
        }

        if ($overdue > 0) {
            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->mem_loan_portfolio_dr_gl_id,
                'dr_amt' => $overdue,
                'cr_amt' => 0,
                'naration' => 'Member loan overdue interest receivable accrued',
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->mem_loan_penalty_income_cr_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $overdue,
                'naration' => 'Member loan overdue interest income accrued',
            ]));
        }
    }

    private function postRepaymentAccounting(MemberLoanAccount $account, Product $product, float $amount, string $tranDate, string $batchNum, ?string $remarks): void
    {
        if ($amount <= 0) {
            return;
        }

        $common = $this->baseJournalData($account, $product, $tranDate, $batchNum, 'MLPAY', 'MemberLoanRepayment', $remarks ?: 'Member loan repayment');

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->mem_loan_cash_bank_cr_gl_id,
            'dr_amt' => $amount,
            'cr_amt' => 0,
            'naration' => ($remarks ?: 'Member loan repayment') . ' (Cash/Bank Collection)',
        ]));

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->mem_loan_portfolio_dr_gl_id,
            'dr_amt' => 0,
            'cr_amt' => $amount,
            'naration' => ($remarks ?: 'Member loan repayment') . ' (Loan Outstanding Reduction)',
        ]));
    }

    private function baseJournalData(MemberLoanAccount $account, Product $product, string $tranDate, string $batchNum, string $tranCode, string $tranType, string $narration): array
    {
        return [
            'samity_id' => $account->samity_id,
            'customer_id' => $account->member_id,
            'product_id' => $account->product_id,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => $tranCode,
            'tran_type' => $tranType,
            'tran_date' => $tranDate,
            'naration' => $narration,
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => now(),
            'created_by' => Auth::id(),
            'status' => 'posted',
        ];
    }

    private function assertProductGlSetup(Product $product): void
    {
        if (
            !$product->mem_loan_portfolio_dr_gl_id ||
            !$product->mem_loan_cash_bank_cr_gl_id ||
            !$product->mem_loan_interest_income_cr_gl_id ||
            !$product->mem_loan_penalty_income_cr_gl_id
        ) {
            throw new \RuntimeException('Member loan product GL configuration is incomplete.');
        }
    }

    private function assertCashAvailability(int $samityId, Product $product, float $amount): void
    {
        $available = BalanceHelper::getBalance($product->mem_loan_cash_bank_cr_gl_id, $samityId);

        if ($available < $amount) {
            throw new \RuntimeException('Insufficient cash/bank balance for member loan disbursement. Available balance: ' . round($available, 2));
        }
    }

    private function generateAccountNo(MemberLoanApplication $application): string
    {
        return 'ML-' . $application->member->member_code . '-' . str_pad((string) $application->id, 5, '0', STR_PAD_LEFT);
    }

    private function generateBatchNum(string $prefix): string
    {
        return $prefix . str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT);
    }

    private function generateTranNum(): string
    {
        return date('YmdHis') . random_int(10, 99);
    }
}
