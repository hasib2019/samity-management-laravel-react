import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';

const TypeSetup = () => {
    const { hasPermission } = useAuth();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFor, setFilterFor] = useState('voucher');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        type_for: 'voucher',
        name: '',
        code: '',
        description: '',
        status: 'active'
    });

    useEffect(() => {
        fetchTypes();
    }, [filterFor]);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/types', {
                params: { type_for: filterFor }
            });
            setTypes(response.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to load types', 'error');
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
            type_for: filterFor,
            name: '',
            code: '',
            description: '',
            status: 'active'
        });
        setEditingType(null);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (type) => {
        setEditingType(type);
        setFormData({
            type_for: type.type_for,
            name: type.name,
            code: type.code || '',
            description: type.description || '',
            status: type.status || 'active'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/types/${editingType.id}`, formData);
                Swal.fire('Success', 'Type updated successfully', 'success');
            } else {
                await api.post('/types', formData);
                Swal.fire('Success', 'Type created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchTypes();
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
            await api.delete(`/types/${id}`);
            Swal.fire('Deleted', 'Type deleted successfully', 'success');
            fetchTypes();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to delete type', 'error');
        }
    };

    const filteredTypes = types.filter(t =>
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!hasPermission('type.setup.view')) {
        return <div className="py-10 text-center text-red-500">Permission Denied</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Type Setup</h1>
                {hasPermission('type.setup.create') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" />
                        Add Type
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div className="p-4 bg-white rounded-lg shadow">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Type For</label>
                    <select
                        value={filterFor}
                        onChange={(e) => setFilterFor(e.target.value)}
                        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="voucher">Voucher</option>
                        <option value="cash_bank">Cash/Bank</option>
                    </select>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search types..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
                {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                ) : filteredTypes.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">No types found</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type For</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTypes.map(type => (
                                <tr key={type.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{type.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{type.code}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{type.type_for}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 capitalize">{type.status}</td>
                                    <td className="px-4 py-2 text-sm text-right space-x-2">
                                        {hasPermission('type.setup.edit') && (
                                            <button
                                                onClick={() => handleOpenEditModal(type)}
                                                className="inline-flex items-center px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                                            >
                                                <Edit className="mr-1 w-4 h-4" />
                                                Edit
                                            </button>
                                        )}
                                        {hasPermission('type.setup.delete') && (
                                            <button
                                                onClick={() => handleDelete(type.id)}
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
                                {editingType ? 'Edit Type' : 'Add Type'}
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
                                <label className="block mb-1 text-sm font-medium text-gray-700">Type For</label>
                                <select
                                    name="type_for"
                                    value={formData.type_for}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                >
                                    <option value="voucher">Voucher</option>
                                    <option value="cash_bank">Cash/Bank</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                />
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

export default TypeSetup;

