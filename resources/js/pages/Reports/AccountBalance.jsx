import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Printer, Search, Download } from 'lucide-react';

const AccountBalance = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [samities, setSamities] = useState([]);
    const [filters, setFilters] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        samity_id: ''
    });

    useEffect(() => {
        fetchSamities();
    }, []);

    const fetchSamities = async () => {
        try {
            const response = await axios.get('/api/global/samities');
            setSamities(response.data);
        } catch (error) {
            console.error('Error fetching samities:', error);
        }
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/account-balance', { params: filters });
            setReportData(response.data.data);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="space-y-6">
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

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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

            {/* Report Content */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none">
                <div className="p-6 border-b border-gray-200 print:border-none">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Account Balance Report</h2>
                        <p className="text-gray-600 mt-1">
                            As of {format(new Date(filters.date), 'dd MMMM yyyy')}
                        </p>
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
                                <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.length > 0 ? (
                                reportData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">{item.samity_name}</td>
                                        <td className="px-4 py-2">
                                            <div>{item.member_name}</div>
                                            <div className="text-xs text-gray-500">{item.member_code}</div>
                                        </td>
                                        <td className="px-4 py-2 font-mono">{item.account_no}</td>
                                        <td className="px-4 py-2">{item.product_name}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                item.type === 'Savings' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            {formatCurrency(item.balance)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                        No data found. Please select filters and generate report.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold">
                                <tr>
                                    <td colSpan="5" className="px-4 py-3 text-right">Total Balance:</td>
                                    <td className="px-4 py-3 text-right">
                                        {formatCurrency(reportData.reduce((sum, item) => sum + Number(item.balance), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountBalance;
