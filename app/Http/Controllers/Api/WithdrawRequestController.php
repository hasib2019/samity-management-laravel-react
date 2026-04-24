<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WithdrawRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SavingsAccount;
use App\Models\Transaction;
use App\Models\MemberInfo;

class WithdrawRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = WithdrawRequest::with(['member', 'savingsAccount']);
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }
        $requests = $query->latest()->get();
        return response()->json($requests);
    }

    public function show($id)
    {
        $request = WithdrawRequest::with(['member', 'savingsAccount'])->find($id);
        if (!$request) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }
        return response()->json($request);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'savings_account_id' => 'required|exists:savings_accounts,id',
            'amount' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'charge' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'attachment' => 'nullable|string',
            'status' => 'required|in:pending,approved,rejected,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $data = $request->all();
            if (!isset($data['total_amount'])) {
                $data['total_amount'] = $data['amount'];
            }

            $savingsAccount = SavingsAccount::with('product')->find($data['savings_account_id']);
            if (!$savingsAccount) {
                return response()->json(['message' => 'Savings account not found'], 404);
            }
            $minBalance = $savingsAccount->product->min_amount ?? 0;
            $available = (float) $savingsAccount->current_balance - (float) $minBalance;
            if ($available < 0) { $available = 0; }
            if ((float) $data['amount'] > $available) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Insufficient balance',
                    'details' => [
                        'current_balance' => (float) $savingsAccount->current_balance,
                        'required_min_balance' => (float) $minBalance,
                        'available_to_withdraw' => (float) $available,
                    ]
                ], 422);
            }

            $withdrawRequest = WithdrawRequest::create($data);

            if ($request->status === 'approved') {
                $this->processApproval($withdrawRequest);
            }

            DB::commit();

            return response()->json(['message' => 'Withdraw request created successfully', 'data' => $withdrawRequest], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $withdrawRequest = WithdrawRequest::find($id);
        if (!$withdrawRequest) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'member_id' => 'sometimes|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'savings_account_id' => 'nullable|exists:savings_accounts,id',
            'amount' => 'sometimes|numeric|min:0',
            'converted_amount' => 'nullable|numeric|min:0',
            'charge' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'attachment' => 'nullable|string',
            'status' => 'sometimes|string|in:pending,approved,rejected,cancelled',
            'transaction_id' => 'nullable|exists:transactions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            if ($request->status === 'approved' && $withdrawRequest->status !== 'approved') {
                $this->processApproval($withdrawRequest);
            }

            $withdrawRequest->update($request->all());

            DB::commit();

            return response()->json(['message' => 'Withdraw request updated successfully', 'data' => $withdrawRequest]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $withdrawRequest = WithdrawRequest::find($id);
        if (!$withdrawRequest) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }
        $withdrawRequest->delete();
        return response()->json(['message' => 'Withdraw request deleted successfully']);
    }

    private function processApproval(WithdrawRequest $withdrawRequest)
    {
        $savingsAccount = SavingsAccount::with('product')->find($withdrawRequest->savings_account_id);
        $product = $savingsAccount->product;

        // Get Member to fetch samity_id
        $member = MemberInfo::find($withdrawRequest->member_id);

        if (!$product || !$product->sav_dep_lib_cr_gl_id || !$product->sav_cash_bank_dr_gl_id) {
            throw new \Exception('Savings product GL Mapping (Deposit Liability Cr / Cash Bank Dr) is missing.');
        }

        $minBalance = $product->min_amount ?? 0;
        $available = (float) $savingsAccount->current_balance - (float) $minBalance;
        if ($available < 0) { $available = 0; }
        if ((float) $withdrawRequest->amount > $available) {
            throw new \Exception('Insufficient balance for approval. Available: ' . $available . ', Required min balance: ' . (float) $minBalance);
        }

        do {
            $batchNum = 'sav' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Transaction::where('batch_num', $batchNum)->exists());

        $commonData = [
            'samity_id' => $member ? $member->samity_id : null,
            'customer_id' => $withdrawRequest->member_id,
            'product_id' => $product->id,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => 'WIT',
            'tran_type' => 'Withdraw',
            'tran_date' => date('Y-m-d'),
            'naration' => 'Withdraw Request Approved',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => date('Y-m-d'),
            'created_by' => Auth::id(),
            'status' => 'posted',
        ];

        $tranNumDr = date('YmdHis') . rand(10, 99);
        Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumDr,
            'glac_id' => $product->sav_dep_lib_cr_gl_id,
            'dr_amt' => $withdrawRequest->amount,
            'cr_amt' => 0,
        ]));

        $tranNumCr = date('YmdHis') . rand(10, 99);
        $creditTransaction = Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumCr,
            'glac_id' => $product->sav_cash_bank_dr_gl_id,
            'dr_amt' => 0,
            'cr_amt' => $withdrawRequest->amount,
        ]));

        $withdrawRequest->transaction_id = $creditTransaction->id;
        $withdrawRequest->save();

        $savingsAccount->decrement('current_balance', $withdrawRequest->amount);
    }
}
