import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    RefreshCw, 
    X, 
    Save 
} from 'lucide-react';
import Swal from 'sweetalert2';

const CodeMasterList = () => {
    const [loading, setLoading] = useState(false);
    const [codeMasters, setCodeMasters] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState('');
    const [syncing, setSyncing] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        code_type: '',
        return_value: '',
        display_value: '',
        is_active: true,
        display_serial: ''
    });

    useEffect(() => {
        fetchCodeMasters();
    }, [search]);

    const fetchCodeMasters = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/code-masters?page=${page}&code_type=${search}`);
            setCodeMasters(response.data.data);
            setPagination(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await api.post('/code-masters/sync');
            Swal.fire({
                icon: 'success',
                title: 'Sync Successful',
                text: response.data.message
            });
            fetchCodeMasters();
        } catch (error) {
            console.error('Sync error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Sync Failed',
                text: error.response?.data?.message || 'Failed to sync data'
            });
        } finally {
            setSyncing(false);
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
                await api.delete(`/code-masters/${id}`);
                Swal.fire('Deleted!', 'Record has been deleted.', 'success');
                fetchCodeMasters();
            } catch (error) {
                Swal.fire('Error!', 'Failed to delete record.', 'error');
            }
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                code_type: item.code_type,
                return_value: item.return_value,
                display_value: item.display_value,
                is_active: item.is_active,
                display_serial: item.display_serial || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                code_type: '',
                return_value: '',
                display_value: '',
                is_active: true,
                display_serial: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/code-masters/${editingItem.id}`, formData);
                Swal.fire('Success', 'Record updated successfully', 'success');
            } else {
                await api.post('/code-masters', formData);
                Swal.fire('Success', 'Record created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchCodeMasters();
        } catch (error) {
            console.error('Submit error:', error);
            Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Code Master</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                        <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add New</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by Code Type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : codeMasters.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No records found</td>
                            </tr>
                        ) : (
                            codeMasters.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.display_serial}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.return_value}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.display_value}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center mt-4">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {[...Array(pagination.last_page).keys()].map(num => (
                            <button
                                key={num + 1}
                                onClick={() => fetchCodeMasters(num + 1)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    pagination.current_page === num + 1
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {num + 1}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                                            {editingItem ? 'Edit Code Master' : 'Add Code Master'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Code Type</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code_type}
                                                onChange={(e) => setFormData({...formData, code_type: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Return Value</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.return_value}
                                                onChange={(e) => setFormData({...formData, return_value: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Display Value</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.display_value}
                                                onChange={(e) => setFormData({...formData, display_value: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Display Serial</label>
                                            <input
                                                type="number"
                                                value={formData.display_serial}
                                                onChange={(e) => setFormData({...formData, display_serial: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="is_active"
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        <Save size={18} className="mr-2" />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeMasterList;
