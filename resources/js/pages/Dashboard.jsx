import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { 
    Users, Shield, UserCheck, GitCommit, ArrowRight, HandCoins, 
    CreditCard, FileText, Receipt, ArrowUpCircle, ArrowDownCircle,
    Wallet, TrendingUp, History, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

const AdminDashboard = ({ stats, loading, pendingCommittees, user }) => (
    <div className="space-y-8">
        <div className="flex items-end justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
                <p className="text-gray-600">Here is a quick overview and shortcuts.</p>
            </div>
            <Link to="/transaction-report" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FileText size={18} />
                View Reports
                <ArrowRight size={16} />
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <Users className="text-blue-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Users</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.users ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-violet-50 to-violet-100">
                    <Shield className="text-violet-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Roles</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.roles ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <UserCheck className="text-green-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Members</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.members ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
                    <GitCommit className="text-amber-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Committees</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.committees ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
                    <HandCoins className="text-amber-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Loans</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.loans ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <CreditCard className="text-purple-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">DPS</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.dps ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100">
                    <CreditCard className="text-rose-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">FDR</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.fdr ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <ArrowUpCircle className="text-emerald-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Payment Vouchers</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.paymentVouchers ?? '--'}</p>
                    )}
                </div>
            </div>
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="absolute right-4 top-4 p-3 rounded-lg bg-gradient-to-br from-sky-50 to-sky-100">
                    <ArrowDownCircle className="text-sky-600" size={22} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium uppercase">Received Vouchers</h3>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900">{stats.receivedVouchers ?? '--'}</p>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link to="/users" className="group flex items-center justify-between p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-600" size={20} />
                            <span className="font-medium text-gray-800">Manage Users</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-blue-600" size={18} />
                    </Link>
                    <Link to="/member-profile" className="group flex items-center justify-between p-4 rounded-lg border hover:border-green-300 hover:bg-green-50 transition">
                        <div className="flex items-center gap-3">
                            <UserCheck className="text-green-600" size={20} />
                            <span className="font-medium text-gray-800">Members</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-green-600" size={18} />
                    </Link>
                    <Link to="/loan-application" className="group flex items-center justify-between p-4 rounded-lg border hover:border-amber-300 hover:bg-amber-50 transition">
                        <div className="flex items-center gap-3">
                            <HandCoins className="text-amber-600" size={20} />
                            <span className="font-medium text-gray-800">Loan Application</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-amber-600" size={18} />
                    </Link>
                    <Link to="/dps-account" className="group flex items-center justify-between p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition">
                        <div className="flex items-center gap-3">
                            <CreditCard className="text-purple-600" size={20} />
                            <span className="font-medium text-gray-800">DPS Account</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-purple-600" size={18} />
                    </Link>
                    <Link to="/fdr-account" className="group flex items-center justify-between p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50 transition">
                        <div className="flex items-center gap-3">
                            <CreditCard className="text-rose-600" size={20} />
                            <span className="font-medium text-gray-800">FDR Account</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-rose-600" size={18} />
                    </Link>
                    <Link to="/committees-list" className="group flex items-center justify-between p-4 rounded-lg border hover:border-amber-300 hover:bg-amber-50 transition">
                        <div className="flex items-center gap-3">
                            <GitCommit className="text-amber-600" size={20} />
                            <span className="font-medium text-gray-800">Committees</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-amber-600" size={18} />
                    </Link>
                    <Link to="/payment-voucher" className="group flex items-center justify-between p-4 rounded-lg border hover:border-emerald-300 hover:bg-emerald-50 transition">
                        <div className="flex items-center gap-3">
                            <ArrowUpCircle className="text-emerald-600" size={20} />
                            <span className="font-medium text-gray-800">Payment Voucher</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-emerald-600" size={18} />
                    </Link>
                    <Link to="/received-voucher" className="group flex items-center justify-between p-4 rounded-lg border hover:border-sky-300 hover:bg-sky-50 transition">
                        <div className="flex items-center gap-3">
                            <ArrowDownCircle className="text-sky-600" size={20} />
                            <span className="font-medium text-gray-800">Received Voucher</span>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-sky-600" size={18} />
                    </Link>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Roles</h3>
                <div className="flex flex-wrap gap-2">
                    {user?.roles?.map(role => (
                        <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {role.name}
                        </span>
                    ))}
                </div>
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">System Status</h4>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        Online
                    </div>
                </div>
            </div>
        </div>

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
                        pendingCommittees.map(item => (
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
    </div>
);

const UserDashboard = ({ stats, transactions, requests, loading, user }) => {
    const formatCurrency = (amt) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amt || 0);

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
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br ${card.bg} opacity-10 rounded-full transition-transform group-hover:scale-110`} />
                        <div className={`inline-flex p-3 rounded-xl bg-${card.color}-50 text-${card.color}-600 mb-4`}>
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
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{t.naration}</td>
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
    const { user } = useAuth();
    const isAdmin = user?.roles?.some(role => ['super-admin', 'admin', 'manager'].includes(role.slug));
    const [loading, setLoading] = useState(true);
    const [adminStats, setAdminStats] = useState({
        users: null, roles: null, members: null, committees: null,
        loans: null, dps: null, fdr: null, paymentVouchers: null, receivedVouchers: null
    });
    const [pendingCommittees, setPendingCommittees] = useState([]);

    const [userDashboardData, setUserDashboardData] = useState({
        stats: { savings_balance: 0, loan_outstanding: 0, dps_balance: 0, fdr_balance: 0 },
        recent_transactions: [],
        recent_requests: []
    });

    useEffect(() => {
        if (isAdmin) {
            fetchAdminStats();
        } else {
            fetchUserDashboard();
        }
    }, [isAdmin]);

    const fetchAdminStats = async () => {
        setLoading(true);
        try {
            const requests = [
                api.get('/users'), api.get('/roles'), api.get('/members'),
                api.get('/committees'), api.get('/loan-applications'),
                api.get('/dps-applications'), api.get('/fdr-applications'),
                api.get('/payment-voucher'), api.get('/received-voucher'),
                api.get('/committees', { params: { status: 'submitted' } })
            ];
            const results = await Promise.allSettled(requests);
            const extractTotal = (res) => {
                if (!res || res.status !== 'fulfilled') return null;
                const d = res.value?.data;
                if (typeof d?.total === 'number') return d.total;
                const arr = Array.isArray(d) ? d : d?.data;
                return Array.isArray(arr) ? arr.length : null;
            };
            const extractList = (res) => {
                if (!res || res.status !== 'fulfilled') return [];
                const d = res.value?.data;
                if (Array.isArray(d)) return d;
                if (Array.isArray(d?.data)) return d.data;
                return [];
            };
            setAdminStats({
                users: extractTotal(results[0]),
                roles: extractTotal(results[1]),
                members: extractTotal(results[2]),
                committees: extractTotal(results[3]),
                loans: extractTotal(results[4]),
                dps: extractTotal(results[5]),
                fdr: extractTotal(results[6]),
                paymentVouchers: extractTotal(results[7]),
                receivedVouchers: extractTotal(results[8]),
            });
            setPendingCommittees(extractList(results[9]).slice(0, 5));
        } catch (e) {
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

    if (isAdmin) {
        return <AdminDashboard stats={adminStats} loading={loading} pendingCommittees={pendingCommittees} user={user} />;
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
