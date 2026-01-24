<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoanApplication;
use App\Models\LoanAccount;
use App\Models\Transaction;
use App\Models\GlAccount;
use App\Models\GlMstMapping;
use App\Helpers\BalanceHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LoanDisbursementController extends Controller
{
    // List approved loans ready for disbursement
    public function index(Request $request)
    {
        $query = LoanApplication::with(['member', 'product', 'samity'])
            ->where('status', 'approved')
            ->latest();

        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        return response()->json($query->paginate(20));
    }

    // Process disbursement
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'loan_id' => 'required|exists:loan_applications,id',
            'disbursed_date' => 'required|date',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $loan = LoanApplication::with(['product', 'schedules', 'member'])->find($request->loan_id);

        if ($loan->status !== 'approved') {
            return response()->json(['message' => 'Loan is not in approved status'], 400);
        }

        // Validate Product GL Configuration
        if (!$loan->product->gl_loan_outstanding_id || !$loan->product->gl_loan_disbursement_id) {
            return response()->json(['message' => 'Product GL configuration incomplete. Please set Loan Outstanding (Dr) and Disbursement (Cr) GLs.'], 400);
        }

        // Check Balance for Disbursement Source (Cr GL) - Only for Asset Accounts (Type 1)
        $sourceGlId = $loan->product->gl_loan_disbursement_id;
        $sourceGl = GlAccount::find($sourceGlId);
        
        // If Source is Asset (1), we need to ensure enough balance (Dr - Cr) exists before Crediting (reducing) it.
        if ($sourceGl && $sourceGl->glac_type == 1) {
             $availableBalance = BalanceHelper::getBalance($sourceGlId, $loan->samity_id);
             if ($availableBalance < $loan->amount) {
                 return response()->json([
                     'message' => 'Insufficient balance in disbursement source account (Credit GL).',
                     'available_balance' => $availableBalance,
                     'required_amount' => $loan->amount
                 ], 422);
             }
        }

        try {
            DB::beginTransaction();

            // 1. Update Loan Status
            $loan->status = 'disbursed';
            $loan->disbursed_date = $request->disbursed_date;
            $loan->save();

            // Create Loan Account
            $totalPrincipal = 0;
            $totalInterest = 0;
            
            if ($loan->schedules->count() > 0) {
                $totalPrincipal = $loan->schedules->sum('principal_amount');
                $totalInterest = $loan->schedules->sum('interest_amount');
            } else {
                $totalPrincipal = $loan->amount;
                $totalInterest = ($loan->amount * $loan->interest_rate / 100) * ($loan->duration_months / 12);
            }

            $totalPayable = $totalPrincipal + $totalInterest;

            // Generate Account No: LN-{MemberCode}-{ID}
            $accountNo = 'LN-' . $loan->member->member_code . '-' . str_pad($loan->id, 4, '0', STR_PAD_LEFT);

            LoanAccount::create([
                'loan_application_id' => $loan->id,
                'member_id' => $loan->member_id,
                'account_no' => $accountNo,
                'principal_amount' => $totalPrincipal,
                'interest_amount' => $totalInterest,
                'total_payable' => $totalPayable,
                'current_balance' => $totalPayable,
                'total_paid' => 0,
                'principal_paid' => 0,
                'interest_paid' => 0,
                'disbursed_date' => $request->disbursed_date,
                'status' => 'active'
            ]);

            // 2. Generate Batch
            $batch = 'LD' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            // Common Transaction Data
            $commonData = [
                'samity_id' => $loan->samity_id,
                'customer_id' => $loan->member_id,
                'product_id' => $loan->product_id,
                'payment_mode' => 'cash',
                'batch_num' => $batch,
                'tran_code' => 'DIS', // Disbursement
                'tran_type' => 'LoanDisbursement',
                'tran_date' => $request->disbursed_date,
                'naration' => $request->naration ?? 'Loan Disbursement',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'status' => 'posted'
            ];

            // 3. Create Transactions
            // Debit: Loan Portfolio (Asset) - Increases
            // Use Product's Loan Outstanding GL (Dr GL)
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $loan->product->gl_loan_outstanding_id,
                'dr_amt' => $loan->amount,
                'cr_amt' => 0,
                'naration' => ($request->naration ?? 'Loan Disbursement') . ' (Loan Outstanding)',
            ]));

            // Credit: Cash/Bank (Asset) - Decreases
            // Use Product's Loan Disbursement GL (Cr GL)
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $loan->product->gl_loan_disbursement_id,
                'dr_amt' => 0,
                'cr_amt' => $loan->amount,
                'naration' => ($request->naration ?? 'Loan Disbursement') . ' (Disbursement Source)',
            ]));

            DB::commit();
            return response()->json(['message' => 'Loan disbursed successfully', 'batch' => $batch]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Disbursement failed: ' . $e->getMessage()], 500);
        }
    }
}
