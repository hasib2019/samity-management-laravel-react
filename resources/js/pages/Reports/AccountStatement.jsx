import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, Printer, FileText } from 'lucide-react';

const AccountStatement = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    
    // Filters
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    
    const [filters, setFilters] = useState({
        samity_id: '',
        member_id: '',
        account_id: '',
        account_type: '', // 'savings' or 'loan'
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchSamities();
    }, []);

    useEffect(() => {
        if (filters.samity_id) {
            fetchMembers(filters.samity_id);
            setFilters(prev => ({ ...prev, member_id: '', account_id: '', account_type: '' }));
            setMembers([]);
            setAccounts([]);
        } else {
            setMembers([]);
            setAccounts([]);
        }
    }, [filters.samity_id]);

    useEffect(() => {
        if (filters.member_id) {
            fetchAccounts(filters.member_id);
            setFilters(prev => ({ ...prev, account_id: '', account_type: '' }));
            setAccounts([]);
        } else {
            setAccounts([]);
        }
    }, [filters.member_id]);

    const fetchSamities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/global/samities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSamities(response.data);
        } catch (error) {
            console.error('Error fetching samities:', error);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/global/members?samity_id=${samityId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const fetchAccounts = async (memberId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/global/members/${memberId}/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Combine savings and loans into a single list for the dropdown
            const combinedAccounts = [
                ...response.data.savings.map(acc => ({
                    id: acc.id,
                    type: 'savings',
                    account_no: acc.account_no,
                    product_name: acc.product?.product_name || 'Savings'
                })),
                ...response.data.loans.map(acc => ({
                    id: acc.id,
                    type: 'loan',
                    account_no: acc.account_no,
                    product_name: acc.product?.product_name || 'Loan'
                }))
            ];
            setAccounts(combinedAccounts);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleAccountChange = (e) => {
        const value = e.target.value;
        if (value) {
            const [type, id] = value.split('-');
            setFilters(prev => ({ ...prev, account_type: type, account_id: id }));
        } else {
            setFilters(prev => ({ ...prev, account_type: '', account_id: '' }));
        }
    };

    const fetchReport = async () => {
        if (!filters.account_id || !filters.account_type) {
            alert('Please select an account');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/reports/account-statement', {
                params: {
                    type: filters.account_type,
                    account_id: filters.account_id,
                    date_from: filters.date_from,
                    date_to: filters.date_to
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching account statement:', error);
            alert('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Calculate running balance
    const calculateRunningBalance = (transactions, openingBalance) => {
        let balance = openingBalance;
        return transactions.map(t => {
            // For Savings (Liability): Cr increases, Dr decreases
            // For Loans (Asset): Dr increases, Cr decreases
            // The backend logic for Opening Balance was:
            // Savings: Cr - Dr
            // Loans: Dr - Cr
            
            // So for running balance:
            if (filters.account_type === 'savings') {
                balance = balance + (Number(t.cr_amt) || 0) - (Number(t.dr_amt) || 0);
            } else {
                balance = balance + (Number(t.dr_amt) || 0) - (Number(t.cr_amt) || 0);
            }
            return { ...t, balance };
        });
    };

    const processedTransactions = data ? calculateRunningBalance(data.transactions, data.opening_balance) : [];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Account Statement
                </h1>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <Printer size={20} />
                        Print
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg no-print">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Samity</label>
                    <select
                        value={filters.samity_id}
                        onChange={(e) => setFilters({...filters, samity_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Samity</option>
                        {samities.map(samity => (
                            <option key={samity.id} value={samity.id}>
                                {samity.samity_name} ({samity.samity_code})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                    <select
                        value={filters.member_id}
                        onChange={(e) => setFilters({...filters, member_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!filters.samity_id}
                    >
                        <option value="">Select Member</option>
                        {members.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.member_name} ({member.member_code})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <select
                        value={filters.account_type && filters.account_id ? `${filters.account_type}-${filters.account_id}` : ''}
                        onChange={handleAccountChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!filters.member_id}
                    >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                            <option key={`${acc.type}-${acc.id}`} value={`${acc.type}-${acc.id}`}>
                                {acc.product_name} - {acc.account_no} ({acc.type})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchReport}
                            disabled={loading || !filters.account_id}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Header (Visible in Print) */}
            <div className="hidden print:block text-center mb-8">
                <h2 className="text-2xl font-bold">Samity Management System</h2>
                <h3 className="text-xl">Account Statement</h3>
                <p>Period: {formatDate(filters.date_from)} to {formatDate(filters.date_to)}</p>
                {data && (
                    <div className="mt-4 text-left border p-4 rounded">
                        <p><strong>Member:</strong> {members.find(m => m.id == filters.member_id)?.member_name} ({members.find(m => m.id == filters.member_id)?.member_code})</p>
                        <p><strong>Account:</strong> {data.account?.product?.product_name || data.account?.loan_application?.product?.product_name} - {data.account?.account_no}</p>
                    </div>
                )}
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    Loading report data...
                </div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Account Info Card (Screen only) */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 no-print">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Account Details</h3>
                                <p className="text-lg font-bold text-gray-900">
                                    {data.account?.product?.product_name || data.account?.loan_application?.product?.product_name}
                                </p>
                                <p className="text-gray-600">Account No: {data.account?.account_no}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Current Balance</h3>
                                <p className="text-2xl font-bold text-blue-900">
                                    {formatCurrency(processedTransactions.length > 0 ? processedTransactions[processedTransactions.length - 1].balance : data.opening_balance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">Voucher</th>
                                    <th className="border border-gray-200 px-4 py-2 text-left">Particulars</th>
                                    <th className="border border-gray-200 px-4 py-2 text-right">Debit</th>
                                    <th className="border border-gray-200 px-4 py-2 text-right">Credit</th>
                                    <th className="border border-gray-200 px-4 py-2 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Opening Balance Row */}
                                <tr className="bg-gray-50 font-medium">
                                    <td className="border border-gray-200 px-4 py-2" colSpan="5">Opening Balance</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right">{formatCurrency(data.opening_balance)}</td>
                                </tr>

                                {/* Transactions */}
                                {processedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                                            No transactions found in this period.
                                        </td>
                                    </tr>
                                ) : (
                                    processedTransactions.map((t, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-200 px-4 py-2 whitespace-nowrap">{formatDate(t.tran_date)}</td>
                                            <td className="border border-gray-200 px-4 py-2">{t.batch_num || t.tran_num}</td>
                                            <td className="border border-gray-200 px-4 py-2">{t.naration || 'Transaction'}</td>
                                            <td className="border border-gray-200 px-4 py-2 text-right text-red-600">
                                                {Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : '-'}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 text-right text-green-600">
                                                {Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : '-'}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-2 text-right font-medium">
                                                {formatCurrency(t.balance)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-lg">Select an account and click "Generate Report" to view the statement.</p>
                </div>
            )}
        </div>
    );
};

export default AccountStatement;
