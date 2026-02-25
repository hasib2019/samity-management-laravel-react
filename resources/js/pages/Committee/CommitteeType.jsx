import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, Save, X, Loader } from 'lucide-react';

const CommitteeType = () => {
    const [view, setView] = useState('list');
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        name_bn: '',
        validity_period: '',
        member_count_options: '', // comma separated values e.g. "3,5,7"
        is_active: true
    });
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/committee-types');
            setTypes(response.data.data || response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (selectedId) {
                await api.put(`/committee-types/${selectedId}`, formData);
                Swal.fire('Success', 'Committee Type updated successfully', 'success');
            } else {
                await api.post('/committee-types', formData);
                Swal.fire('Success', 'Committee Type created successfully', 'success');
            }
            fetchTypes();
            setView('list');
            resetForm();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/committee-types/${id}`);
                Swal.fire('Deleted!', 'Committee Type has been deleted.', 'success');
                fetchTypes();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete Committee Type', 'error');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            name_bn: '',
            validity_period: '',
            member_count_options: '',
            is_active: true
        });
        setSelectedId(null);
    };

    const handleEdit = (type) => {
        setFormData({
            name: type.name,
            name_bn: type.name_bn || '',
            validity_period: type.validity_period,
            member_count_options: type.member_count_options,
            is_active: type.is_active
        });
        setSelectedId(type.id);
        setView('form');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Committee Types</h1>
                {view === 'list' && (
                    <button
                        onClick={() => {
                            resetForm();
                            setView('form');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> Add New
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity (Years)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : types.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No types found</td>
                                </tr>
                            ) : (
                                types.map((type) => (
                                    <tr key={type.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{type.name}</div>
                                            <div className="text-sm text-gray-500">{type.name_bn}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {type.validity_period}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {type.member_count_options}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {type.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(type)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">{selectedId ? 'Edit Committee Type' : 'Create Committee Type'}</h2>
                        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name (English)</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name (Bangla)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name_bn}
                                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Validity Period (Years)</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.validity_period}
                                    onChange={(e) => setFormData({ ...formData, validity_period: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Member Count Options (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 3,5,7,9"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.member_count_options}
                                    onChange={(e) => setFormData({ ...formData, member_count_options: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Is Active
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                {processing ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommitteeType;
