import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const initialForm = {
    project_declaration_id: '',
    member_id: '',
    tran_date: new Date().toISOString().split('T')[0],
    share_qty: '',
    remarks: '',
};

const ProjectShareSale = () => {
    const { hasPermission } = useAuth();
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchProjects();
        fetchMembers();
        fetchSales();
    }, []);

    const activeProject = useMemo(
        () => projects.find((project) => String(project.id) === String(formData.project_declaration_id)),
        [projects, formData.project_declaration_id]
    );

    const filteredMembers = useMemo(() => {
        if (!activeProject?.samity_id) return [];
        return members.filter((member) => String(member.samity_id) === String(activeProject.samity_id));
    }, [members, activeProject]);

    const totalAmount = useMemo(() => {
        const qty = parseFloat(formData.share_qty || 0);
        const rate = parseFloat(activeProject?.share_price || 0);
        return (qty * rate).toFixed(2);
    }, [formData.share_qty, activeProject]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/project-declarations', { params: { status: 'active' } });
            setProjects(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/global/members');
            setMembers(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await api.get('/project-share-sales', { params: { tran_type: 'purchase' } });
            setSales(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load project sales', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'project_declaration_id' ? { member_id: '' } : {}),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/project-share-sales', formData);
            Swal.fire('Success', 'Project share sale recorded successfully', 'success');
            setFormData(initialForm);
            fetchProjects();
            fetchSales();
        } catch (error) {
            const message = error.response?.data?.error || error.response?.data?.message || 'Failed to record sale';
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasPermission('project.share.sale.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Project Share Sale</h1>
                <p className="text-sm text-gray-500">Sell declared project shares to members.</p>
            </div>

            {hasPermission('project.share.sale.create') && (
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Project</label>
                            <select name="project_declaration_id" value={formData.project_declaration_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                <option value="">Select project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.project_code} - {project.project_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Member</label>
                            <select name="member_id" value={formData.member_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                <option value="">Select member</option>
                                {filteredMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.member_name} ({member.member_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Sale Date</label>
                            <input type="date" name="tran_date" value={formData.tran_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Share Qty</label>
                            <input type="number" step="0.01" min="1" name="share_qty" value={formData.share_qty} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="p-4 rounded-lg bg-blue-50">
                            <div className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Samity</div>
                            <div className="text-lg font-bold text-blue-900">{activeProject?.samity?.samity_name || '-'}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50">
                            <div className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Share Price</div>
                            <div className="text-lg font-bold text-blue-900">{activeProject?.share_price || '0.00'}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50">
                            <div className="text-xs font-semibold tracking-wide text-green-700 uppercase">Available Shares</div>
                            <div className="text-lg font-bold text-green-900">{activeProject?.available_share_qty || '0.00'}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-50">
                            <div className="text-xs font-semibold tracking-wide text-purple-700 uppercase">Total Amount</div>
                            <div className="text-lg font-bold text-purple-900">{totalAmount}</div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Record Sale'}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Rate</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center">Loading...</td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">No share sale found.</td>
                            </tr>
                        ) : sales.map((sale) => (
                            <tr key={sale.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">{sale.tran_date}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{sale.project?.project_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{sale.member?.member_name}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{sale.share_qty}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{sale.rate}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{sale.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectShareSale;
