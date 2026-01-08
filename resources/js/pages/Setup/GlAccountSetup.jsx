import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Plus, Edit, Trash2, Search, Folder, FileText, 
    ChevronRight, ChevronDown, Save, X, Filter 
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';

const GlAccountSetup = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        glac_code: '',
        glac_name: '',
        parent_child: 'C',
        parent_id: '',
        glac_type: 'A',
        gl_nature: 'D',
        status: 'A',
        is_default: false,
        is_abonton: false,
        is_carry_forward: false,
        is_income_expense: false,
        allow_manual_dr: 'N',
        allow_manual_cr: 'N'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gl-accounts/tree');
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch GL accounts', error);
            showErrorToast('Failed to load GL accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = (parentId = null) => {
        setEditingAccount(null);
        setFormData({
            glac_code: '',
            glac_name: '',
            parent_child: parentId ? 'C' : 'P',
            parent_id: parentId || '',
            glac_type: 'A',
            gl_nature: 'D',
            status: 'A',
            is_default: false,
            is_abonton: false,
            is_carry_forward: false,
            is_income_expense: false,
            allow_manual_dr: 'N',
            allow_manual_cr: 'N'
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (account) => {
        setEditingAccount(account);
        setFormData({
            glac_code: account.glac_code,
            glac_name: account.glac_name,
            parent_child: account.parent_child,
            parent_id: account.parent_id || '',
            glac_type: account.glac_type,
            gl_nature: account.gl_nature,
            status: account.status,
            is_default: Boolean(account.is_default),
            is_abonton: Boolean(account.is_abonton),
            is_carry_forward: Boolean(account.is_carry_forward),
            is_income_expense: Boolean(account.is_income_expense),
            allow_manual_dr: account.allow_manual_dr,
            allow_manual_cr: account.allow_manual_cr
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/gl-accounts/${id}`);
                showSuccessToast('GL Account deleted successfully');
                fetchAccounts();
            } catch (error) {
                showErrorToast(error.response?.data?.message || 'Failed to delete account');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAccount) {
                await api.put(`/gl-accounts/${editingAccount.id}`, formData);
                showSuccessToast('GL Account updated successfully');
            } else {
                await api.post('/gl-accounts', formData);
                showSuccessToast('GL Account created successfully');
            }
            setIsModalOpen(false);
            fetchAccounts();
        } catch (error) {
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0][0];
                showErrorToast(firstError);
            } else {
                showErrorToast(error.response?.data?.message || 'Operation failed');
            }
        }
    };

    const toggleNode = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderTree = (nodes) => {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = expandedNodes[node.id];
            const isMatch = searchTerm === '' || 
                node.glac_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                node.glac_code.toLowerCase().includes(searchTerm.toLowerCase());

            if (!isMatch && !hasChildren) return null;

            return (
                <div key={node.id} className="ml-4">
                    <div className={`flex items-center py-2 px-2 hover:bg-gray-50 rounded-md group ${!isMatch ? 'hidden' : ''}`}>
                        <button 
                            onClick={() => toggleNode(node.id)}
                            className={`p-1 mr-2 rounded-md hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        </button>
                        
                        <div className="flex-1 flex items-center">
                            {node.parent_child === 'P' ? 
                                <Folder className="w-4 h-4 text-blue-500 mr-2" /> : 
                                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                            }
                            <span className="text-sm font-medium text-gray-700 mr-2">[{node.glac_code}]</span>
                            <span className="text-sm text-gray-900">{node.glac_name}</span>
                            <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                node.status === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {node.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="hidden group-hover:flex items-center space-x-2">
                            {hasPermission('gl-setup.create') && node.parent_child === 'P' && (
                                <button onClick={() => handleOpenCreateModal(node.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Add Child">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('gl-setup.edit') && (
                                <button onClick={() => handleOpenEditModal(node)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('gl-setup.delete') && (
                                <button onClick={() => handleDelete(node.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {hasChildren && isExpanded && (
                        <div className="border-l border-gray-200 ml-3">
                            {renderTree(node.children)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (!hasPermission('gl-setup.view')) {
        return <div className="text-center py-10 text-red-500">Permission Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">GL Account Setup</h2>
                {hasPermission('gl-setup.create') && (
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Root Account
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search GL Accounts..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 min-h-[400px]">
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : accounts.length > 0 ? (
                        renderTree(accounts)
                    ) : (
                        <div className="text-center py-10 text-gray-500">No GL Accounts found</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-[101]">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {editingAccount ? 'Edit GL Account' : 'New GL Account'}
                                        </h3>
                                        <button type="button" onClick={() => setIsModalOpen(false)}>
                                            <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Account Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.glac_name}
                                                onChange={(e) => setFormData({...formData, glac_name: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">GL Code *</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.glac_code}
                                                onChange={(e) => setFormData({...formData, glac_code: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Parent ID</label>
                                            <input
                                                type="number"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                                                value={formData.parent_id}
                                                readOnly
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type *</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.glac_type}
                                                onChange={(e) => setFormData({...formData, glac_type: e.target.value})}
                                            >
                                                <option value="A">Asset</option>
                                                <option value="L">Liability</option>
                                                <option value="I">Income</option>
                                                <option value="E">Expense</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nature *</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.gl_nature}
                                                onChange={(e) => setFormData({...formData, gl_nature: e.target.value})}
                                            >
                                                <option value="D">Debit</option>
                                                <option value="C">Credit</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Structure *</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.parent_child}
                                                onChange={(e) => setFormData({...formData, parent_child: e.target.value})}
                                            >
                                                <option value="P">Parent</option>
                                                <option value="C">Child</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            >
                                                <option value="A">Active</option>
                                                <option value="N">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={formData.is_default}
                                                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Is Default</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={formData.is_abonton}
                                                    onChange={(e) => setFormData({...formData, is_abonton: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Is Abonton</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={formData.is_carry_forward}
                                                    onChange={(e) => setFormData({...formData, is_carry_forward: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Carry Forward</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
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

export default GlAccountSetup;
