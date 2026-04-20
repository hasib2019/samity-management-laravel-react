<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberInfo;
use App\Models\ProjectDeclaration;
use App\Models\ProjectInvestor;
use App\Models\ProjectShareTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProjectShareSaleController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectShareTransaction::with(['project', 'member', 'investor'])
            ->orderByDesc('id');

        if ($request->filled('project_declaration_id')) {
            $query->where('project_declaration_id', $request->project_declaration_id);
        }

        if ($request->filled('tran_type')) {
            $query->where('tran_type', $request->tran_type);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_declaration_id' => 'required|exists:project_declarations,id',
            'member_id' => 'required|exists:member_infos,id',
            'tran_date' => 'required|date',
            'share_qty' => 'required|numeric|min:1',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $project = ProjectDeclaration::findOrFail($request->project_declaration_id);
            $member = MemberInfo::findOrFail($request->member_id);

            if ($project->status !== 'active') {
                throw new \Exception('Only active projects can sell shares.');
            }

            if (!$project->samity_id) {
                throw new \Exception('Project samity is not set. Update the project declaration first.');
            }

            if ((int) $member->samity_id !== (int) $project->samity_id) {
                throw new \Exception('Selected member does not belong to the project samity.');
            }

            if ($project->available_share_qty < $request->share_qty) {
                throw new \Exception('Requested shares exceed available project shares.');
            }

            $this->assertSaleAccountingSetup($project);

            $amount = round($request->share_qty * $project->share_price, 2);
            $batchNum = $this->generateBatchNum('PJS');

            $investor = ProjectInvestor::firstOrCreate(
                [
                    'project_declaration_id' => $project->id,
                    'member_id' => $member->id,
                ],
                [
                    'samity_id' => $project->samity_id,
                    'created_by' => Auth::id(),
                ]
            );

            $investor->increment('purchased_shares', $request->share_qty);
            $investor->increment('invested_amount', $amount);
            $investor->update([
                'samity_id' => $project->samity_id,
                'status' => 'active',
                'updated_by' => Auth::id(),
            ]);

            $sale = ProjectShareTransaction::create([
                'project_declaration_id' => $project->id,
                'project_investor_id' => $investor->id,
                'member_id' => $member->id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'purchase',
                'share_qty' => $request->share_qty,
                'rate' => $project->share_price,
                'amount' => $amount,
                'batch_num' => $batchNum,
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            $project->increment('sold_share_qty', $request->share_qty);
            $project->increment('sold_amount', $amount);
            $project->decrement('available_share_qty', $request->share_qty);

            $this->postSaleTransactions($project, $member, $amount, $request->tran_date, $batchNum);

            DB::commit();

            return response()->json([
                'message' => 'Project share sale recorded successfully',
                'data' => $sale->load(['project', 'member', 'investor']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record project share sale',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function assertSaleAccountingSetup(ProjectDeclaration $project): void
    {
        if (!$project->cash_gl_id || !$project->investor_fund_gl_id || !$project->investment_gl_id) {
            throw new \Exception('Project GL setup is incomplete. Cash, investor fund and investment GL are required.');
        }
    }

    private function postSaleTransactions(ProjectDeclaration $project, MemberInfo $member, float $amount, string $tranDate, string $batchNum): void
    {
        $commonData = [
            'samity_id' => $project->samity_id,
            'customer_id' => $member->id,
            'product_id' => null,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => 'PJS',
            'tran_type' => 'PROJECT_SHARE_SALE',
            'tran_date' => $tranDate,
            'status' => 'posted',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => now(),
            'created_by' => Auth::id(),
        ];

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->cash_gl_id,
            'naration' => "Project share collection - {$project->project_code}",
            'dr_amt' => $amount,
            'cr_amt' => 0,
        ]));

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->investor_fund_gl_id,
            'naration' => "Investor fund liability - {$project->project_code}",
            'dr_amt' => 0,
            'cr_amt' => $amount,
        ]));

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->investment_gl_id,
            'naration' => "Project investment deployment - {$project->project_code}",
            'dr_amt' => $amount,
            'cr_amt' => 0,
        ]));

        Transaction::create(array_merge($commonData, [
            'tran_num' => $this->generateTranNum(),
            'glac_id' => $project->cash_gl_id,
            'naration' => "Cash transferred to project investment - {$project->project_code}",
            'dr_amt' => 0,
            'cr_amt' => $amount,
        ]));
    }

    private function generateBatchNum(string $prefix): string
    {
        do {
            $batchNum = $prefix . str_pad((string) mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (ProjectShareTransaction::where('batch_num', $batchNum)->exists());

        return $batchNum;
    }

    private function generateTranNum(): string
    {
        return date('YmdHis') . mt_rand(10, 99);
    }
}
