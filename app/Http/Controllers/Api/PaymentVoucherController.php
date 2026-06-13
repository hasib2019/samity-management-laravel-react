<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use App\Models\GlMstMapping;
use App\Models\GlAccount;
use App\Helpers\BalanceHelper;

class PaymentVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with(['glAccount', 'samity'])->where('tran_type', 'Payment')->latest();
        if ($request->has('tran_date')) {
            $query->where('tran_date', $request->input('tran_date'));
        }
        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->input('samity_id'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tran_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'gl_mst_id' => 'required|exists:glac_mst,id',
            'samity_id' => 'nullable|exists:samity_profiles,id',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $cashMap = GlMstMapping::where('gl_code_type', strtoupper('CASH'))->where('status', true)->first();
        if (!$cashMap) {
            return response()->json(['message' => 'Cash mapping not found'], 422);
        }

        // Atomic, serialized posting: lock the source (cash) GL row so the
        // balance check and the two ledger writes cannot interleave with a
        // concurrent voucher and overdraw the account or leave a one-sided entry.
        return DB::transaction(function () use ($request, $cashMap) {
            GlAccount::where('id', $cashMap->gl_mst_id)->lockForUpdate()->first();

            $available = BalanceHelper::getBalance($cashMap->gl_mst_id, $request->samity_id);
            if ($available < (float)$request->amount) {
                return response()->json(['message' => 'Insufficient cash balance', 'available' => $available], 422);
            }

            $batch = 'pv' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $tranNumDr = date('YmdHis') . rand(10, 99);
            $tranNumCr = date('YmdHis') . rand(10, 99);

            $common = [
                'payment_mode' => 'cash',
                'tran_code' => 'PAY',
                'batch_num' => $batch,
                'tran_type' => 'Payment',
                'tran_date' => $request->tran_date,
                'naration' => $request->naration,
                'samity_id' => $request->samity_id,
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => date('Y-m-d H:i:s'),
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'status' => 'posted',
            ];

            Transaction::create(array_merge($common, [
                'tran_num' => $tranNumDr,
                'glac_id' => $request->gl_mst_id,
                'dr_amt' => $request->amount,
                'cr_amt' => 0,
            ]));

            $credit = Transaction::create(array_merge($common, [
                'tran_num' => $tranNumCr,
                'glac_id' => $cashMap->gl_mst_id,
                'dr_amt' => 0,
                'cr_amt' => $request->amount,
            ]));

            return response()->json(['message' => 'Payment voucher posted', 'data' => $credit], 201);
        });
    }
}

