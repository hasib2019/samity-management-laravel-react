<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DepositRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use App\Models\SavingsAccount;
use App\Models\Transaction;
use App\Models\MemberInfo;
use App\Mail\DepositSlipMail;
use App\Services\SettingsService;
use App\Services\MailConfigService;

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
            'penalty_amount' => 'nullable|numeric|min:0',
            'is_subscription' => 'nullable|boolean',
            'period_month' => 'required_if:is_subscription,1,true|nullable|integer|between:1,12',
            'period_year' => 'required_if:is_subscription,1,true|nullable|integer|min:2000|max:2100',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            // A deposit slip is mandatory.
            'attachment' => 'required|file|mimes:jpeg,jpg,png,pdf,webp|max:4096',
            'status' => 'required|in:pending,approved,rejected,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $isSubscription = $request->boolean('is_subscription');

        // Prevent paying the same subscription month twice.
        if ($isSubscription) {
            $duplicate = DepositRequest::where('member_id', $request->member_id)
                ->where('is_subscription', true)
                ->where('period_year', (int) $request->period_year)
                ->where('period_month', (int) $request->period_month)
                ->whereNotIn('status', ['rejected', 'cancelled'])
                ->exists();

            if ($duplicate) {
                return response()->json([
                    'message' => 'A subscription payment for this month already exists for the member.',
                ], 422);
            }
        }

        try {
            DB::beginTransaction();

            // Whitelist fields (never mass-assign status/transaction_id from input).
            $data = $request->only([
                'member_id', 'method_id', 'savings_account_id', 'amount',
                'total_amount', 'charge', 'description', 'requirements',
            ]);

            // Subscription tagging: only flagged deposits count toward the dues.
            $data['is_subscription'] = $isSubscription;
            $data['period_month'] = $isSubscription ? (int) $request->period_month : null;
            $data['period_year'] = $isSubscription ? (int) $request->period_year : null;
            $data['penalty_amount'] = (float) ($request->penalty_amount ?? 0);

            // Store the mandatory deposit slip and keep its path.
            $data['attachment'] = $request->file('attachment')->store('deposit-slips', 'public');

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

            // Email the deposit slip after commit so a mail failure can never roll
            // back the posted transaction.
            if ($data['status'] === 'approved') {
                $this->sendDepositSlip($depositRequest);
            }

            // Surface the post-deposit savings balance + reference for the slip.
            $savingsAccount = SavingsAccount::find($depositRequest->savings_account_id);
            $reference = $depositRequest->transaction_id
                ? optional(Transaction::find($depositRequest->transaction_id))->batch_num
                : null;

            return response()->json([
                'message' => 'Deposit request created successfully',
                'data' => $depositRequest,
                'balance' => $savingsAccount?->current_balance,
                'reference' => $reference,
            ], 201);

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

            // Email the deposit slip only when this update is what approved it.
            if ($approving) {
                $this->sendDepositSlip($depositRequest);
            }

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

        $totalAmount   = (float) $depositRequest->amount;             // total cash received (fee + penalty)
        $penalty       = (float) ($depositRequest->penalty_amount ?? 0);
        $feeAmount     = $totalAmount - $penalty;                      // savings deposit portion only

        // Validate penalty GL when penalty exists
        if ($penalty > 0 && !$product->sav_penalty_income_cr_gl_id) {
            throw new \Exception('Savings Penalty Income CR GL is not configured in the product.');
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

        // DR: Cash/Bank — total cash received from member (fee + penalty)
        Transaction::create(array_merge($commonData, [
            'tran_num' => date('YmdHis') . rand(10, 99),
            'glac_id'  => $product->sav_cash_bank_dr_gl_id,
            'dr_amt'   => $totalAmount,
            'cr_amt'   => 0,
        ]));

        // CR: Savings Deposit Liability — fee portion only (not penalty)
        $creditTransaction = Transaction::create(array_merge($commonData, [
            'tran_num' => date('YmdHis') . rand(10, 99),
            'glac_id'  => $product->sav_dep_lib_cr_gl_id,
            'dr_amt'   => 0,
            'cr_amt'   => $feeAmount,
        ]));

        // CR: Penalty Income — posted separately as samity income
        if ($penalty > 0) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id'  => $product->sav_penalty_income_cr_gl_id,
                'dr_amt'   => 0,
                'cr_amt'   => $penalty,
            ]));
        }

        $depositRequest->transaction_id = $creditTransaction->id;
        $depositRequest->save();

        // Member's savings balance increases by fee only — penalty is samity income
        $savingsAccount->increment('current_balance', $feeAmount);
    }

    /**
     * Email the member a deposit confirmation slip.
     *
     * Best-effort: respects the "email notifications" setting, requires a member
     * email and configured SMTP, and never throws — a mail failure must not
     * affect the (already committed) deposit, so failures are only logged.
     */
    private function sendDepositSlip(DepositRequest $depositRequest): void
    {
        try {
            $settings = app(SettingsService::class);

            if (! $settings->get('enable_email_notifications')) {
                return; // Admin has not enabled email notifications.
            }

            $member = MemberInfo::find($depositRequest->member_id);
            if (! $member || empty($member->email)) {
                return; // No recipient to send to.
            }

            if (! app(MailConfigService::class)->apply()) {
                return; // SMTP is not configured.
            }

            $savingsAccount = SavingsAccount::find($depositRequest->savings_account_id);
            $txn = $depositRequest->transaction_id ? Transaction::find($depositRequest->transaction_id) : null;

            $decimals = (int) $settings->get('number_format_decimals', 2);

            $total   = (float) $depositRequest->amount;            // total received (fee + penalty)
            $penalty = (float) ($depositRequest->penalty_amount ?? 0);
            $fee     = $total - $penalty;                            // subscription fee portion only

            $slip = [
                'site_name' => $settings->get('site_name', 'Samity Management'),
                'currency' => $settings->get('currency_symbol', '৳'),
                'member_name' => $member->member_name,
                'member_code' => $member->member_code,
                'account_number' => $savingsAccount?->account_number,
                'amount' => number_format($total, $decimals),  // total paid on slip
                'balance' => number_format((float) ($savingsAccount?->current_balance ?? 0), $decimals),
                'reference' => $txn?->batch_num,
                'date' => $txn && $txn->tran_date
                    ? Carbon::parse($txn->tran_date)->format('d M Y')
                    : Carbon::now()->format('d M Y'),
                'is_subscription' => (bool) $depositRequest->is_subscription,
                'period' => ($depositRequest->is_subscription && $depositRequest->period_month)
                    ? Carbon::createFromDate($depositRequest->period_year, $depositRequest->period_month, 1)->format('F Y')
                    : null,
                'fee' => number_format($fee, $decimals),
                'penalty' => number_format($penalty, $decimals),
            ];

            Mail::to($member->email)->send(new DepositSlipMail($slip));
        } catch (\Throwable $e) {
            Log::warning('Deposit slip email failed: ' . $e->getMessage(), [
                'deposit_request_id' => $depositRequest->id,
            ]);
        }
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
