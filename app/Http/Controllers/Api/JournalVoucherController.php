<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use App\Models\GlAccount;
use App\Helpers\BalanceHelper;

class JournalVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with(['glAccount', 'samity'])->where('tran_type', 'Journal')->latest();
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
            'dr_gl_id' => 'required|exists:glac_mst,id',
            'cr_gl_id' => 'required|exists:glac_mst,id|different:dr_gl_id',
            'samity_id' => 'nullable|exists:samity_profiles,id',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Atomic, serialized posting: lock the source (credit) GL row so the
        // balance check and both ledger writes cannot interleave with a concurrent
        // entry and overdraw the account or leave a one-sided entry.
        return DB::transaction(function () use ($request) {
            $crGl = GlAccount::where('id', $request->cr_gl_id)->lockForUpdate()->first();
            if (!$crGl) {
                return response()->json(['message' => 'Credit GL account not found'], 404);
            }

            // If we are crediting an Asset (1) or Expense (4), we are reducing its balance,
            // so ensure it has enough (Dr - Cr >= Amount). Liability/Income increase, no check.
            if (in_array($crGl->glac_type, [1, 4])) {
                $available = BalanceHelper::getBalance($request->cr_gl_id, $request->samity_id);
                if ($available < (float)$request->amount) {
                    return response()->json(['message' => 'Insufficient balance in source account (Credit GL)', 'available' => $available], 422);
                }
            }

            $batch = 'jv' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $tranNumDr = date('YmdHis') . rand(10, 99);
            $tranNumCr = date('YmdHis') . rand(10, 99);

            $common = [
                'payment_mode' => 'journal',
                'tran_code' => 'JOU',
                'batch_num' => $batch,
                'tran_type' => 'Journal',
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

            // Debit Entry
            Transaction::create(array_merge($common, [
                'tran_num' => $tranNumDr,
                'glac_id' => $request->dr_gl_id,
                'dr_amt' => $request->amount,
                'cr_amt' => 0,
            ]));

            // Credit Entry
            Transaction::create(array_merge($common, [
                'tran_num' => $tranNumCr,
                'glac_id' => $request->cr_gl_id,
                'dr_amt' => 0,
                'cr_amt' => $request->amount,
            ]));

            return response()->json(['message' => 'Journal voucher posted successfully'], 201);
        });
    }
}
