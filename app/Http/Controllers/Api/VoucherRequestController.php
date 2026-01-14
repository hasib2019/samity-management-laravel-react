<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoucherRequest;
use App\Models\VoucherGlMapping;
use App\Models\Type;
use App\Models\Transaction;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VoucherRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = VoucherRequest::with(['member', 'voucherType', 'transaction']);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('voucher_type_id')) {
            $query->where('voucher_type_id', $request->input('voucher_type_id'));
        }

        $voucherRequests = $query->latest()->get();

        return response()->json($voucherRequests);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'voucher_type_id' => 'required|exists:types,id',
            'member_id' => 'required|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'customer_account_id' => 'nullable|integer',
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

            $voucherRequest = VoucherRequest::create($data);

            if ($request->status === 'approved') {
                $this->processApproval($voucherRequest);
            }

            DB::commit();

            return response()->json(['message' => 'Voucher request created successfully', 'data' => $voucherRequest], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $voucherRequest = VoucherRequest::with(['member', 'voucherType', 'transaction'])->find($id);

        if (!$voucherRequest) {
            return response()->json(['message' => 'Voucher request not found'], 404);
        }

        return response()->json($voucherRequest);
    }

    public function update(Request $request, $id)
    {
        $voucherRequest = VoucherRequest::find($id);

        if (!$voucherRequest) {
            return response()->json(['message' => 'Voucher request not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'voucher_type_id' => 'sometimes|exists:types,id',
            'member_id' => 'sometimes|exists:member_infos,id',
            'method_id' => 'nullable|integer',
            'customer_account_id' => 'nullable|integer',
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

            if ($request->status === 'approved' && $voucherRequest->status !== 'approved') {
                $this->processApproval($voucherRequest);
            }

            $voucherRequest->update($request->all());

            DB::commit();

            return response()->json(['message' => 'Voucher request updated successfully', 'data' => $voucherRequest]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function processApproval(VoucherRequest $voucherRequest)
    {
        $voucherType = Type::find($voucherRequest->voucher_type_id);

        if (!$voucherType) {
            throw new \Exception('Voucher type not found.');
        }

        $mapping = VoucherGlMapping::where('voucher_type_id', $voucherRequest->voucher_type_id)->first();

        if (!$mapping) {
            throw new \Exception('Voucher GL Mapping is missing for this voucher type.');
        }

        do {
            $batchNum = 'vch' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Transaction::where('batch_num', $batchNum)->exists());

        $commonData = [
            'customer_id' => $voucherRequest->member_id,
            'product_id' => null,
            'payment_mode' => 'cash',
            'batch_num' => $batchNum,
            'tran_code' => $voucherType->code ?: 'VCH',
            'tran_type' => $voucherType->name,
            'tran_date' => date('Y-m-d'),
            'naration' => 'Voucher Request Approved',
            'authorize_status' => 'approved',
            'authorized_by' => Auth::id(),
            'authorized_at' => date('Y-m-d'),
            'created_by' => Auth::id(),
            'status' => 'posted',
        ];

        $tranNumDr = date('YmdHis') . rand(10, 99);
        Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumDr,
            'glac_id' => $mapping->debit_glac_id,
            'dr_amt' => $voucherRequest->amount,
            'cr_amt' => 0,
        ]));

        $tranNumCr = date('YmdHis') . rand(10, 99);
        $creditTransaction = Transaction::create(array_merge($commonData, [
            'tran_num' => $tranNumCr,
            'glac_id' => $mapping->credit_glac_id,
            'dr_amt' => 0,
            'cr_amt' => $voucherRequest->amount,
        ]));

        $voucherRequest->transaction_id = $creditTransaction->id;
        $voucherRequest->status = 'approved';
        $voucherRequest->save();
    }

    public function destroy($id)
    {
        $voucherRequest = VoucherRequest::find($id);

        if (!$voucherRequest) {
            return response()->json(['message' => 'Voucher request not found'], 404);
        }

        $voucherRequest->delete();

        return response()->json(['message' => 'Voucher request deleted successfully']);
    }
}

