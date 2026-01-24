import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, Printer, FileDown } from 'lucide-react';

const TrialBalance = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });
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
            const response = await axios.get('/api/reports/trial-balance', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data.data);
            setTotals({
                debit: response.data.total_debit,
                credit: response.data.total_credit
            });
        } catch (error) {
            console.error('Error fetching trial balance:', error);
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
                <h1 className="text-2xl font-bold text-gray-800">Trial Balance</h1>
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
                <h3 className="text-xl">Trial Balance</h3>
                <p>As on: {new Date(filters.date).toLocaleDateString()}</p>
                {filters.samity_id && (
                    <p>Samity: {samities.find(s => s.id == filters.samity_id)?.samity_name}</p>
                )}
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left">GL Code</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">GL Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Debit</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-gray-500">
                                    Loading report data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-gray-500">
                                    No data found for the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {data.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2">{row.gl_code}</td>
                                        <td className="border border-gray-300 px-4 py-2">{row.gl_name}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right">
                                            {row.debit > 0 ? Number(row.debit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-right">
                                            {row.credit > 0 ? Number(row.credit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan="2" className="border border-gray-300 px-4 py-2 text-right">Total</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {Number(totals.debit).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                        {Number(totals.credit).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            
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

export default TrialBalance;
