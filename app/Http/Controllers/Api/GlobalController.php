<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberInfo;
use App\Models\SamityProfile;
use App\Models\SavingsAccount;
use App\Models\LoanAccount;
use App\Models\DpsApplication;
use App\Models\FdrApplication;
use App\Models\Transaction;
use App\Models\DepositRequest;
use App\Models\WithdrawRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GlobalController extends Controller
{
    /**
     * Permissions whose holders legitimately need to look up members/samities
     * through these shared "global" picker endpoints.
     */
    private const MEMBER_OPERATOR_PERMISSIONS = [
        'member.view', 'member.create', 'member.edit',
        'samity.profile.view',
        'deposit.money.create', 'deposit.money.view', 'deposit.request.create', 'deposit.request.view',
        'withdraw.money.create', 'withdraw.money.view', 'withdraw.request.create', 'withdraw.request.view',
        'loan.application.view', 'loan.application.create',
        'loan.disbursement.view', 'loan.repayment.view', 'loan.closing.view',
        'dps.account.view', 'dps.account.create', 'dps.collection.view',
        'fdr.account.view', 'fdr.account.create', 'fdr.collection.view',
        'share.purchase.create', 'share.sale.create', 'share.list.view',
        'member.loan.application.view', 'member.loan.application.create',
    ];

    /** True when the operator holds any permission that needs member/samity lookup (super-admin bypasses via can()). */
    private function isMemberOperator($user): bool
    {
        if (!$user) {
            return false;
        }

        foreach (self::MEMBER_OPERATOR_PERMISSIONS as $perm) {
            if ($user->can($perm)) {
                return true;
            }
        }

        return false;
    }

    /** A 'user' (member) may only access their own record; operators need an operator permission. */
    private function canAccessMember($user, $memberId): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->hasRole('user')) {
            $ownId = MemberInfo::where('user_id', $user->id)->value('id');
            return $ownId !== null && (int) $memberId === (int) $ownId;
        }

        return $this->isMemberOperator($user);
    }

    public function userDashboard()
    {
        $user = Auth::user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $member = MemberInfo::where('user_id', $user->id)->first();
        if (!$member) {
            return response()->json([
                'stats' => [
                    'savings_balance' => 0,
                    'loan_outstanding' => 0,
                    'dps_balance' => 0,
                    'fdr_balance' => 0
                ],
                'recent_transactions' => [],
                'recent_requests' => []
            ]);
        }

        $savingsBalance = SavingsAccount::where('member_id', $member->id)->sum('current_balance');
        $loanOutstanding = LoanAccount::where('member_id', $member->id)->sum('current_balance');
        $dpsBalance = DpsApplication::where('member_id', $member->id)->where('status', 'active')->sum('balance');
        $fdrBalance = FdrApplication::where('member_id', $member->id)->where('status', 'active')->sum('fdr_amount');

        $recentTransactions = Transaction::where('customer_id', $member->id)
            ->select(
                'tran_date',
                'batch_num',
                'tran_type',
                DB::raw('MAX(naration) as naration'),
                DB::raw('SUM(dr_amt) as total_dr'),
                DB::raw('SUM(cr_amt) as total_cr')
            )
            ->groupBy('tran_date', 'batch_num', 'tran_type')
            ->orderBy('tran_date', 'desc')
            ->orderBy('batch_num', 'desc')
            ->limit(10)
            ->get()
             ->map(function($t) {
                 // User perspective: 
                 // Deposits, Loan Repayments, DPS/FDR Collections are Credits (money into account or reducing debt)
                  // Withdrawals, Loan Disbursements, DPS/FDR Closings are Debits (money out of account or increasing debt)
                  $creditTypes = ['Deposit', 'LoanRepayment', 'LoanClosing', 'DPSCollection', 'FDR_COLLECTION'];
                  $isCredit = in_array($t->tran_type, $creditTypes);
                 
                 $t->dr_amt = $isCredit ? 0 : $t->total_dr;
                 $t->cr_amt = $isCredit ? $t->total_cr : 0;
                 
                 return $t;
             });

        $depositRequests = DepositRequest::where('member_id', $member->id)
            ->select('id', 'amount', 'status', 'created_at', DB::raw("'Deposit' as type"))
            ->latest()
            ->limit(5)
            ->get();

        $withdrawRequests = WithdrawRequest::where('member_id', $member->id)
            ->select('id', 'amount', 'status', 'created_at', DB::raw("'Withdraw' as type"))
            ->latest()
            ->limit(5)
            ->get();

        $recentRequests = $depositRequests->concat($withdrawRequests)->sortByDesc('created_at')->take(5)->values();

        return response()->json([
            'stats' => [
                'savings_balance' => $savingsBalance,
                'loan_outstanding' => $loanOutstanding,
                'dps_balance' => $dpsBalance,
                'fdr_balance' => $fdrBalance
            ],
            'recent_transactions' => $recentTransactions,
            'recent_requests' => $recentRequests
        ]);
    }

    public function samities()
    {
        $user = Auth::user();
        $query = SamityProfile::query();

        if ($user && $user->hasRole('user')) {
            // If user role, only show samities associated with the member linked to this user
            $query->whereHas('members', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } elseif (!$this->isMemberOperator($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $samities = $query->get();
        return response()->json($samities);
    }

    public function members(Request $request)
    {
        $user = Auth::user();

        // Members (the 'user' role) may only ever see their own record.
        if ($user && $user->hasRole('user')) {
            $members = MemberInfo::where('user_id', $user->id)->orderBy('member_name')->get();
            return response()->json($members);
        }

        // Operators must hold a permission that legitimately needs the member list.
        if (!$this->isMemberOperator($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = MemberInfo::query();
        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->input('samity_id'));
        }

        $members = $query->orderBy('member_name')->get();
        return response()->json($members);
    }

    public function accounts($memberId)
    {
        if (!$this->canAccessMember(Auth::user(), $memberId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $savings = SavingsAccount::with('product')->where('member_id', $memberId)->get()->map(function($acc) {
            $acc->type = 'savings';
            return $acc;
        });

        $loans = LoanAccount::with(['loanApplication.product'])->where('member_id', $memberId)->get()->map(function($acc) {
            $acc->type = 'loan';
            // Normalize structure
            $acc->product = $acc->loanApplication->product;
            return $acc;
        });

        return response()->json([
            'savings' => $savings,
            'loans' => $loans
        ]);
    }
}
