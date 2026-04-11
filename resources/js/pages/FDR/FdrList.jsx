import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, Plus, Filter, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const FdrList = () => {
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
            if (searchTerm) {
                params.search = searchTerm;
            }
            const response = await api.get('/fdr-applications', { params });
            setApplications(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching FDR list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchApplications();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        FDR Account List
                    </h1>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search Account / Member..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </form>
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
                            to="/fdr-account"
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={18} />
                            New FDR
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
                                <th className="px-6 py-4 text-right">Principal</th>
                                <th className="px-6 py-4 text-right">Maturity Amount</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">Maturity Date</th>
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
                            ) : applications.length > 0 ? (
                                applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{app.account_no}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{app.member?.member_name || app.member?.name_en}</div>
                                            <div className="text-xs text-gray-500">{app.member?.member_code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{app.product?.product_name}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {parseFloat(app.fdr_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {parseFloat(app.maturity_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{app.start_date}</td>
                                        <td className="px-6 py-4 text-gray-600">{app.maturity_date}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                app.status === 'active' 
                                                    ? 'bg-green-50 text-green-700 border-green-100' 
                                                    : app.status === 'closed'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No FDR accounts found matching your criteria.
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

export default FdrList;
