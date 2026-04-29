import React, { useEffect, useMemo, useState } from 'react';
import { Printer, Search } from 'lucide-react';
import api from '../../api/axios';

const AccountBalance = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [samities, setSamities] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [summary, setSummary] = useState({
        total_balance: 0,
        total_accounts: 0,
    });
    const [filters, setFilters] = useState({
        samity_id: '',
        account_type: 'all',
        search: '',
    });

    useEffect(() => {
        fetchSamities();
        generateReport();
    }, []);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            setSamities(response.data);
        } catch (error) {
            console.error('Error fetching samities:', error);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/account-balance', {
                params: {
                    samity_id: filters.samity_id || undefined,
                    account_type: filters.account_type || 'all',
                },
            });
            setReportData(response.data.data);
            setSummary({
                total_balance: Number(response.data.total_balance || 0),
                total_accounts: Number(response.data.total_accounts || 0),
            });
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredReportData = useMemo(() => {
        const term = filters.search.trim().toLowerCase();

        if (!term) {
            return reportData;
        }

        return reportData.filter((item) => (
            String(item.samity_name || '').toLowerCase().includes(term)
            || String(item.member_name || '').toLowerCase().includes(term)
            || String(item.member_code || '').toLowerCase().includes(term)
            || String(item.account_no || '').toLowerCase().includes(term)
            || String(item.product_name || '').toLowerCase().includes(term)
            || String(item.type || '').toLowerCase().includes(term)
        ));
    }, [reportData, filters.search]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const typeBadgeClass = (type) => {
        const normalized = String(type).toLowerCase();

        if (normalized.includes('saving')) return 'bg-green-100 text-green-800';
        if (normalized.includes('member loan')) return 'bg-orange-100 text-orange-800';
        if (normalized.includes('loan')) return 'bg-red-100 text-red-800';
        if (normalized.includes('share')) return 'bg-indigo-100 text-indigo-800';
        if (normalized.includes('dps')) return 'bg-yellow-100 text-yellow-800';
        if (normalized.includes('fdr')) return 'bg-purple-100 text-purple-800';

        return 'bg-blue-100 text-blue-800';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold text-gray-800">Account Balance Report</h1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <Printer size={20} />
                    <span>Print Report</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Samity</label>
                        <select
                            value={filters.samity_id}
                            onChange={(e) => setFilters({ ...filters, samity_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Samities</option>
                            {samities.map(samity => (
                                <option key={samity.id} value={samity.id}>
                                    {samity.samity_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <select
                            value={filters.account_type}
                            onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Accounts</option>
                            <option value="savings">Savings</option>
                            <option value="share">Share</option>
                            <option value="dps">DPS</option>
                            <option value="fdr">FDR</option>
                            <option value="loan">Loan</option>
                            <option value="member_loan">Member Loan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Member, code, account no"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : (
                                <>
                                    <Search size={20} />
                                    <span>Generate Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:hidden">
                <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500">Total Accounts</div>
                    <div className="text-2xl font-bold text-gray-800">{summary.total_accounts}</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
                    <div className="text-sm text-gray-500">Total Balance</div>
                    <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total_balance)}</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none">
                <div className="p-6 border-b border-gray-200 print:border-none">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Account Balance Report</h2>
                        <p className="text-gray-600 mt-1">Sob member-er current balance ek screen-e dekhano hocche.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Samity</th>
                                <th className="px-4 py-3">Member</th>
                                <th className="px-4 py-3">Account No</th>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                                <th className="px-4 py-3 text-center print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredReportData.length > 0 ? (
                                filteredReportData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">{item.samity_name}</td>
                                        <td className="px-4 py-2">
                                            <div>{item.member_name}</div>
                                            <div className="text-xs text-gray-500">{item.member_code}</div>
                                        </td>
                                        <td className="px-4 py-2 font-mono">{item.account_no}</td>
                                        <td className="px-4 py-2">{item.product_name}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${typeBadgeClass(item.type)}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 capitalize">{item.status || '-'}</td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            {formatCurrency(item.balance)}
                                        </td>
                                        <td className="px-4 py-2 text-center print:hidden">
                                            <button
                                                onClick={() => setSelectedRow(item)}
                                                className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                        No account balance found for selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredReportData.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold">
                                <tr>
                                    <td colSpan="6" className="px-4 py-3 text-right">Total Balance:</td>
                                    <td className="px-4 py-3 text-right">
                                        {formatCurrency(filteredReportData.reduce((sum, item) => sum + Number(item.balance), 0))}
                                    </td>
                                    <td className="print:hidden" />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {selectedRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 print:hidden">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Account Balance Details</h2>
                                <p className="text-sm text-gray-500">Selected account-er full data ekhane dekhano hocche.</p>
                            </div>
                            <button
                                onClick={() => setSelectedRow(null)}
                                className="px-3 py-1 text-sm text-gray-600 border rounded-md hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-gray-500">Samity</div>
                                <div className="font-medium text-gray-800">{selectedRow.samity_name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Member</div>
                                <div className="font-medium text-gray-800">{selectedRow.member_name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Member Code</div>
                                <div className="font-medium text-gray-800">{selectedRow.member_code || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Account No</div>
                                <div className="font-medium text-gray-800">{selectedRow.account_no || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Product</div>
                                <div className="font-medium text-gray-800">{selectedRow.product_name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Type</div>
                                <div className="font-medium text-gray-800">{selectedRow.type || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Status</div>
                                <div className="font-medium text-gray-800 capitalize">{selectedRow.status || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Balance</div>
                                <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedRow.balance || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountBalance;
