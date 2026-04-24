<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShareAccount;
use App\Models\ShareTransaction;
use App\Models\MemberInfo;
use App\Models\Product;
use App\Models\Transaction;
use App\Services\ShareManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ShareManagementController extends Controller
{
    /**
     * List share accounts
     */
    public function index(Request $request)
    {
        $query = ShareAccount::with(['member', 'product']);

        if ($request->member_id) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Share Purchase
     */
    public function purchase(Request $request, ShareManagementService $shareManagementService)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'member_id' => 'required|exists:member_infos,id',
            'product_id' => 'required|exists:product_mst,id',
            'tran_date' => 'required|date',
            'quantity' => 'required|numeric|min:1',
            'face_value' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $member = MemberInfo::findOrFail($request->member_id);
            if ((int) $member->samity_id !== (int) $request->samity_id) {
                throw new \Exception('Selected member does not belong to the selected samity.');
            }

            $shareManagementService->recordPurchase(
                $member,
                (int) $request->product_id,
                $request->tran_date,
                (int) $request->quantity,
                $request->remarks,
                (float) $request->face_value
            );

            DB::commit();
            return response()->json(['message' => 'Share purchase recorded successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record purchase', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Share Sale
     */
    public function sale(Request $request, ShareManagementService $shareManagementService)
    {
        $validator = Validator::make($request->all(), [
            'share_account_id' => 'required|exists:share_accounts,id',
            'tran_date' => 'required|date',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $shareAccount = ShareAccount::with('member')->findOrFail($request->share_account_id);
            
            if ($shareAccount->total_shares < $request->quantity) {
                throw new \Exception("Insufficient shares. Current balance: " . $shareAccount->total_shares);
            }

            $totalAmount = $request->quantity * $shareAccount->face_value;

            // 1. Create Transaction
            ShareTransaction::create([
                'share_account_id' => $shareAccount->id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'sale',
                'quantity' => $request->quantity,
                'face_value' => $shareAccount->face_value,
                'amount' => $totalAmount,
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            // 2. Update Balance
            $shareAccount->decrement('total_shares', $request->quantity);
            $shareAccount->decrement('current_balance', $totalAmount);

            // 3. Accounting
            // Dr. Share Capital
            // Cr. Cash/Bank
            $product = $shareAccount->product;

            // Generate Batch
            $batch = 'SHS' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            $commonData = [
                'samity_id' => $shareAccount->member->samity_id,
                'customer_id' => $shareAccount->member_id,
                'product_id' => $shareAccount->product_id,
                'payment_mode' => 'cash',
                'batch_num' => $batch,
                'tran_code' => 'SAL',
                'tran_date' => $request->tran_date,
                'tran_type' => 'SHARE_SALE',
                'naration' => $request->remarks ?? "Share Sale from " . $shareAccount->account_no,
                'status' => 'posted',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
            ];

            // Dr. Share Capital
            $shareGlId = $product->shr_capital_cr_gl_id;
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $shareGlId,
                'dr_amt' => $totalAmount,
                'cr_amt' => 0,
            ]));

            // Cr. Cash
            $cashGlId = $product->shr_cash_bank_dr_gl_id;
            if (!$cashGlId) throw new \Exception("Cash/Bank GL is not mapped for share product");

            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => 0,
                'cr_amt' => $totalAmount,
            ]));

            $shareManagementService->syncMemberShareSnapshot($shareAccount->member_id);

            DB::commit();
            return response()->json(['message' => 'Share sale recorded successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record sale', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Share Transfer
     */
    public function transfer(Request $request, ShareManagementService $shareManagementService)
    {
        $validator = Validator::make($request->all(), [
            'from_account_id' => 'required|exists:share_accounts,id',
            'to_account_id' => 'required|exists:share_accounts,id|different:from_account_id',
            'tran_date' => 'required|date',
            'quantity' => 'required|numeric|min:1',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $fromAccount = ShareAccount::with(['member', 'product'])->findOrFail($request->from_account_id);
            $toAccount = ShareAccount::with(['member', 'product'])->findOrFail($request->to_account_id);

            if ($fromAccount->total_shares < $request->quantity) {
                throw new \Exception("Insufficient shares in source account. Available: " . $fromAccount->total_shares);
            }

            $totalAmount = $request->quantity * $fromAccount->face_value;

            // 1. Record Outgoing Transaction
            ShareTransaction::create([
                'share_account_id' => $fromAccount->id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'transfer_out',
                'quantity' => $request->quantity,
                'face_value' => $fromAccount->face_value,
                'amount' => $totalAmount,
                'related_account_id' => $toAccount->id,
                'remarks' => $request->remarks ?? "Transfer to " . $toAccount->account_no,
                'created_by' => Auth::id(),
            ]);

            // 2. Record Incoming Transaction
            ShareTransaction::create([
                'share_account_id' => $toAccount->id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'transfer_in',
                'quantity' => $request->quantity,
                'face_value' => $fromAccount->face_value, // Use source face value
                'amount' => $totalAmount,
                'related_account_id' => $fromAccount->id,
                'remarks' => $request->remarks ?? "Transfer from " . $fromAccount->account_no,
                'created_by' => Auth::id(),
            ]);

            // 3. Update Balances
            $fromAccount->decrement('total_shares', $request->quantity);
            $fromAccount->decrement('current_balance', $totalAmount);

            $toAccount->increment('total_shares', $request->quantity);
            $toAccount->increment('current_balance', $totalAmount);

            // 4. Accounting Transactions (Optional if same GL, but good for tracking)
            // Typically Share Transfer doesn't affect Cash, just shifts liability between customers.
            // If they have different Products with different GLs, we need a move.
            
            if ($fromAccount->product->shr_capital_cr_gl_id != $toAccount->product->shr_capital_cr_gl_id) {
                $batch = 'SHT' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
                $commonData = [
                    'tran_date' => $request->tran_date,
                    'tran_type' => 'SHARE_TRANSFER',
                    'batch_num' => $batch,
                    'status' => 'posted',
                    'authorize_status' => 'approved',
                    'authorized_by' => Auth::id(),
                    'authorized_at' => now(),
                    'created_by' => Auth::id(),
                ];

                // Dr. Source Share Capital (Decrease)
                Transaction::create(array_merge($commonData, [
                    'samity_id' => $fromAccount->member->samity_id,
                    'customer_id' => $fromAccount->member_id,
                    'product_id' => $fromAccount->product_id,
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $fromAccount->product->shr_capital_cr_gl_id,
                    'dr_amt' => $totalAmount,
                    'cr_amt' => 0,
                    'naration' => "Share Transfer Out to " . $toAccount->account_no,
                ]));

                // Cr. Destination Share Capital (Increase)
                Transaction::create(array_merge($commonData, [
                    'samity_id' => $toAccount->member->samity_id,
                    'customer_id' => $toAccount->member_id,
                    'product_id' => $toAccount->product_id,
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $toAccount->product->shr_capital_cr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $totalAmount,
                    'naration' => "Share Transfer In from " . $fromAccount->account_no,
                ]));
            }

            $shareManagementService->syncMemberShareSnapshot($fromAccount->member_id);
            $shareManagementService->syncMemberShareSnapshot($toAccount->member_id);

            DB::commit();
            return response()->json(['message' => 'Share transfer recorded successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record transfer', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Search Share Account
     */
    public function search(Request $request)
    {
        $query = $request->input('query');
        $account = ShareAccount::with(['member', 'product'])
            ->where('status', 'active')
            ->where(function($q) use ($query) {
                $q->where('account_no', 'like', "%$query%")
                  ->orWhereHas('member', function($sq) use ($query) {
                      $sq->where('member_code', 'like', "%$query%")
                        ->orWhere('member_name', 'like', "%$query%");
                  });
            })
            ->first();

        if (!$account) {
            return response()->json(['message' => 'Share account not found'], 404);
        }

        return response()->json($account);
    }
}
