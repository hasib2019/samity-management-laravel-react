<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoanApplication;
use App\Models\Transaction;
use App\Models\GlAccount;
use App\Models\GlMstMapping;
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
            'gl_account_id' => 'required|exists:gl_mst,id', // Source Account (Cash/Bank)
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $loan = LoanApplication::with('product')->find($request->loan_id);

        if ($loan->status !== 'approved') {
            return response()->json(['message' => 'Loan is not in approved status'], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Update Loan Status
            $loan->status = 'disbursed';
            $loan->disbursed_date = $request->disbursed_date;
            $loan->save();

            // 2. Generate Batch
            $batch = 'LD' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            // Common Transaction Data
            $commonData = [
                'samity_id' => $loan->samity_id,
                'customer_id' => $loan->member_id,
                'product_id' => $loan->product_id,
                'payment_mode' => 'cash', // Or check based on GL type
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
            // Use Product's Principal GL
            if (!$loan->product->gl_principal_id) {
                throw new \Exception("Product Principal GL not defined");
            }

            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $loan->product->gl_principal_id,
                'dr_amt' => $loan->amount,
                'cr_amt' => 0,
                'naration' => ($request->naration ?? 'Loan Disbursement') . ' (Principal)',
            ]));

            // Credit: Cash/Bank (Asset) - Decreases
            // Use User Selected Account
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $request->gl_account_id,
                'dr_amt' => 0,
                'cr_amt' => $loan->amount,
                'naration' => ($request->naration ?? 'Loan Disbursement') . ' (Source)',
            ]));

            DB::commit();
            return response()->json(['message' => 'Loan disbursed successfully', 'batch' => $batch]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Disbursement failed: ' . $e->getMessage()], 500);
        }
    }
}
