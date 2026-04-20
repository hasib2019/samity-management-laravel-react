<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShareAccount;
use App\Models\ShareTransaction;
use App\Models\MemberInfo;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\GlMstMapping;
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
    public function purchase(Request $request)
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

            $totalAmount = $request->quantity * $request->face_value;

            // 1. Get or Create Share Account
            $shareAccount = ShareAccount::firstOrCreate(
                ['member_id' => $request->member_id, 'product_id' => $request->product_id],
                [
                    'account_no' => 'SH-' . date('Ymd') . '-' . rand(1000, 9999),
                    'face_value' => $request->face_value,
                    'created_by' => Auth::id()
                ]
            );

            // 2. Create Share Transaction
            ShareTransaction::create([
                'share_account_id' => $shareAccount->id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'purchase',
                'quantity' => $request->quantity,
                'face_value' => $request->face_value,
                'amount' => $totalAmount,
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            // 3. Update Account Balance
            $shareAccount->increment('total_shares', $request->quantity);
            $shareAccount->increment('current_balance', $totalAmount);

            // 4. Accounting Transactions
            // Dr. Cash/Bank (Asset Increase)
            // Cr. Share Capital (Liability/Equity Increase)
            
            $product = Product::findOrFail($request->product_id);
            $commonData = [
                'branch_id' => 1,
                'samity_id' => $request->samity_id,
                'customer_id' => $request->member_id,
                'product_id' => $request->product_id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'SHARE_PURCHASE',
                'naration' => $request->remarks ?? "Share Purchase for " . $shareAccount->account_no,
                'status' => 'posted',
                'created_by' => Auth::id(),
            ];

            // Dr. Cash
            $cashGlMap = GlMstMapping::where('gl_code_type', 'CASH_IN_HAND')->first();
            $cashGlId = $cashGlMap ? $cashGlMap->gl_mst_id : null;
            if (!$cashGlId) throw new \Exception("Cash GL Mapping not found");

            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => $totalAmount,
                'cr_amt' => 0,
            ]));

            // Cr. Share Capital
            $shareGlId = $product->gl_principal_id; // Mapping to Principal GL for Share products
            if (!$shareGlId) throw new \Exception("Share Capital GL not mapped for product");

            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $shareGlId,
                'dr_amt' => 0,
                'cr_amt' => $totalAmount,
            ]));

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
    public function sale(Request $request)
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
            $commonData = [
                'branch_id' => 1,
                'samity_id' => $shareAccount->member->samity_id,
                'customer_id' => $shareAccount->member_id,
                'product_id' => $shareAccount->product_id,
                'tran_date' => $request->tran_date,
                'tran_type' => 'SHARE_SALE',
                'naration' => $request->remarks ?? "Share Sale from " . $shareAccount->account_no,
                'status' => 'posted',
                'created_by' => Auth::id(),
            ];

            // Dr. Share Capital
            $shareGlId = $product->gl_principal_id;
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $shareGlId,
                'dr_amt' => $totalAmount,
                'cr_amt' => 0,
            ]));

            // Cr. Cash
            $cashGlMap = GlMstMapping::where('gl_code_type', 'CASH_IN_HAND')->first();
            $cashGlId = $cashGlMap ? $cashGlMap->gl_mst_id : null;
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => 0,
                'cr_amt' => $totalAmount,
            ]));

            DB::commit();
            return response()->json(['message' => 'Share sale recorded successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to record sale', 'error' => $e->getMessage()], 500);
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
