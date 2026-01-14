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

class WithdrawRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = WithdrawRequest::with(['member', 'debitAccount']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $withdrawRequests = $query->latest()->get();
        return response()->json($withdrawRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'debit_account_id' => 'required|exists:savings_accounts,id',
            'amount' => 'required|numeric|min:0',
            'converted_amount' => 'nullable|numeric|min:0',
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

            if (!isset($data['converted_amount'])) {
                $data['converted_amount'] = $data['amount'];
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

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $withdrawRequest = WithdrawRequest::with(['member', 'debitAccount'])->find($id);

        if (!$withdrawRequest) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }

        return response()->json($withdrawRequest);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $withdrawRequest = WithdrawRequest::find($id);

        if (!$withdrawRequest) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'member_id' => 'sometimes|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'debit_account_id' => 'nullable|exists:savings_accounts,id',
            'amount' => 'sometimes|numeric|min:0',
            'converted_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'attachment' => 'nullable|string',
            'status' => 'sometimes|string|in:pending,approved,rejected',
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $withdrawRequest = WithdrawRequest::find($id);

        if (!$withdrawRequest) {
            return response()->json(['message' => 'Withdraw request not found'], 404);
        }

        $withdrawRequest->delete();

        return response()->json(['message' => 'Withdraw request deleted successfully']);
    }

    /**
     * Process the approval of a withdraw request.
     */
    private function processApproval(WithdrawRequest $withdrawRequest): void
    {
        $savingsAccount = SavingsAccount::with('product')->find($withdrawRequest->debit_account_id);
        $product = $savingsAccount->product;

        if (!$product || !$product->gl_income_id || !$product->gl_expense_id) {
            throw new \Exception('Product GL Mapping (Income/Expense) is missing.');
        }

        if ($savingsAccount->current_balance < $withdrawRequest->amount) {
            throw new \Exception('Insufficient balance for withdrawal.');
        }

        do {
            $batchNum = 'sav' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Transaction::where('batch_num', $batchNum)->exists());

        $commonData = [
            'customer_id' => $savingsAccount->id,
            'product_id' => $product->id,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => 'WDR',
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
            'glac_id' => $product->gl_income_id,
            'dr_amt' => $withdrawRequest->amount,
            'cr_amt' => 0,
        ]));

        $tranNumCr = date('YmdHis') . rand(10, 99);
        $creditTransaction = Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumCr,
            'glac_id' => $product->gl_expense_id,
            'dr_amt' => 0,
            'cr_amt' => $withdrawRequest->amount,
        ]));

        $withdrawRequest->transaction_id = $creditTransaction->id;
        $withdrawRequest->save();

        $savingsAccount->decrement('current_balance', $withdrawRequest->amount);
    }
}

