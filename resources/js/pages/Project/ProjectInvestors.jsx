import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const ProjectInvestors = () => {
    const { hasPermission } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [investors, setInvestors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchInvestors(selectedProjectId);
        } else {
            setInvestors([]);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/project-declarations');
            setProjects(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchInvestors = async (projectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/project-declarations/${projectId}/investors`);
            setInvestors(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load investors', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!hasPermission('project.investor.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Project Investors</h1>
                <p className="text-sm text-gray-500">View investor wise project holding, refund and profit.</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
                <label className="block mb-2 text-sm font-medium text-gray-700">Select Project</label>
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full max-w-xl px-3 py-2 border rounded-lg"
                >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.project_code} - {project.project_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Samity</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Shares</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Invested</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Profit</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Refunded</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-6 text-center">Loading...</td>
                            </tr>
                        ) : investors.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">No investor data found.</td>
                            </tr>
                        ) : investors.map((investor) => (
                            <tr key={investor.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">{investor.member?.samity?.samity_name || investor.samity_id || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {investor.member?.member_name}
                                    <div className="text-xs text-gray-400">{investor.member?.member_code}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{investor.purchased_shares}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{investor.invested_amount}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{investor.profit_amount}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{investor.refunded_amount}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{investor.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectInvestors;
