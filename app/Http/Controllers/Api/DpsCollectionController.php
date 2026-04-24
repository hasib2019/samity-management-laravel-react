<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DpsApplication;
use App\Models\DpsInstallment;
use App\Models\GlMstMapping;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DpsCollectionController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string', // account_no or member_id
        ]);

        $query = $request->input('query');

        $dpsApplication = DpsApplication::with(['member', 'product', 'installments' => function($q) {
                $q->where('status', '!=', 'paid')->orderBy('due_date', 'asc');
            }])
            ->where('account_no', $query)
            ->orWhereHas('member', function($q) use ($query) {
                $q->where('member_code', $query); // Assuming member_code exists
            })
            ->first();

        if (!$dpsApplication) {
            return response()->json(['message' => 'DPS Account not found'], 404);
        }

        return response()->json($dpsApplication);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dps_application_id' => 'required|exists:dps_applications,id',
            'amount' => 'required|numeric|min:0',
            'tran_date' => 'required|date',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $dpsApplication = DpsApplication::with('product')->findOrFail($request->dps_application_id);
            $amount = $request->amount;
            $remainingAmount = $amount;
            $paidPrincipal = 0;
            $paidFine = 0;

            // Get pending installments
            $installments = DpsInstallment::where('dps_application_id', $dpsApplication->id)
                ->where('status', '!=', 'paid')
                ->orderBy('due_date', 'asc')
                ->get();

            foreach ($installments as $installment) {
                if ($remainingAmount <= 0) break;

                // Calculate required for this installment
                // Assuming fine is handled if overdue. For now, let's keep it simple.
                // If fine logic exists, add here.
                
                $dueAmount = $installment->amount - $installment->paid_amount;
                
                if ($remainingAmount >= $dueAmount) {
                    // Full payment of this installment
                    $payment = $dueAmount;
                    $installment->paid_amount += $payment;
                    $installment->status = 'paid';
                    $installment->paid_date = $request->tran_date;
                    $installment->save();

                    $remainingAmount -= $payment;
                    $paidPrincipal += $payment;
                } else {
                    // Partial payment
                    $payment = $remainingAmount;
                    $installment->paid_amount += $payment;
                    $installment->save(); // Status remains pending or partial? Using pending for now.

                    $remainingAmount = 0;
                    $paidPrincipal += $payment;
                }
            }

            // If still remaining, it's advance. Add to balance or create advance installment?
            // For DPS, usually extra amount goes to next installments or stays in balance.
            // Let's just update balance.
            
            if ($remainingAmount > 0) {
                 // Logic for advance/excess
                 // For now, just track it in total paid.
                 $paidPrincipal += $remainingAmount;
            }

            // Update Application Balance
            $dpsApplication->balance += $paidPrincipal;
            $dpsApplication->save();


            // GL Transactions
            $cashGlId = $dpsApplication->product->dps_cash_bank_dr_gl_id;
            if (!$cashGlId) {
                $cashMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
                $cashGlId = $cashMap ? $cashMap->gl_mst_id : null;
            }
            if (!$cashGlId) {
                 throw new \Exception("DPS Cash / Bank Dr GL not found");
            }

            $batch = 'DPS' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $commonData = [
                'samity_id' => $dpsApplication->member->samity_id ?? null, // Assuming member has samity
                'customer_id' => $dpsApplication->member_id,
                'product_id' => $dpsApplication->product_id,
                'payment_mode' => 'cash',
                'batch_num' => $batch,
                'tran_code' => 'DEP', 
                'tran_type' => 'DPSCollection',
                'tran_date' => $request->tran_date,
                'naration' => $request->naration ?? 'DPS Collection',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'status' => 'posted'
            ];

            // Debit Cash
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => $amount,
                'cr_amt' => 0,
            ]));

            // Credit DPS Principal (Liability)
            if ($dpsApplication->product->dps_dep_lib_cr_gl_id) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $dpsApplication->product->dps_dep_lib_cr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $amount, // Full amount credited to DPS account
                ]));
            } else {
                 throw new \Exception("DPS Deposit Liability Cr GL not defined");
            }

            DB::commit();

            return response()->json([
                'message' => 'Collection successful',
                'new_balance' => $dpsApplication->balance
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Collection failed: ' . $e->getMessage()], 500);
        }
    }
}
