import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, Plus, Filter, FileText, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const DpsList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchApplications();
    }, [statusFilter]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await api.get('/dps-applications', { params });
            setApplications(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching DPS list:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = applications.filter(app => 
        app.account_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.member?.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.member?.member_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        DPS Account List
                    </h1>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                            <option value="matured">Matured</option>
                        </select>
                        <Link
                            to="/dps-account"
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={18} />
                            New Account
                        </Link>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Account No</th>
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4 text-right">Monthly</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">Maturity</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredApps.length > 0 ? (
                                filteredApps.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {app.account_no}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {app.member?.member_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{app.member?.member_name}</p>
                                                    <p className="text-xs text-gray-500">{app.member?.member_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {app.product?.product_name}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                                            ৳{app.dps_amount}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                                            ৳{parseFloat(app.balance).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {app.start_date}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {app.maturity_date}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                app.status === 'active' 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : app.status === 'closed'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No DPS accounts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DpsList;
