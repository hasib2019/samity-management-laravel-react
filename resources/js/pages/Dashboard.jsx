import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Users, Shield, UserCheck, GitCommit, ArrowRight, HandCoins, CreditCard, FileText, Receipt, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: null,
        roles: null,
        members: null,
        committees: null,
        loans: null,
        dps: null,
        fdr: null,
        paymentVouchers: null,
        receivedVouchers: null
    });
    const [pendingCommittees, setPendingCommittees] = useState([]);

    useEffect(() => {
        const fetchCounts = async () => {
            setLoading(true);
            try {
                const requests = [
                    api.get('/users'),
                    api.get('/roles'),
                    api.get('/members'),
                    api.get('/committees'),
                    api.get('/loan-applications'),
                    api.get('/dps-applications'),
                    api.get('/fdr-applications'),
                    api.get('/payment-voucher'),
                    api.get('/received-voucher'),
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
                setStats({
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
        fetchCounts();
    }, []);

    return (
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
};

export default Dashboard;
