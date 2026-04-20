import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const initialForm = {
    project_declaration_id: '',
    closing_date: new Date().toISOString().split('T')[0],
    closing_value: '',
    closing_expense: '0',
    distributable_profit: '',
    remarks: '',
};

const ProjectClosing = () => {
    const { hasPermission } = useAuth();
    const [projects, setProjects] = useState([]);
    const [closings, setClosings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchProjects();
        fetchClosings();
    }, []);

    const selectedProject = useMemo(
        () => projects.find((project) => String(project.id) === String(formData.project_declaration_id)),
        [projects, formData.project_declaration_id]
    );

    const totalInvested = parseFloat(selectedProject?.sold_amount || 0);
    const closingValue = parseFloat(formData.closing_value || 0);
    const closingExpense = parseFloat(formData.closing_expense || 0);
    const netProfit = (closingValue - totalInvested - closingExpense).toFixed(2);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/project-declarations', { params: { status: 'active' } });
            setProjects(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchClosings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/project-closings');
            setClosings(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load project closings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/project-closings', formData);
            Swal.fire('Success', 'Project closed successfully', 'success');
            setFormData(initialForm);
            fetchProjects();
            fetchClosings();
        } catch (error) {
            const message = error.response?.data?.error || error.response?.data?.message || 'Failed to close project';
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasPermission('project.closing.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Project Closing</h1>
                <p className="text-sm text-gray-500">Close project and distribute profit to investors.</p>
            </div>

            {hasPermission('project.closing.create') && (
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
                            <label className="block mb-1 text-sm font-medium text-gray-700">Closing Date</label>
                            <input type="date" name="closing_date" value={formData.closing_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Closing Value</label>
                            <input type="number" step="0.01" name="closing_value" value={formData.closing_value} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Closing Expense</label>
                            <input type="number" step="0.01" name="closing_expense" value={formData.closing_expense} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="p-4 rounded-lg bg-slate-50">
                            <div className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Samity</div>
                            <div className="text-lg font-bold text-slate-900">{selectedProject?.samity?.samity_name || '-'}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50">
                            <div className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Invested Amount</div>
                            <div className="text-lg font-bold text-blue-900">{totalInvested.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50">
                            <div className="text-xs font-semibold tracking-wide text-green-700 uppercase">Estimated Net Profit</div>
                            <div className="text-lg font-bold text-green-900">{netProfit}</div>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Distributable Profit</label>
                            <input type="number" step="0.01" name="distributable_profit" value={formData.distributable_profit} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Blank = distribute all profit" />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Closing...' : 'Close Project'}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Closing Date</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Invested</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Closing Value</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Distributed</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Samity Income</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center">Loading...</td>
                            </tr>
                        ) : closings.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">No project closing found.</td>
                            </tr>
                        ) : closings.map((closing) => (
                            <tr key={closing.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">{closing.project?.project_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{closing.closing_date}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{closing.total_invested}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{closing.closing_value}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{closing.distributable_profit}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{closing.samity_income}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectClosing;
