import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    Users, Shield, UserCheck, GitCommit, ArrowRight, HandCoins,
    CreditCard, FileText, Receipt, ArrowUpCircle, ArrowDownCircle,
    Wallet, TrendingUp, History, Clock, CheckCircle2, XCircle, AlertCircle,
    Building2, PiggyBank, LayoutDashboard, BarChart3, Activity, PlusCircle, Pencil, Trash2
} from 'lucide-react';

/* Map backend icon keys -> lucide components */
const ICONS = {
    users: Users,
    shield: Shield,
    'user-check': UserCheck,
    building: Building2,
    'git-commit': GitCommit,
    'hand-coins': HandCoins,
    'credit-card': CreditCard,
    'piggy-bank': PiggyBank,
    'arrow-up-circle': ArrowUpCircle,
    'arrow-down-circle': ArrowDownCircle,
    wallet: Wallet,
    'trending-up': TrendingUp,
};

/* Static class lookups so Tailwind keeps them at build time */
const STAT_COLORS = {
    blue: { wrap: 'from-blue-50 to-blue-100', text: 'text-blue-600' },
    violet: { wrap: 'from-violet-50 to-violet-100', text: 'text-violet-600' },
    green: { wrap: 'from-green-50 to-green-100', text: 'text-green-600' },
    teal: { wrap: 'from-teal-50 to-teal-100', text: 'text-teal-600' },
    amber: { wrap: 'from-amber-50 to-amber-100', text: 'text-amber-600' },
    orange: { wrap: 'from-orange-50 to-orange-100', text: 'text-orange-600' },
    purple: { wrap: 'from-purple-50 to-purple-100', text: 'text-purple-600' },
    rose: { wrap: 'from-rose-50 to-rose-100', text: 'text-rose-600' },
    emerald: { wrap: 'from-emerald-50 to-emerald-100', text: 'text-emerald-600' },
    sky: { wrap: 'from-sky-50 to-sky-100', text: 'text-sky-600' },
};

const FIN_COLORS = {
    emerald: 'from-emerald-500 to-teal-600',
    rose: 'from-rose-500 to-red-600',
    purple: 'from-purple-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
};

const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amt || 0);

/* Quick actions, each gated by a permission slug */
const QUICK_ACTIONS = [
    { to: '/users', label: 'Manage Users', icon: Users, color: 'blue', perm: 'user.view' },
    { to: '/member-profile', label: 'Members', icon: UserCheck, color: 'green', perm: 'member.view' },
    { to: '/loan-application', label: 'Loan Application', icon: HandCoins, color: 'amber', perm: 'loan.application.view' },
    { to: '/dps-account', label: 'DPS Account', icon: CreditCard, color: 'purple', perm: 'dps.account.view' },
    { to: '/fdr-account', label: 'FDR Account', icon: PiggyBank, color: 'rose', perm: 'fdr.account.view' },
    { to: '/committees-list', label: 'Committees', icon: GitCommit, color: 'amber', perm: 'committee.view' },
    { to: '/payment-voucher', label: 'Payment Voucher', icon: ArrowUpCircle, color: 'emerald', perm: 'voucher.payment.view' },
    { to: '/received-voucher', label: 'Received Voucher', icon: ArrowDownCircle, color: 'sky', perm: 'voucher.received.view' },
];

const ACTION_HOVER = {
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    green: 'hover:border-green-300 hover:bg-green-50',
    amber: 'hover:border-amber-300 hover:bg-amber-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
    rose: 'hover:border-rose-300 hover:bg-rose-50',
    emerald: 'hover:border-emerald-300 hover:bg-emerald-50',
    sky: 'hover:border-sky-300 hover:bg-sky-50',
};

const StatCard = ({ stat, loading }) => {
    const Icon = ICONS[stat.icon] || LayoutDashboard;
    const c = STAT_COLORS[stat.color] || STAT_COLORS.blue;
    const inner = (
        <>
            <div className={`absolute right-4 top-4 p-3 rounded-lg bg-linear-to-br ${c.wrap}`}>
                <Icon className={c.text} size={22} />
            </div>
            <h3 className="text-gray-500 text-sm font-medium uppercase">{stat.label}</h3>
            <div className="mt-2">
                {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                ) : (
                    <p className="text-3xl font-bold text-gray-900">{Number(stat.value ?? 0).toLocaleString()}</p>
                )}
            </div>
        </>
    );

    const base = 'relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100';
    return stat.to ? (
        <Link to={stat.to} className={`${base} transition hover:shadow-md hover:border-gray-200`}>{inner}</Link>
    ) : (
        <div className={base}>{inner}</div>
    );
};

const timeAgo = (d) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; }
};

/* Deposits vs Withdrawals over the last 6 months (grouped bar chart, pure CSS) */
const TransactionsChart = ({ data = [], loading }) => {
    const max = Math.max(1, ...data.flatMap((d) => [d.deposits || 0, d.withdrawals || 0]));
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BarChart3 size={20} /></div>
                    <h3 className="text-lg font-bold text-gray-800">Deposits vs Withdrawals</h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Deposits</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />Withdrawals</span>
                </div>
            </div>
            {loading ? (
                <div className="h-52 bg-gray-50 rounded-lg animate-pulse" />
            ) : (
                <div className="flex items-end justify-between gap-3 h-52">
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div className="w-full flex items-end justify-center gap-1 h-full">
                                <div
                                    className="w-4 rounded-t bg-emerald-500/90 hover:bg-emerald-500 transition-all"
                                    style={{ height: d.deposits > 0 ? `max(${(d.deposits / max) * 100}%, 4px)` : '0px' }}
                                    title={`Deposits: ${formatCurrency(d.deposits)}`}
                                />
                                <div
                                    className="w-4 rounded-t bg-rose-400/90 hover:bg-rose-400 transition-all"
                                    style={{ height: d.withdrawals > 0 ? `max(${(d.withdrawals / max) * 100}%, 4px)` : '0px' }}
                                    title={`Withdrawals: ${formatCurrency(d.withdrawals)}`}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{d.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PORTFOLIO_BAR = { emerald: 'bg-emerald-500', rose: 'bg-rose-500', purple: 'bg-purple-500', amber: 'bg-amber-500' };

/* Portfolio balances as horizontal bars */
const PortfolioBreakdown = ({ financials = [], loading }) => {
    const max = Math.max(1, ...financials.map((f) => Math.abs(f.value || 0)));
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Wallet size={20} /></div>
                Portfolio Breakdown
            </h3>
            {loading ? (
                <div className="space-y-5">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />)}
                </div>
            ) : financials.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No financial data</p>
            ) : (
                <div className="space-y-5">
                    {financials.map((f) => (
                        <div key={f.key}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-gray-600 font-medium">{f.label}</span>
                                <span className="text-gray-900 font-bold">{formatCurrency(f.value)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${PORTFOLIO_BAR[f.color] || 'bg-blue-500'}`}
                                    style={{ width: `${(Math.abs(f.value || 0) / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ACTION_STYLE = {
    create: { icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    update: { icon: Pencil, color: 'text-amber-600', bg: 'bg-amber-50' },
    delete: { icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50' },
};

/* Last 10 user activities from the audit trail */
const RecentActivity = ({ items = [], loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Activity size={20} /></div>
            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        </div>
        <div className="p-4">
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No recent activity</div>
            ) : (
                <ul className="divide-y divide-gray-50">
                    {items.map((a) => {
                        const s = ACTION_STYLE[a.action] || { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50' };
                        const Icon = s.icon;
                        return (
                            <li key={a.id} className="flex items-center gap-3 py-3 px-2">
                                <div className={`p-2 rounded-lg shrink-0 ${s.bg} ${s.color}`}><Icon size={16} /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-800 truncate">
                                        <span className="font-semibold">{a.user}</span>{' '}
                                        <span className="text-gray-500">{a.action}d</span>{' '}
                                        <span className="font-medium">{a.entity}</span>
                                        {a.entity_id ? <span className="text-gray-400"> #{a.entity_id}</span> : null}
                                    </p>
                                    <p className="text-xs text-gray-400">{timeAgo(a.at)}</p>
                                </div>
                                <span className={`hidden sm:inline text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.color}`}>
                                    {a.action}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    </div>
);

const StaffDashboard = ({ data, loading, user, hasPermission }) => {
    const {
        stats = [],
        financials = [],
        pending_committees: pendingCommittees = [],
        monthly_transactions: monthly = [],
        recent_activity: activity = [],
    } = data;
    const actions = QUICK_ACTIONS.filter((a) => hasPermission(a.perm));
    const showTrend = loading || monthly.length > 0;
    const showPortfolio = loading || financials.length > 0;
    const showActivity = loading || activity.length > 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
                    <p className="text-gray-600">Here is an overview of what you can manage.</p>
                </div>
                {hasPermission('transaction-report.view') && (
                    <Link to="/transaction-report" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <FileText size={18} />
                        View Reports
                        <ArrowRight size={16} />
                    </Link>
                )}
            </div>

            {/* Financial highlights */}
            {(loading || financials.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(loading ? Array.from({ length: 4 }) : financials).map((f, i) => {
                        const Icon = ICONS[f?.icon] || Wallet;
                        const grad = FIN_COLORS[f?.color] || FIN_COLORS.emerald;
                        return (
                            <div key={f?.key || i} className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-linear-to-br ${grad} opacity-10 rounded-full transition-transform group-hover:scale-110`} />
                                <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${grad} text-white mb-4 shadow-sm`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{f?.label || '—'}</h3>
                                <div className="mt-2">
                                    {loading ? (
                                        <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
                                    ) : (
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(f.value)}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Count cards */}
            {(loading || stats.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(loading ? Array.from({ length: 4 }) : stats).map((s, i) => (
                        <StatCard key={s?.key || i} stat={s || {}} loading={loading} />
                    ))}
                </div>
            )}

            {/* No-access empty state */}
            {!loading && stats.length === 0 && financials.length === 0 && (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                    <LayoutDashboard className="mx-auto text-gray-300" size={40} />
                    <p className="mt-3 text-gray-500">No dashboard data is available for your role yet.</p>
                </div>
            )}

            {/* Charts */}
            {(showTrend || showPortfolio) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {showTrend && (
                        <div className="lg:col-span-2">
                            <TransactionsChart data={monthly} loading={loading} />
                        </div>
                    )}
                    {showPortfolio && (
                        <div className={showTrend ? '' : 'lg:col-span-3'}>
                            <PortfolioBreakdown financials={financials} loading={loading} />
                        </div>
                    )}
                </div>
            )}

            {/* Recent activity + roles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {showActivity && (
                    <div className="lg:col-span-2">
                        <RecentActivity items={activity} loading={loading} />
                    </div>
                )}

                <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${showActivity ? '' : 'lg:col-span-3'}`}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Roles</h3>
                    <div className="flex flex-wrap gap-2">
                        {user?.roles?.map((role) => (
                            <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                {role.name}
                            </span>
                        ))}
                    </div>
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">System Status</h4>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            {actions.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {actions.map((a) => (
                            <Link key={a.to} to={a.to} className={`group flex items-center justify-between p-4 rounded-lg border transition ${ACTION_HOVER[a.color] || ACTION_HOVER.blue}`}>
                                <div className="flex items-center gap-3">
                                    <a.icon className={STAT_COLORS[a.color]?.text || 'text-blue-600'} size={20} />
                                    <span className="font-medium text-gray-800">{a.label}</span>
                                </div>
                                <ArrowRight className="text-gray-400 group-hover:text-gray-600" size={18} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending approvals — only when the role can see committees */}
            {hasPermission('committee.view') && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Pending Approvals</h3>
                        <Link to="/committees-list" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-10 bg-gray-100 rounded animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ) : (
                        <div className="divide-y">
                            {pendingCommittees.length === 0 ? (
                                <div className="text-gray-500 text-sm py-4">No pending committees</div>
                            ) : (
                                pendingCommittees.map((item) => (
                                    <div key={item.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-800">{item.name || 'Untitled Committee'}</div>
                                            <div className="text-xs text-gray-500">
                                                {(item.committeeType?.name) || (item.committee_type?.name) || 'Type'} • {(item.samity?.samity_name) || 'Samity'}
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Submitted</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UserDashboard = ({ stats, transactions, requests, loading, user }) => {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Hello, {user?.name}! 👋</h2>
                    <p className="text-gray-600 mt-1 text-lg">Your financial overview at a glance.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/deposit-money" className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200">
                        <ArrowDownCircle size={20} />
                        Deposit
                    </Link>
                    <Link to="/withdraw-money" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        <ArrowUpCircle size={20} />
                        Withdraw
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Savings Balance', value: stats.savings_balance, icon: Wallet, color: 'emerald', bg: 'from-emerald-500 to-teal-600' },
                    { label: 'Loan Outstanding', value: stats.loan_outstanding, icon: HandCoins, color: 'rose', bg: 'from-rose-500 to-red-600' },
                    { label: 'DPS Balance', value: stats.dps_balance, icon: CreditCard, color: 'purple', bg: 'from-purple-500 to-indigo-600' },
                    { label: 'FDR Balance', value: stats.fdr_balance, icon: TrendingUp, color: 'amber', bg: 'from-amber-500 to-orange-600' }
                ].map((card, i) => (
                    <div key={i} className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-linear-to-br ${card.bg} opacity-10 rounded-full transition-transform group-hover:scale-110`} />
                        <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${card.bg} text-white mb-4 shadow-sm`}>
                            <card.icon size={24} />
                        </div>
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{card.label}</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            {loading ? (
                                <div className="h-9 w-32 bg-gray-100 rounded-lg animate-pulse" />
                            ) : (
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(card.value)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <History size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
                        </div>
                        <Link to="/account-statement" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Narration</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i}><td colSpan="4" className="px-6 py-4"><div className="h-10 bg-gray-50 rounded animate-pulse" /></td></tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No transactions found</td></tr>
                                ) : (
                                    transactions.map((t, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.tran_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${t.dr_amt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {t.dr_amt > 0 ? 'DEBIT' : 'CREDIT'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-50 truncate">{t.naration}</td>
                                            <td className={`px-6 py-4 text-sm font-bold text-right ${t.dr_amt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(t.dr_amt > 0 ? t.dr_amt : t.cr_amt)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Recent Requests</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)
                        ) : requests.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">No recent requests</div>
                        ) : (
                            requests.map((r, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${r.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {r.type === 'Deposit' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{r.type} Request</div>
                                            <div className="text-xs text-gray-500 font-medium">{new Date(r.created_at).toLocaleDateString()} • {formatCurrency(r.amount)}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {r.status === 'approved' && <span className="p-1 text-emerald-600"><CheckCircle2 size={20} /></span>}
                                        {r.status === 'pending' && <span className="p-1 text-amber-500"><Clock size={20} /></span>}
                                        {r.status === 'cancelled' && <span className="p-1 text-rose-500"><XCircle size={20} /></span>}
                                        {r.status === 'rejected' && <span className="p-1 text-rose-500"><AlertCircle size={20} /></span>}
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                            r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                            {r.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, hasPermission } = useAuth();
    // Staff = anyone holding a role other than the plain member 'user' role.
    const isStaff = (user?.roles || []).some((role) => role.slug !== 'user');
    const [loading, setLoading] = useState(true);

    const [summary, setSummary] = useState({ stats: [], financials: [], pending_committees: [], monthly_transactions: [], recent_activity: [] });
    const [userDashboardData, setUserDashboardData] = useState({
        stats: { savings_balance: 0, loan_outstanding: 0, dps_balance: 0, fdr_balance: 0 },
        recent_transactions: [],
        recent_requests: []
    });

    useEffect(() => {
        if (isStaff) {
            fetchSummary();
        } else {
            fetchUserDashboard();
        }
    }, [isStaff]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/summary');
            setSummary({
                stats: res.data?.stats || [],
                financials: res.data?.financials || [],
                pending_committees: res.data?.pending_committees || [],
                monthly_transactions: res.data?.monthly_transactions || [],
                recent_activity: res.data?.recent_activity || [],
            });
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDashboard = async () => {
        setLoading(true);
        try {
            const response = await api.get('/dashboard/user');
            setUserDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching user dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isStaff) {
        return <StaffDashboard data={summary} loading={loading} user={user} hasPermission={hasPermission} />;
    }

    return (
        <UserDashboard
            stats={userDashboardData.stats}
            transactions={userDashboardData.recent_transactions}
            requests={userDashboardData.recent_requests}
            loading={loading}
            user={user}
        />
    );
};

export default Dashboard;
