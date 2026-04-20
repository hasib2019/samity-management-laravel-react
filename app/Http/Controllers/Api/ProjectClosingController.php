<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectClosing;
use App\Models\ProjectDeclaration;
use App\Models\ProjectShareTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProjectClosingController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectClosing::with('project')->orderByDesc('id');

        if ($request->filled('project_declaration_id')) {
            $query->where('project_declaration_id', $request->project_declaration_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_declaration_id' => 'required|exists:project_declarations,id',
            'closing_date' => 'required|date',
            'closing_value' => 'required|numeric|min:0.01',
            'closing_expense' => 'nullable|numeric|min:0',
            'distributable_profit' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $project = ProjectDeclaration::with(['investors.member', 'closing'])->findOrFail($request->project_declaration_id);

            if ($project->status !== 'active') {
                throw new \Exception('Only active projects can be closed.');
            }

            if ($project->closing) {
                throw new \Exception('This project has already been closed.');
            }

            if ($project->investors->isEmpty()) {
                throw new \Exception('No investors found for this project.');
            }

            $this->assertClosingAccountingSetup($project);

            $closingExpense = (float) ($request->closing_expense ?? 0);
            $totalInvested = (float) $project->sold_amount;
            $closingValue = (float) $request->closing_value;
            $netProfit = round($closingValue - $totalInvested - $closingExpense, 2);

            if ($netProfit < 0) {
                throw new \Exception('Current version supports profit closing only. Closing value must cover invested amount and expenses.');
            }

            $distributableProfit = round((float) ($request->distributable_profit ?? $netProfit), 2);
            if ($distributableProfit > $netProfit) {
                throw new \Exception('Distributable profit cannot exceed net profit.');
            }

            $samityIncome = round($netProfit - $distributableProfit, 2);
            $batchNum = $this->generateBatchNum();

            $closing = ProjectClosing::create([
                'project_declaration_id' => $project->id,
                'closing_date' => $request->closing_date,
                'total_invested' => $totalInvested,
                'closing_value' => $closingValue,
                'closing_expense' => $closingExpense,
                'net_profit' => $netProfit,
                'distributable_profit' => $distributableProfit,
                'samity_income' => $samityIncome,
                'total_investors' => $project->investors->count(),
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            $this->distributeProfitAndRefund($project, $request->closing_date, $distributableProfit, $batchNum);
            $this->postClosingTransactions($project, $request->closing_date, $closingValue, $totalInvested, $netProfit, $distributableProfit, $samityIncome, $batchNum);

            $project->update([
                'closing_date' => $request->closing_date,
                'closing_value' => $closingValue,
                'closing_expense' => $closingExpense,
                'net_profit' => $netProfit,
                'distributable_profit' => $distributableProfit,
                'samity_income' => $samityIncome,
                'status' => 'closed',
                'closed_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Project closed successfully',
                'data' => $closing->load('project'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to close project',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function distributeProfitAndRefund(ProjectDeclaration $project, string $closingDate, float $distributableProfit, string $batchNum): void
    {
        $investors = $project->investors->sortBy('id')->values();
        $totalInvested = (float) $project->sold_amount;
        $distributedSoFar = 0.0;
        $lastIndex = $investors->count() - 1;

        foreach ($investors as $index => $investor) {
            $profitShare = 0.0;

            if ($distributableProfit > 0 && $totalInvested > 0) {
                if ($index === $lastIndex) {
                    $profitShare = round($distributableProfit - $distributedSoFar, 2);
                } else {
                    $profitShare = round(($investor->invested_amount / $totalInvested) * $distributableProfit, 2);
                    $distributedSoFar += $profitShare;
                }
            }

            $refundAmount = (float) $investor->invested_amount;

            if ($profitShare > 0) {
                ProjectShareTransaction::create([
                    'project_declaration_id' => $project->id,
                    'project_investor_id' => $investor->id,
                    'member_id' => $investor->member_id,
                    'tran_date' => $closingDate,
                    'tran_type' => 'profit_distribution',
                    'share_qty' => 0,
                    'rate' => 0,
                    'amount' => $profitShare,
                    'batch_num' => $batchNum,
                    'remarks' => 'Profit distribution on project closing',
                    'created_by' => Auth::id(),
                ]);
            }

            ProjectShareTransaction::create([
                'project_declaration_id' => $project->id,
                'project_investor_id' => $investor->id,
                'member_id' => $investor->member_id,
                'tran_date' => $closingDate,
                'tran_type' => 'closing_refund',
                'share_qty' => 0,
                'rate' => 0,
                'amount' => $refundAmount,
                'batch_num' => $batchNum,
                'remarks' => 'Principal refund on project closing',
                'created_by' => Auth::id(),
            ]);

            $investor->update([
                'profit_amount' => round((float) $investor->profit_amount + $profitShare, 2),
                'refunded_amount' => round((float) $investor->refunded_amount + $refundAmount, 2),
                'status' => 'closed',
                'updated_by' => Auth::id(),
            ]);
        }
    }

    private function postClosingTransactions(
        ProjectDeclaration $project,
        string $closingDate,
        float $closingValue,
        float $totalInvested,
        float $netProfit,
        float $distributableProfit,
        float $samityIncome,
        string $batchNum
    ): void {
        $commonData = [
            'samity_id' => $project->samity_id,
            'customer_id' => null,
            'product_id' => null,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => 'PJC',
            'tran_type' => 'PROJECT_CLOSING',
            'tran_date' => $closingDate,
            'status' => 'posted',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => now(),
            'created_by' => Auth::id(),
        ];

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->cash_gl_id,
            'naration' => "Project closing value received - {$project->project_code}",
            'dr_amt' => $closingValue,
            'cr_amt' => 0,
        ]));

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->investment_gl_id,
            'naration' => "Project investment cleared - {$project->project_code}",
            'dr_amt' => 0,
            'cr_amt' => $totalInvested,
        ]));

        if ($netProfit > 0) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $project->profit_distribution_gl_id,
                'naration' => "Project profit realized - {$project->project_code}",
                'dr_amt' => 0,
                'cr_amt' => $netProfit,
            ]));
        }

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->investor_fund_gl_id,
            'naration' => "Investor fund settled - {$project->project_code}",
            'dr_amt' => $totalInvested,
            'cr_amt' => 0,
        ]));

        if ($distributableProfit > 0) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $project->profit_distribution_gl_id,
                'naration' => "Investor profit distributed - {$project->project_code}",
                'dr_amt' => $distributableProfit,
                'cr_amt' => 0,
            ]));
        }

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->cash_gl_id,
            'naration' => "Investor closing payout - {$project->project_code}",
            'dr_amt' => 0,
            'cr_amt' => round($totalInvested + $distributableProfit, 2),
        ]));

        if ($samityIncome > 0) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $project->profit_distribution_gl_id,
                'naration' => "Residual profit transferred - {$project->project_code}",
                'dr_amt' => $samityIncome,
                'cr_amt' => 0,
            ]));

            Transaction::create(array_merge($commonData, [
                'tran_num' => $this->generateTranNum(),
                'glac_id' => $project->samity_income_gl_id,
                'naration' => "Samity income on project closing - {$project->project_code}",
                'dr_amt' => 0,
                'cr_amt' => $samityIncome,
            ]));
        }
    }

    private function assertClosingAccountingSetup(ProjectDeclaration $project): void
    {
        if (
            !$project->samity_id ||
            !$project->investment_gl_id ||
            !$project->investor_fund_gl_id ||
            !$project->cash_gl_id ||
            !$project->profit_distribution_gl_id ||
            !$project->samity_income_gl_id
        ) {
            throw new \Exception('Project closing GL setup is incomplete.');
        }
    }

    private function generateBatchNum(): string
    {
        do {
            $batchNum = 'PJC' . str_pad((string) mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (ProjectShareTransaction::where('batch_num', $batchNum)->exists());

        return $batchNum;
    }

    private function generateTranNum(): string
    {
        return date('YmdHis') . mt_rand(10, 99);
    }
}
