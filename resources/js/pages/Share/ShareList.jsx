import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Filter, PieChart, User, DollarSign, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ShareList = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, [page]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/share-accounts?page=${page}&query=${searchTerm}`);
            setAccounts(response.data.data);
            setPagination(response.data);
        } catch (err) {
            console.error('Error fetching share accounts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchAccounts();
    };

    const formatCurrency = (amt) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amt || 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <PieChart className="text-blue-600" />
                            Share Accounts
                        </h1>
                        <p className="text-gray-500 text-sm">View and manage member share portfolios</p>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search accounts..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                            Search
                        </button>
                    </form>
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Account No</th>
                                    <th className="px-6 py-4">Member</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-center">Total Shares</th>
                                    <th className="px-6 py-4 text-center">Face Value</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="7" className="px-6 py-4">
                                                <div className="h-10 bg-gray-50 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-lg">No share accounts found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map(acc => (
                                        <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-blue-600">{acc.account_no}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{acc.member?.member_name}</div>
                                                <div className="text-xs text-gray-500">{acc.member?.member_code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{acc.product?.product_name}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900">{acc.total_shares}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{formatCurrency(acc.face_value)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(acc.current_balance)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {acc.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > 0 && (
                        <div className="p-4 bg-gray-50/50 border-t flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-medium">
                                Showing {pagination.from} to {pagination.to} of {pagination.total} accounts
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                                    disabled={page === pagination.last_page}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareList;
