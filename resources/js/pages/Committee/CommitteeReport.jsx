import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, FileText, Printer } from 'lucide-react';

const CommitteeReport = () => {
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        samity_id: '',
        status: ''
    });

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.samity_id) params.samity_id = filter.samity_id;
            if (filter.status) params.status = filter.status;
            
            const response = await api.get('/committees', { params });
            setCommittees(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600" />
                        Committee Reports
                    </h1>
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <Printer size={20} />
                        Print
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex gap-4 mb-6">
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        {/* Add Samity filter if needed */}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-4">Committee Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Samity</th>
                                    <th className="px-6 py-4 text-center">Members</th>
                                    <th className="px-6 py-4">Effective Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                ) : committees.length > 0 ? (
                                    committees.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.committee_type?.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.samity?.samity_name}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{c.member_count}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.effective_date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    c.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    c.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                }`}>
                                                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No reports found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitteeReport;
