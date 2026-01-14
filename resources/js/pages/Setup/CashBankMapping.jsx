import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';

const CashBankMapping = () => {
    const { hasPermission } = useAuth();
    const [mappings, setMappings] = useState([]);
    const [types, setTypes] = useState([]);
    const [glAccounts, setGlAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState(null);
    const [formData, setFormData] = useState({
        type_id: '',
        glac_id: '',
        description: '',
        status: 'active'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [mappingRes, typeRes, glRes] = await Promise.all([
                api.get('/cash-bank-mappings'),
                api.get('/types', { params: { type_for: 'cash_bank' } }),
                api.get('/gl-accounts', { params: { parent_child: 'C' } })
            ]);
            setMappings(mappingRes.data);
            setTypes(typeRes.data);
            setGlAccounts(glRes.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            type_id: '',
            glac_id: '',
            description: '',
            status: 'active'
        });
        setEditingMapping(null);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (mapping) => {
        setEditingMapping(mapping);
        setFormData({
            type_id: mapping.type_id,
            glac_id: mapping.glac_id,
            description: mapping.description || '',
            status: mapping.status || 'active'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMapping) {
                await api.put(`/cash-bank-mappings/${editingMapping.id}`, formData);
                Swal.fire('Success', 'Mapping updated successfully', 'success');
            } else {
                await api.post('/cash-bank-mappings', formData);
                Swal.fire('Success', 'Mapping created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchInitialData();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Operation failed';
            Swal.fire('Error', message, 'error');
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                Swal.fire('Validation Error', errors, 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/cash-bank-mappings/${id}`);
            Swal.fire('Deleted', 'Mapping deleted successfully', 'success');
            fetchInitialData();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to delete mapping', 'error');
        }
    };

    const getTypeName = (id) => {
        const t = types.find(x => x.id === id);
        return t ? t.name : '';
    };

    const getGlName = (id) => {
        const g = glAccounts.find(x => x.id === id);
        if (!g) return '';
        return `${g.glac_code} - ${g.glac_name}`;
    };

    const filteredMappings = mappings.filter(m =>
        getTypeName(m.type_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getGlName(m.glac_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!hasPermission('cash.bank.mapping.view')) {
        return <div className="py-10 text-center text-red-500">Permission Denied</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Cash/Bank Mapping</h1>
                {hasPermission('cash.bank.mapping.create') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" />
                        Add Mapping
                    </button>
                )}
            </div>

            <div className="p-4 mb-6 bg-white rounded-lg shadow">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by type or GL account..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
                {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                ) : filteredMappings.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">No mappings found</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Account</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMappings.map(mapping => (
                                <tr key={mapping.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{getTypeName(mapping.type_id)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{getGlName(mapping.glac_id)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{mapping.description}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 capitalize">{mapping.status}</td>
                                    <td className="px-4 py-2 text-sm text-right space-x-2">
                                        {hasPermission('cash.bank.mapping.edit') && (
                                            <button
                                                onClick={() => handleOpenEditModal(mapping)}
                                                className="inline-flex items-center px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                                            >
                                                <Edit className="mr-1 w-4 h-4" />
                                                Edit
                                            </button>
                                        )}
                                        {hasPermission('cash.bank.mapping.delete') && (
                                            <button
                                                onClick={() => handleDelete(mapping.id)}
                                                className="inline-flex items-center px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                                            >
                                                <Trash2 className="mr-1 w-4 h-4" />
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingMapping ? 'Edit Mapping' : 'Add Mapping'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Type</label>
                                <select
                                    name="type_id"
                                    value={formData.type_id}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {types.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">GL Account</label>
                                <select
                                    name="glac_id"
                                    value={formData.glac_id}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                >
                                    <option value="">Select GL Account</option>
                                    {glAccounts.map(gl => (
                                        <option key={gl.id} value={gl.id}>
                                            {gl.glac_code} - {gl.glac_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    <X className="mr-1 w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    <Save className="mr-1 w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashBankMapping;

