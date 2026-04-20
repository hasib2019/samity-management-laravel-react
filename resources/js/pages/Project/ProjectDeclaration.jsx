import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { Plus, Edit, Save, X } from 'lucide-react';

const initialForm = {
    project_code: '',
    project_name: '',
    samity_id: '',
    description: '',
    declaration_date: new Date().toISOString().split('T')[0],
    total_shares: '',
    share_price: '',
    investment_gl_id: '',
    investor_fund_gl_id: '',
    cash_gl_id: '',
    profit_distribution_gl_id: '',
    samity_income_gl_id: '',
    status: 'active',
};

const ProjectDeclaration = () => {
    const { hasPermission } = useAuth();
    const [projects, setProjects] = useState([]);
    const [samities, setSamities] = useState([]);
    const [glAccounts, setGlAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchProjects();
        fetchSamities();
        fetchGlAccounts();
    }, []);

    const targetAmount = useMemo(() => {
        const shares = parseFloat(formData.total_shares || 0);
        const price = parseFloat(formData.share_price || 0);
        return (shares * price).toFixed(2);
    }, [formData.total_shares, formData.share_price]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/project-declarations');
            setProjects(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load projects', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            setSamities(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGlAccounts = async () => {
        try {
            const response = await api.get('/gl-accounts', { params: { parent_child: 'C' } });
            setGlAccounts(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditingProject(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            project_code: project.project_code || '',
            project_name: project.project_name || '',
            samity_id: project.samity_id || '',
            description: project.description || '',
            declaration_date: project.declaration_date ? project.declaration_date.split('T')[0] : '',
            total_shares: project.total_shares || '',
            share_price: project.share_price || '',
            investment_gl_id: project.investment_gl_id || '',
            investor_fund_gl_id: project.investor_fund_gl_id || '',
            cash_gl_id: project.cash_gl_id || '',
            profit_distribution_gl_id: project.profit_distribution_gl_id || '',
            samity_income_gl_id: project.samity_income_gl_id || '',
            status: project.status || 'active',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await api.put(`/project-declarations/${editingProject.id}`, formData);
                Swal.fire('Success', 'Project updated successfully', 'success');
            } else {
                await api.post('/project-declarations', formData);
                Swal.fire('Success', 'Project declared successfully', 'success');
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (error) {
            const message = error.response?.data?.message || 'Operation failed';
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : message, 'error');
        }
    };

    if (!hasPermission('project.declaration.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Project Declaration</h1>
                    <p className="text-sm text-gray-500">Declare projects, define share structure and GL mapping.</p>
                </div>
                {hasPermission('project.declaration.create') && (
                    <button onClick={handleCreate} className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </button>
                )}
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Code</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Samity</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Shares</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Target</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Sold</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-6 text-center">Loading...</td>
                            </tr>
                        ) : projects.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-6 text-center text-gray-500">No project declared yet.</td>
                            </tr>
                        ) : projects.map((project) => (
                            <tr key={project.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.project_code}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div>{project.project_name}</div>
                                    <div className="text-xs text-gray-400">{project.declaration_date}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{project.samity?.samity_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{project.total_shares}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{project.target_amount}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{project.sold_amount}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        project.status === 'active' ? 'bg-green-100 text-green-700' :
                                        project.status === 'closed' ? 'bg-gray-200 text-gray-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {hasPermission('project.declaration.edit') && project.status !== 'closed' && (
                                        <button onClick={() => handleEdit(project)} className="text-indigo-600 hover:text-indigo-800">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
                    <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingProject ? 'Edit Project' : 'Declare Project'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Project Code</label>
                                    <input name="project_code" value={formData.project_code} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Project Name</label>
                                    <input name="project_name" value={formData.project_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Samity</label>
                                    <select name="samity_id" value={formData.samity_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                        <option value="">Select Samity</option>
                                        {samities.map((samity) => (
                                            <option key={samity.id} value={samity.id}>
                                                {samity.samity_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Declaration Date</label>
                                    <input type="date" name="declaration_date" value={formData.declaration_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Total Shares</label>
                                    <input type="number" step="0.01" name="total_shares" value={formData.total_shares} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Share Price</label>
                                    <input type="number" step="0.01" name="share_price" value={formData.share_price} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50 md:col-span-2">
                                    <div className="text-sm font-medium text-blue-700">Target Amount</div>
                                    <div className="text-xl font-bold text-blue-900">{targetAmount}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">GL Mapping</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {[
                                        ['investment_gl_id', 'Project Investment GL'],
                                        ['investor_fund_gl_id', 'Investor Fund GL'],
                                        ['cash_gl_id', 'Cash GL'],
                                        ['profit_distribution_gl_id', 'Profit Distribution GL'],
                                        ['samity_income_gl_id', 'Samity Income GL'],
                                    ].map(([field, label]) => (
                                        <div key={field}>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
                                            <select name={field} value={formData[field]} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                                <option value="">Select GL</option>
                                                {glAccounts.map((gl) => (
                                                    <option key={gl.id} value={gl.id}>
                                                        {gl.glac_code} - {gl.glac_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingProject ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDeclaration;
