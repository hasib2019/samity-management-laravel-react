<?php

namespace App\Services;

use App\Models\MemberLoanAccount;
use App\Models\MemberLoanApplication;
use App\Models\MemberLoanSchedule;
use App\Models\MemberLoanTransaction;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MemberLoanService
{
    public function calculateEmi(float $principal, float $monthlyInterestRate, int $tenureMonths): float
    {
        if ($tenureMonths <= 0) {
            return 0;
        }

        $rate = $monthlyInterestRate / 100;
        if ($rate <= 0) {
            return round($principal / $tenureMonths, 2);
        }

        $factor = pow(1 + $rate, $tenureMonths);
        $emi = $principal * $rate * $factor / ($factor - 1);

        return round($emi, 2);
    }

    public function nextAccrualDate(string $disbursedDate): string
    {
        return Carbon::parse($disbursedDate)->startOfMonth()->addMonth()->toDateString();
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
            'scheduled_emi' => $this->calculateEmi($approvedAmount, $monthlyRate, $tenure),
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
            $tenure = (int) $application->tenure_months;
            $scheduledEmi = (float) ($application->scheduled_emi ?: $this->calculateEmi($principal, $rate, $tenure));

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
                'scheduled_emi' => $scheduledEmi,
                'monthly_interest_rate' => $rate,
                'next_accrual_date' => $this->nextAccrualDate($disbursedDate),
                'created_by' => Auth::id(),
            ]);

            $this->generateSchedules($account, $tenure);

            $application->update([
                'scheduled_emi' => $scheduledEmi,
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
            $account = $account->fresh(['application', 'product', 'schedules']);
            $product = $account->product;
            $this->assertProductGlSetup($product);

            $asOf = Carbon::parse($asOfDate)->startOfDay();
            $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;

            while ($nextAccrualDate && $nextAccrualDate->lessThanOrEqualTo($asOf) && $account->status !== 'closed') {
                $interestAmount = round((float) $account->outstanding_principal * ((float) $account->monthly_interest_rate / 100), 2);
                $overdueBase = $this->calculateOverdueBase($account, $nextAccrualDate->toDateString());
                $overdueInterest = $overdueBase > 0
                    ? round($overdueBase * ((float) $account->monthly_interest_rate / 100), 2)
                    : 0.0;

                $schedule = $account->schedules->firstWhere('due_date', $nextAccrualDate->toDateString());
                if ($schedule) {
                    $schedule->update([
                        'accrued_interest' => round((float) $schedule->accrued_interest + $interestAmount, 2),
                        'overdue_interest' => round((float) $schedule->overdue_interest + $overdueInterest, 2),
                        'status' => $this->computeScheduleStatus($schedule, $nextAccrualDate->toDateString(), true),
                    ]);
                }

                foreach ($account->schedules as $loopSchedule) {
                    if (Carbon::parse($loopSchedule->due_date)->lt($nextAccrualDate)) {
                        $loopSchedule->update([
                            'status' => $this->computeScheduleStatus($loopSchedule->fresh(), $nextAccrualDate->toDateString(), true),
                        ]);
                    }
                }

                $batchNum = $this->generateBatchNum('MLA');

                $account->update([
                    'accrued_interest_balance' => round((float) $account->accrued_interest_balance + $interestAmount, 2),
                    'overdue_interest_balance' => round((float) $account->overdue_interest_balance + $overdueInterest, 2),
                    'total_interest_accrued' => round((float) $account->total_interest_accrued + $interestAmount, 2),
                    'total_overdue_interest_accrued' => round((float) $account->total_overdue_interest_accrued + $overdueInterest, 2),
                    'last_accrual_date' => $nextAccrualDate->toDateString(),
                    'next_accrual_date' => $nextAccrualDate->copy()->addMonth()->startOfMonth()->toDateString(),
                    'updated_by' => Auth::id(),
                ]);

                $account->update([
                    'total_outstanding' => $this->calculateOutstandingTotal($account->fresh()),
                    'status' => $this->computeAccountStatus($account->fresh(), $nextAccrualDate->toDateString()),
                ]);

                MemberLoanTransaction::create([
                    'member_loan_account_id' => $account->id,
                    'member_loan_application_id' => $account->member_loan_application_id,
                    'member_loan_schedule_id' => $schedule?->id,
                    'samity_id' => $account->samity_id,
                    'member_id' => $account->member_id,
                    'product_id' => $account->product_id,
                    'transaction_date' => $nextAccrualDate->toDateString(),
                    'batch_num' => $batchNum,
                    'reference_no' => $account->account_no,
                    'transaction_type' => 'monthly_accrual',
                    'accrued_interest_amount' => $interestAmount,
                    'overdue_interest_amount' => $overdueInterest,
                    'principal_balance_after' => $account->outstanding_principal,
                    'interest_balance_after' => $account->accrued_interest_balance,
                    'overdue_balance_after' => $account->overdue_interest_balance,
                    'total_outstanding_after' => $account->total_outstanding,
                    'remarks' => $remarks ?: 'Monthly interest accrual',
                    'created_by' => Auth::id(),
                ]);

                $this->postAccrualAccounting($account, $product, $interestAmount, $overdueInterest, $nextAccrualDate->toDateString(), $batchNum);

                $account = $account->fresh(['application', 'product', 'schedules']);
                $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;
            }

            return $account->fresh(['application', 'product', 'member', 'schedules']);
        });
    }

    public function processRepayment(MemberLoanAccount $account, array $data, string $transactionType = 'repayment'): MemberLoanAccount
    {
        return DB::transaction(function () use ($account, $data, $transactionType) {
            $paymentDate = $data['payment_date'];
            $account = $this->accrueUntil($account, $paymentDate);
            $account->loadMissing('product', 'schedules');

            if ($account->status === 'closed') {
                throw new \RuntimeException('Closed account cannot receive payment.');
            }

            $emiInput = round((float) ($data['emi_amount'] ?? 0), 2);
            $interestInput = round((float) ($data['interest_amount'] ?? 0), 2);
            $totalInput = round($emiInput + $interestInput, 2);

            if ($totalInput <= 0) {
                throw new \RuntimeException('At least one payment amount is required.');
            }

            $remaining = $totalInput;
            $appliedOverdue = min($remaining, (float) $account->overdue_interest_balance);
            $remaining = round($remaining - $appliedOverdue, 2);

            $appliedInterest = min($remaining, (float) $account->accrued_interest_balance);
            $remaining = round($remaining - $appliedInterest, 2);

            $appliedPrincipal = min($remaining, (float) $account->outstanding_principal);
            $remaining = round($remaining - $appliedPrincipal, 2);

            if ($remaining > 0.009) {
                throw new \RuntimeException('Payment exceeds current outstanding balance.');
            }

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

            $this->allocateSchedulePayments($account->fresh('schedules'), $appliedOverdue, $appliedInterest, $appliedPrincipal, $paymentDate);

            $account = $account->fresh(['product', 'schedules']);
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
                'remarks' => $data['remarks'] ?? ($transactionType === 'closure' ? 'Loan closure payment' : 'Loan repayment'),
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

        return $this->processRepayment($account, [
            'payment_date' => $data['closing_date'],
            'emi_amount' => (float) $account->outstanding_principal,
            'interest_amount' => round((float) $account->accrued_interest_balance + (float) $account->overdue_interest_balance, 2),
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
            'overdue_interest_charged' => (float) $monthTransactions->sum('overdue_interest_amount'),
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

    private function generateSchedules(MemberLoanAccount $account, int $tenureMonths): void
    {
        $openingPrincipal = (float) $account->original_principal;
        $rate = (float) $account->monthly_interest_rate / 100;
        $emi = (float) $account->scheduled_emi;
        $dueDate = Carbon::parse($this->nextAccrualDate($account->disbursed_date))->startOfDay();

        for ($i = 1; $i <= $tenureMonths; $i++) {
            $interest = round($openingPrincipal * $rate, 2);
            $principal = round($emi - $interest, 2);

            if ($principal > $openingPrincipal || $i === $tenureMonths) {
                $principal = round($openingPrincipal, 2);
            }

            $scheduleEmi = round($principal + $interest, 2);
            $closingPrincipal = round($openingPrincipal - $principal, 2);

            MemberLoanSchedule::create([
                'member_loan_account_id' => $account->id,
                'schedule_no' => $i,
                'due_date' => $dueDate->toDateString(),
                'opening_principal' => $openingPrincipal,
                'scheduled_emi' => $scheduleEmi,
                'scheduled_interest' => $interest,
                'scheduled_principal' => $principal,
                'closing_principal' => max($closingPrincipal, 0),
            ]);

            $openingPrincipal = max($closingPrincipal, 0);
            $dueDate = $dueDate->copy()->addMonth()->startOfMonth();
        }
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

    private function calculateOverdueBase(MemberLoanAccount $account, string $asOfDate): float
    {
        $schedules = $account->schedules()->whereDate('due_date', '<', $asOfDate)->get();
        $base = 0;

        foreach ($schedules as $schedule) {
            $base += max((float) $schedule->scheduled_principal - (float) $schedule->paid_principal, 0);
            $base += max((float) $schedule->accrued_interest - (float) $schedule->paid_interest, 0);
            $base += max((float) $schedule->overdue_interest - (float) $schedule->paid_overdue_interest, 0);
        }

        return round($base, 2);
    }

    private function computeScheduleStatus(MemberLoanSchedule $schedule, string $asOfDate, bool $duringAccrual = false): string
    {
        $remainingPrincipal = max((float) $schedule->scheduled_principal - (float) $schedule->paid_principal, 0);
        $remainingInterest = max((float) $schedule->accrued_interest - (float) $schedule->paid_interest, 0);
        $remainingOverdue = max((float) $schedule->overdue_interest - (float) $schedule->paid_overdue_interest, 0);

        if (($remainingPrincipal + $remainingInterest + $remainingOverdue) <= 0.009) {
            return 'paid';
        }

        if ((float) $schedule->paid_principal > 0 || (float) $schedule->paid_interest > 0 || (float) $schedule->paid_overdue_interest > 0) {
            return 'partial';
        }

        if (Carbon::parse($schedule->due_date)->lt(Carbon::parse($asOfDate)) || $duringAccrual) {
            return 'overdue';
        }

        return 'pending';
    }

    private function computeAccountStatus(MemberLoanAccount $account, string $asOfDate): string
    {
        if ((float) $account->total_outstanding <= 0.009) {
            return 'closed';
        }

        $hasOverdue = $account->schedules()
            ->whereDate('due_date', '<', $asOfDate)
            ->where(function ($query) {
                $query->whereColumn('paid_principal', '<', 'scheduled_principal')
                    ->orWhereColumn('paid_interest', '<', 'accrued_interest')
                    ->orWhereColumn('paid_overdue_interest', '<', 'overdue_interest');
            })
            ->exists();

        return $hasOverdue || (float) $account->overdue_interest_balance > 0 ? 'overdue' : 'active';
    }

    private function allocateSchedulePayments(MemberLoanAccount $account, float $overdue, float $interest, float $principal, string $paymentDate): void
    {
        $schedules = $account->schedules()->orderBy('due_date')->orderBy('schedule_no')->get();

        foreach ($schedules as $schedule) {
            if ($overdue > 0) {
                $due = max((float) $schedule->overdue_interest - (float) $schedule->paid_overdue_interest, 0);
                if ($due > 0) {
                    $pay = min($overdue, $due);
                    $schedule->paid_overdue_interest = round((float) $schedule->paid_overdue_interest + $pay, 2);
                    $overdue = round($overdue - $pay, 2);
                }
            }

            if ($interest > 0) {
                $due = max((float) $schedule->accrued_interest - (float) $schedule->paid_interest, 0);
                if ($due > 0) {
                    $pay = min($interest, $due);
                    $schedule->paid_interest = round((float) $schedule->paid_interest + $pay, 2);
                    $interest = round($interest - $pay, 2);
                }
            }

            if ($principal > 0) {
                $due = max((float) $schedule->scheduled_principal - (float) $schedule->paid_principal, 0);
                if ($due > 0) {
                    $pay = min($principal, $due);
                    $schedule->paid_principal = round((float) $schedule->paid_principal + $pay, 2);
                    $principal = round($principal - $pay, 2);
                }
            }

            $schedule->last_payment_date = $paymentDate;
            $schedule->status = $this->computeScheduleStatus($schedule, $paymentDate);
            $schedule->save();

            if ($overdue <= 0 && $interest <= 0 && $principal <= 0) {
                break;
            }
        }
    }

    private function postDisbursementAccounting(MemberLoanAccount $account, Product $product, float $amount, string $tranDate, string $batchNum, ?string $remarks): void
    {
        $common = $this->baseJournalData($account, $product, $tranDate, $batchNum, 'MLDIS', 'MemberLoanDisbursement', $remarks ?: 'Member loan disbursement');

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->gl_loan_outstanding_id,
            'dr_amt' => $amount,
            'cr_amt' => 0,
            'naration' => ($remarks ?: 'Member loan disbursement') . ' (Loan Outstanding)',
        ]));

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->gl_loan_disbursement_id,
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
                'glac_id' => $product->gl_loan_outstanding_id,
                'dr_amt' => $interest,
                'cr_amt' => 0,
                'naration' => 'Member loan interest receivable accrued',
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->gl_profit_id,
                'dr_amt' => 0,
                'cr_amt' => $interest,
                'naration' => 'Member loan interest income accrued',
            ]));
        }

        if ($overdue > 0) {
            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->gl_loan_outstanding_id,
                'dr_amt' => $overdue,
                'cr_amt' => 0,
                'naration' => 'Member loan overdue interest receivable accrued',
            ]));

            Transaction::create(array_merge($common, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $product->gl_penalty_id,
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
            'glac_id' => $product->gl_loan_disbursement_id,
            'dr_amt' => $amount,
            'cr_amt' => 0,
            'naration' => ($remarks ?: 'Member loan repayment') . ' (Cash/Bank Collection)',
        ]));

        Transaction::create(array_merge($common, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $product->gl_loan_outstanding_id,
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
            !$product->gl_loan_outstanding_id ||
            !$product->gl_loan_disbursement_id ||
            !$product->gl_profit_id ||
            !$product->gl_penalty_id
        ) {
            throw new \RuntimeException('Member loan product GL configuration is incomplete.');
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
