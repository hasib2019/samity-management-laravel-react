import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Download, Search, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FinancialReports = () => {
    const [activeTab, setActiveTab] = useState('dues'); // 'dues' or 'collections'
    const [loading, setLoading] = useState(false);
    
    // Due Report State
    const [dueReport, setDueReport] = useState([]);
    const [dueSummary, setDueSummary] = useState(null);

    // Collection Report State
    const [collectionReport, setCollectionReport] = useState([]);
    const [collectionSummary, setCollectionSummary] = useState(null);
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (activeTab === 'dues') {
            fetchDueReport();
        } else {
            fetchCollectionReport();
        }
    }, [activeTab]);

    const fetchDueReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/financial-reports/dues');
            setDueReport(response.data.report);
            setDueSummary(response.data.summary);
        } catch (error) {
            console.error("Failed to fetch due report", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollectionReport = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateRange.start_date) params.start_date = dateRange.start_date;
            if (dateRange.end_date) params.end_date = dateRange.end_date;

            const response = await api.get('/financial-reports/collections', { params });
            setCollectionReport(response.data.collections);
            setCollectionSummary(response.data.summary);
        } catch (error) {
            console.error("Failed to fetch collection report", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Financial Reports</h2>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('dues')}
                        className={`${
                            activeTab === 'dues'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Due Report
                    </button>
                    <button
                        onClick={() => setActiveTab('collections')}
                        className={`${
                            activeTab === 'collections'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Collection Report
                    </button>
                </nav>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <>
                    {activeTab === 'dues' && (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            {dueSummary && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                        <p className="text-sm text-red-600 font-medium">Total Members with Due</p>
                                        <p className="text-2xl font-bold text-red-800">{dueSummary.total_members_with_due}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                        <p className="text-sm text-yellow-600 font-medium">Total Basic Due</p>
                                        <p className="text-2xl font-bold text-yellow-800">{dueSummary.grand_total_basic_due} BDT</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                        <p className="text-sm text-orange-600 font-medium">Total Penalty Due</p>
                                        <p className="text-2xl font-bold text-orange-800">{dueSummary.grand_total_penalty_due} BDT</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-sm text-blue-600 font-medium">Total Receivables</p>
                                        <p className="text-2xl font-bold text-blue-800">{dueSummary.grand_total_payable} BDT</p>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Months Due</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Due</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dueReport.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.member_name}</div>
                                                    <div className="text-sm text-gray-500">{item.member_code}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.due_months_count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                    {item.basic_due}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                                    {item.penalty_due}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                                    {item.total_payable}
                                                </td>
                                            </tr>
                                        ))}
                                        {dueReport.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    No dues found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collections' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex gap-4 items-end bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={dateRange.start_date}
                                        onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={dateRange.end_date}
                                        onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                                    />
                                </div>
                                <button
                                    onClick={fetchCollectionReport}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Filter
                                </button>
                            </div>

                            {/* Summary Cards */}
                            {collectionSummary && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <p className="text-sm text-green-600 font-medium">Total Collected</p>
                                        <p className="text-2xl font-bold text-green-800">{collectionSummary.total_collected} BDT</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <p className="text-sm text-purple-600 font-medium">Total Penalty Collected</p>
                                        <p className="text-2xl font-bold text-purple-800">{collectionSummary.total_penalty_collected} BDT</p>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <p className="text-sm text-indigo-600 font-medium">Total Revenue</p>
                                        <p className="text-2xl font-bold text-indigo-800">{collectionSummary.total_revenue} BDT</p>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {collectionReport.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(item.collection_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.member?.member_name}</div>
                                                    <div className="text-sm text-gray-500">{item.member?.member_code}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.month}/{item.year}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                    {item.amount_collected}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                                    {item.penalty_collected}
                                                </td>
                                            </tr>
                                        ))}
                                        {collectionReport.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                    No collections found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FinancialReports;
