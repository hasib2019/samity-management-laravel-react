<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberInfo;
use App\Models\SamityProfile;
use App\Models\SavingsAccount;
use App\Models\LoanAccount;
use App\Models\LoanApplication;
use App\Models\DpsApplication;
use App\Models\FdrApplication;
use App\Models\Transaction;
use App\Models\DepositRequest;
use App\Models\WithdrawRequest;
use App\Models\User;
use App\Models\Role;
use App\Models\Committee;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\SettingsService;

class GlobalController extends Controller
{
    public function siteInfo(SettingsService $settings)
    {
        return response()->json([
            'site_name'        => $settings->get('site_name', 'Samity Management'),
            'site_logo'        => $settings->get('site_logo'),
            'developed_by_text'=> $settings->get('developed_by_text'),
            'developed_by_url' => $settings->get('developed_by_url'),
        ]);
    }

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
        'subscription.due.view',
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

    /**
     * Role-aware dashboard summary for staff/operators.
     *
     * Every figure is computed server-side (so a single request, no per-list
     * 403s) and each card is only included when the signed-in user actually
     * holds a permission that lets them see it. The result is a dashboard that
     * shows exactly the data relevant to that user's role.
     */
    public function dashboardSummary()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // True if the user holds ANY of the given permissions (super-admin
        // short-circuits inside hasPermission()).
        $can = fn(...$perms) => $user->hasAnyPermission($perms);

        // --- Count cards (only the ones this role may view) ---
        $stats = [];

        if ($can('user.view')) {
            $stats[] = ['key' => 'users', 'label' => 'Users', 'value' => User::count(), 'icon' => 'users', 'color' => 'blue', 'to' => '/users'];
        }
        if ($can('role.view')) {
            $stats[] = ['key' => 'roles', 'label' => 'Roles', 'value' => Role::count(), 'icon' => 'shield', 'color' => 'violet', 'to' => '/roles'];
        }
        if ($can('member.view')) {
            $stats[] = ['key' => 'members', 'label' => 'Members', 'value' => MemberInfo::count(), 'icon' => 'user-check', 'color' => 'green', 'to' => '/member-profile'];
        }
        if ($can('samity-profile.view', 'samity.profile.view')) {
            $stats[] = ['key' => 'samities', 'label' => 'Samities', 'value' => SamityProfile::count(), 'icon' => 'building', 'color' => 'teal', 'to' => '/samity-profile'];
        }
        if ($can('committee.view')) {
            $stats[] = ['key' => 'committees', 'label' => 'Committees', 'value' => Committee::count(), 'icon' => 'git-commit', 'color' => 'amber', 'to' => '/committees-list'];
        }
        if ($can('loan.application.view')) {
            $stats[] = ['key' => 'loans', 'label' => 'Loans', 'value' => LoanApplication::count(), 'icon' => 'hand-coins', 'color' => 'orange', 'to' => '/loan-application'];
        }
        if ($can('dps.account.view')) {
            $stats[] = ['key' => 'dps', 'label' => 'DPS Accounts', 'value' => DpsApplication::count(), 'icon' => 'credit-card', 'color' => 'purple', 'to' => '/dps-account'];
        }
        if ($can('fdr.account.view', 'fdr.application.view')) {
            $stats[] = ['key' => 'fdr', 'label' => 'FDR Accounts', 'value' => FdrApplication::count(), 'icon' => 'piggy-bank', 'color' => 'rose', 'to' => '/fdr-account'];
        }
        if ($can('voucher.payment.view')) {
            $stats[] = ['key' => 'payment_vouchers', 'label' => 'Payment Vouchers', 'value' => Transaction::where('tran_type', 'Payment')->distinct('batch_num')->count('batch_num'), 'icon' => 'arrow-up-circle', 'color' => 'emerald', 'to' => '/payment-voucher'];
        }
        if ($can('voucher.received.view')) {
            $stats[] = ['key' => 'received_vouchers', 'label' => 'Received Vouchers', 'value' => Transaction::where('tran_type', 'Received')->distinct('batch_num')->count('batch_num'), 'icon' => 'arrow-down-circle', 'color' => 'sky', 'to' => '/received-voucher'];
        }

        // --- Financial highlights (currency) ---
        $financials = [];

        if ($can('member.view', 'deposit.request.view', 'deposit.money.view')) {
            $financials[] = ['key' => 'savings', 'label' => 'Total Savings', 'value' => (float) SavingsAccount::sum('current_balance'), 'icon' => 'wallet', 'color' => 'emerald'];
        }
        if ($can('loan.application.view', 'loan.repayment.view', 'loan.disbursement.view')) {
            $financials[] = ['key' => 'loan_outstanding', 'label' => 'Loan Outstanding', 'value' => (float) LoanAccount::sum('current_balance'), 'icon' => 'hand-coins', 'color' => 'rose'];
        }
        if ($can('dps.account.view', 'dps.collection.view')) {
            $financials[] = ['key' => 'dps_balance', 'label' => 'DPS Balance', 'value' => (float) DpsApplication::where('status', 'active')->sum('balance'), 'icon' => 'credit-card', 'color' => 'purple'];
        }
        if ($can('fdr.account.view', 'fdr.application.view', 'fdr.collection.view')) {
            $financials[] = ['key' => 'fdr_balance', 'label' => 'FDR Balance', 'value' => (float) FdrApplication::where('status', 'active')->sum('fdr_amount'), 'icon' => 'trending-up', 'color' => 'amber'];
        }

        // --- Pending committee approvals ---
        $pendingCommittees = [];
        if ($can('committee.view', 'committee.approve')) {
            $pendingCommittees = Committee::with(['committeeType', 'samity'])
                ->where('status', 'submitted')
                ->latest()
                ->limit(5)
                ->get();
        }

        // --- Last 6 months deposit vs withdrawal trend (for the bar chart) ---
        $monthlyTransactions = [];
        if ($can('member.view', 'deposit.money.view', 'deposit.request.view', 'transaction-report.view', 'voucher.received.view')) {
            $since = now()->copy()->subMonths(5)->startOfMonth();

            $deposits = Transaction::where('tran_type', 'Deposit')
                ->where('tran_date', '>=', $since->toDateString())
                ->selectRaw("DATE_FORMAT(tran_date, '%Y-%m') as ym, SUM(cr_amt) as total")
                ->groupBy('ym')
                ->pluck('total', 'ym');

            $withdrawals = Transaction::where('tran_type', 'Withdraw')
                ->where('tran_date', '>=', $since->toDateString())
                ->selectRaw("DATE_FORMAT(tran_date, '%Y-%m') as ym, SUM(dr_amt) as total")
                ->groupBy('ym')
                ->pluck('total', 'ym');

            for ($i = 5; $i >= 0; $i--) {
                $month = now()->copy()->subMonths($i);
                $ym = $month->format('Y-m');
                $monthlyTransactions[] = [
                    'label' => $month->format('M'),
                    'deposits' => (float) ($deposits[$ym] ?? 0),
                    'withdrawals' => (float) ($withdrawals[$ym] ?? 0),
                ];
            }
        }

        // --- Last 10 user activities (audit trail) ---
        $recentActivity = [];
        if ($user->hasRole('super-admin') || $can('user.view')) {
            $recentActivity = AuditLog::with('user:id,name')
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'user' => optional($a->user)->name ?? 'System',
                    'action' => $a->action,
                    'entity' => class_basename($a->auditable_type),
                    'entity_id' => $a->auditable_id,
                    'at' => $a->created_at,
                ]);
        }

        return response()->json([
            'view' => 'staff',
            'stats' => $stats,
            'financials' => $financials,
            'pending_committees' => $pendingCommittees,
            'monthly_transactions' => $monthlyTransactions,
            'recent_activity' => $recentActivity,
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

    /**
     * Active products a member can apply for (loan/dps/fdr/savings), for the
     * member portal's application forms. Read-only, any authenticated member.
     */
    public function portalProducts(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = \App\Models\Product::query();
        if ($request->filled('type')) {
            $query->where('product_type', $request->query('type'));
        }

        $products = $query->orderBy('product_name')->get([
            'id', 'product_name', 'product_type', 'profit_rate',
            'min_tenure_month', 'max_tenure_month', 'tenure_required',
        ]);

        return response()->json($products);
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
