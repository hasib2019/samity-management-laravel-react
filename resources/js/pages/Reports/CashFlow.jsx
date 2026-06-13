import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, Search, Printer } from 'lucide-react';

const CashFlow = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        opening_balance: 0,
        inflows: [],
        outflows: [],
        total_inflow: 0,
        total_outflow: 0,
        closing_balance: 0
    });
    
    // Default date range: First day of current month to today
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [filters, setFilters] = useState({
        date_from: firstDay.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0],
        samity_id: ''
    });
    
    const [samities, setSamities] = useState([]);

    useEffect(() => {
        fetchSamities();
    }, []);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities', {
            });
            setSamities(response.data);
        } catch (error) {
            console.error('Error fetching samities:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/cash-flow', {
                params: filters,
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching cash flow report:', error);
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

    return (
        <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-2xl font-bold text-gray-800">Cash Flow Statement</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg no-print">
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
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Samity (Optional)</label>
                    <select
                        value={filters.samity_id}
                        onChange={(e) => setFilters({...filters, samity_id: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Samities</option>
                        {samities.map(samity => (
                            <option key={samity.id} value={samity.id}>
                                {samity.samity_name} ({samity.samity_code})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Report Header (Visible in Print) */}
            <div className="hidden print:block text-center mb-8">
                <h2 className="text-2xl font-bold">Samity Management System</h2>
                <h3 className="text-xl">Cash Flow Statement</h3>
                <p>Period: {new Date(filters.date_from).toLocaleDateString()} to {new Date(filters.date_to).toLocaleDateString()}</p>
                {filters.samity_id && (
                    <p>Samity: {samities.find(s => s.id == filters.samity_id)?.samity_name}</p>
                )}
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    Loading report data...
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Opening Balance */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-blue-800">Opening Balance</h3>
                        <span className="text-xl font-bold text-blue-900">{formatCurrency(data.opening_balance)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Inflows */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 border-b-2 border-green-500 pb-2 text-green-700">Cash Inflows (Receipts)</h3>
                            <table className="w-full border-collapse border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-200 px-4 py-2 text-left">Particulars</th>
                                        <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.inflows.length === 0 ? (
                                        <tr><td colSpan="2" className="text-center py-4 text-gray-500">No Inflows</td></tr>
                                    ) : (
                                        data.inflows.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="border border-gray-200 px-4 py-2">
                                                    {item.account_name} <span className="text-xs text-gray-500">({item.account_code})</span>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 text-right">
                                                    {formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="bg-green-50 font-bold">
                                        <td className="border border-gray-200 px-4 py-2 text-right">Total Inflow</td>
                                        <td className="border border-gray-200 px-4 py-2 text-right text-green-700">
                                            {formatCurrency(data.total_inflow)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Outflows */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 border-b-2 border-red-500 pb-2 text-red-700">Cash Outflows (Payments)</h3>
                            <table className="w-full border-collapse border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-200 px-4 py-2 text-left">Particulars</th>
                                        <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.outflows.length === 0 ? (
                                        <tr><td colSpan="2" className="text-center py-4 text-gray-500">No Outflows</td></tr>
                                    ) : (
                                        data.outflows.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="border border-gray-200 px-4 py-2">
                                                    {item.account_name} <span className="text-xs text-gray-500">({item.account_code})</span>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 text-right">
                                                    {formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="bg-red-50 font-bold">
                                        <td className="border border-gray-200 px-4 py-2 text-right">Total Outflow</td>
                                        <td className="border border-gray-200 px-4 py-2 text-right text-red-700">
                                            {formatCurrency(data.total_outflow)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-100 p-6 rounded-lg mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            <div className="flex justify-between border-b border-gray-300 pb-2">
                                <span>Opening Balance:</span>
                                <span className="font-semibold">{formatCurrency(data.opening_balance)}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-300 pb-2 text-green-700">
                                <span>(+) Total Inflow:</span>
                                <span className="font-semibold">{formatCurrency(data.total_inflow)}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-300 pb-2 text-red-700">
                                <span>(-) Total Outflow:</span>
                                <span className="font-semibold">{formatCurrency(data.total_outflow)}</span>
                            </div>
                            <div className="flex justify-between pt-2 text-lg font-bold border-t-2 border-gray-400">
                                <span>Closing Balance:</span>
                                <span>{formatCurrency(data.closing_balance)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashFlow;
