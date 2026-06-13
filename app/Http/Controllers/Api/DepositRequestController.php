<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DepositRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\DB;
use App\Models\SavingsAccount;
use App\Models\Transaction;
use App\Models\MemberInfo;

class DepositRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DepositRequest::with(['member', 'savingsAccount']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $depositRequests = $query->latest()->get();
        return response()->json($depositRequests);
    }

    /**
     * Store a newly created resource in storage.
     */
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

            // Whitelist fields (never mass-assign status/transaction_id from input).
            $data = $request->only([
                'member_id', 'method_id', 'savings_account_id', 'amount',
                'total_amount', 'charge', 'description', 'requirements', 'attachment',
            ]);

            // Approval is privileged: a request may only be created already-approved
            // by a caller who holds the approve permission; otherwise it starts pending.
            $data['status'] = ($request->status === 'approved' && Auth::user()->can('deposit.request.approve'))
                ? 'approved'
                : 'pending';

            // Set default total_amount if not provided
            if (!isset($data['total_amount'])) {
                $data['total_amount'] = $data['amount'];
            }

            $depositRequest = DepositRequest::create($data);

            if ($data['status'] === 'approved') {
                $this->processApproval($depositRequest);
            }

            DB::commit();

            return response()->json(['message' => 'Deposit request created successfully', 'data' => $depositRequest], 201);

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
        $depositRequest = DepositRequest::with(['member', 'savingsAccount'])->find($id);

        if (!$depositRequest) {
            return response()->json(['message' => 'Deposit request not found'], 404);
        }

        return response()->json($depositRequest);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $depositRequest = DepositRequest::find($id);

        if (!$depositRequest) {
            return response()->json(['message' => 'Deposit request not found'], 404);
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
            'status' => 'sometimes|string|in:pending,approved,rejected',
            'transaction_id' => 'nullable|exists:transactions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Approving (the money-moving transition) requires the approve permission.
            $approving = $request->status === 'approved' && $depositRequest->status !== 'approved';
            if ($approving && ! Auth::user()->can('deposit.request.approve')) {
                DB::rollBack();
                return response()->json(['message' => 'You are not authorized to approve deposit requests.'], 403);
            }

            if ($approving) {
                $this->processApproval($depositRequest);
            }

            $depositRequest->update($request->only([
                'member_id', 'method_id', 'savings_account_id', 'amount',
                'converted_amount', 'charge', 'description', 'requirements', 'attachment', 'status',
            ]));

            DB::commit();

            return response()->json(['message' => 'Deposit request updated successfully', 'data' => $depositRequest]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Process the approval of a deposit request.
     */
    private function processApproval(DepositRequest $depositRequest)
    {
        $savingsAccount = SavingsAccount::with('product')->find($depositRequest->savings_account_id);
        $product = $savingsAccount->product;
        
        // Get Member to fetch samity_id
        $member = MemberInfo::find($depositRequest->member_id);

        if (!$product || !$product->sav_dep_lib_cr_gl_id || !$product->sav_cash_bank_dr_gl_id) {
            throw new \Exception('Savings product GL Mapping (Deposit Liability Cr / Cash Bank Dr) is missing.');
        }

        // Transaction Creation
        // Unique batch_num: sav+5digit
        do {
            $batchNum = 'sav' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Transaction::where('batch_num', $batchNum)->exists());

        $commonData = [
            'samity_id' => $member ? $member->samity_id : null,
            'customer_id' => $depositRequest->member_id,
            'product_id' => $product->id,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => 'DEP',
            'tran_type' => 'Deposit',
            'tran_date' => date('Y-m-d'),
            'naration' => 'Deposit Request Approved',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => date('Y-m-d'),
            'created_by' => Auth::id(),
            'status' => 'posted',
        ];

        // Debit Transaction (Using savings cash/bank dr GL)
        $tranNumDr = date('YmdHis') . rand(10, 99);
        Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumDr,
            'glac_id' => $product->sav_cash_bank_dr_gl_id,
            'dr_amt' => $depositRequest->amount,
            'cr_amt' => 0,
        ]));

        // Credit Transaction (Using savings deposit liability cr GL)
        $tranNumCr = date('YmdHis') . rand(10, 99);
        $creditTransaction = Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumCr,
            'glac_id' => $product->sav_dep_lib_cr_gl_id,
            'dr_amt' => 0,
            'cr_amt' => $depositRequest->amount,
        ]));

        $depositRequest->transaction_id = $creditTransaction->id;
        $depositRequest->save();

        // Update Savings Account Balance
        $savingsAccount->increment('current_balance', $depositRequest->amount);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $depositRequest = DepositRequest::find($id);

        if (!$depositRequest) {
            return response()->json(['message' => 'Deposit request not found'], 404);
        }

        $depositRequest->delete();

        return response()->json(['message' => 'Deposit request deleted successfully']);
    }
}
