import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, Printer } from 'lucide-react';

const BalanceSheet = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        assets: [],
        liabilities: [],
        net_profit: 0,
        total_assets: 0,
        total_liabilities_and_equity: 0
    });
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        samity_id: ''
    });
    const [samities, setSamities] = useState([]);

    useEffect(() => {
        fetchSamities();
    }, []);

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

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/reports/balance-sheet', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-2xl font-bold text-gray-800">Balance Sheet</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg no-print">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">As On Date</label>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters({...filters, date: e.target.value})}
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
                <h3 className="text-xl">Balance Sheet</h3>
                <p>As on: {new Date(filters.date).toLocaleDateString()}</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Assets Side */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b-2 border-green-500 pb-2">Assets (Property & Assets)</h3>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Account Name</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.assets.length === 0 ? (
                                    <tr><td colSpan="2" className="text-center py-4 text-gray-500">No Assets Found</td></tr>
                                ) : (
                                    data.assets.map((asset, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2">
                                                {asset.name} <span className="text-xs text-gray-500">({asset.code})</span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right">
                                                {Number(asset.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="border border-gray-300 px-4 py-2 text-right">Total Assets</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {Number(data.total_assets).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Liabilities & Equity Side */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 border-b-2 border-red-500 pb-2">Liabilities & Equity</h3>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Account Name</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.liabilities.length === 0 ? (
                                    <tr><td colSpan="2" className="text-center py-4 text-gray-500">No Liabilities Found</td></tr>
                                ) : (
                                    data.liabilities.map((liability, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2">
                                                {liability.name} <span className="text-xs text-gray-500">({liability.code})</span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right">
                                                {Number(liability.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                
                                {/* Net Profit / Loss */}
                                <tr className="bg-yellow-50 font-semibold">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Net Profit / (Loss)
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {Number(data.net_profit).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                </tr>

                                <tr className="bg-gray-100 font-bold">
                                    <td className="border border-gray-300 px-4 py-2 text-right">Total Liabilities & Equity</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {Number(data.total_liabilities_and_equity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <style>{`
                @media print {
                    .no-print {
                        display: none;
                    }
                    body {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default BalanceSheet;
