import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Plus, Edit, Trash2, Search, Folder, FileText, 
    ChevronRight, ChevronDown, Save, X, Filter, RefreshCw 
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

    // Sync State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncConfig, setSyncConfig] = useState({
        tableName: 'coop.glac_mst',
        key: "id,glac_code,glac_name,parent_child,parent_id,glac_type,level_code,gl_nature,allow_manual_dr,allow_manual_cr,status,auth_by,auth_date,is_default,doptor_id,is_abonton,is_percentage,is_carry_forward,is_income_expense",
        where: 'id=560',
        limit: '10',
        orderBy: 'id ASC'
    });

    const handleSyncSubmit = async (e) => {
        e.preventDefault();
        setIsSyncing(true);
        try {
            const payload = {
                ...syncConfig,
                key: syncConfig.key.split(',').map(k => k.trim())
            };
            // Clean up optional fields
            if (!payload.where) delete payload.where;
            if (!payload.limit) delete payload.limit;
            if (!payload.orderBy) delete payload.orderBy;

            const response = await api.post('/gl-accounts/sync', payload);
            showSuccessToast(response.data.message || 'Sync successful');
            setIsSyncModalOpen(false);
            fetchAccounts();
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gl-accounts/tree');
            setAccounts(response.data);
        } catch (error) {
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
                        
                        <div className="flex flex-1 items-center">
                            {node.parent_child === 'P' ? 
                                <Folder className="mr-2 w-4 h-4 text-blue-500" /> : 
                                <FileText className="mr-2 w-4 h-4 text-gray-500" />
                            }
                            <span className="mr-2 text-sm font-medium text-gray-700">[{node.glac_code}]</span>
                            <span className="text-sm text-gray-900">{node.glac_name}</span>
                            <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                node.status === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {node.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="hidden items-center space-x-2 group-hover:flex">
                            {hasPermission('gl.setup.create') && node.parent_child === 'P' && (
                                <button onClick={() => handleOpenCreateModal(node.id)} className="p-1 text-blue-600 rounded hover:bg-blue-50" title="Add Child">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('gl.setup.edit') && (
                                <button onClick={() => handleOpenEditModal(node)} className="p-1 text-indigo-600 rounded hover:bg-indigo-50" title="Edit">
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {hasPermission('gl.setup.delete') && ![1, 2, 3, 4].includes(node.id) && (
                                <button onClick={() => handleDelete(node.id)} className="p-1 text-red-600 rounded hover:bg-red-50" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {hasChildren && isExpanded && (
                        <div className="ml-3 border-l border-gray-200">
                            {renderTree(node.children)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (!hasPermission('gl.setup.view')) {
        return <div className="py-10 text-center text-red-500">Permission Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">GL Account Setup</h2>
                <div className="flex space-x-2">
                    {hasPermission('gl.setup.sync') && (
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Sync
                        </button>
                    )}
                    {hasPermission('gl.setup.create') && accounts.filter(a => !a.parent_id).length < 4 && (
                        <button
                            onClick={() => handleOpenCreateModal()}
                            className="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Plus className="mr-2 w-4 h-4" />
                            New Root Account
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center p-4 space-x-4 bg-gray-50 border-b border-gray-200">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search GL Accounts..."
                            className="py-2 pr-4 pl-10 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 min-h-[400px]">
                    {loading ? (
                        <div className="py-10 text-center">Loading...</div>
                    ) : accounts.length > 0 ? (
                        renderTree(accounts)
                    ) : (
                        <div className="py-10 text-center text-gray-500">No GL Accounts found</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl z-[101] max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center pb-2 mb-4 border-b">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {editingAccount ? 'Edit GL Account' : 'New GL Account'}
                                        </h3>
                                        <button type="button" onClick={() => setIsModalOpen(false)}>
                                            <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Account Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.glac_name}
                                                onChange={(e) => setFormData({...formData, glac_name: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">GL Code *</label>
                                            <input
                                                type="text"
                                                required
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.glac_code}
                                                onChange={(e) => setFormData({...formData, glac_code: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Parent ID</label>
                                            <input
                                                type="number"
                                                className="block px-3 py-2 mt-1 w-full bg-gray-50 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.parent_id}
                                                readOnly
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type *</label>
                                            <select
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            >
                                                <option value="A">Active</option>
                                                <option value="N">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 col-span-2 gap-4 mt-2 md:grid-cols-3">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-blue-600 rounded focus:ring-blue-500"
                                                    checked={formData.is_default}
                                                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Is Default</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-blue-600 rounded focus:ring-blue-500"
                                                    checked={formData.is_abonton}
                                                    onChange={(e) => setFormData({...formData, is_abonton: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Is Abonton</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    className="text-blue-600 rounded focus:ring-blue-500"
                                                    checked={formData.is_carry_forward}
                                                    onChange={(e) => setFormData({...formData, is_carry_forward: e.target.checked})}
                                                />
                                                <span className="text-sm text-gray-700">Carry Forward</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center px-4 py-2 w-full text-base font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        <Save className="mr-2 w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                    </div>
                </div>
            )}

            {/* Sync Modal */}
            {isSyncModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl z-[101] max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSyncSubmit}>
                            <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center pb-2 mb-4 border-b">
                                    <h3 className="text-lg font-medium text-gray-900">Sync GL Accounts</h3>
                                    <button type="button" onClick={() => setIsSyncModalOpen(false)}>
                                        <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Table Name</label>
                                        <input 
                                            type="text" 
                                            className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={syncConfig.tableName}
                                            onChange={(e) => setSyncConfig({...syncConfig, tableName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Keys (comma separated)</label>
                                        <textarea 
                                            rows={4}
                                            className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={syncConfig.key}
                                            onChange={(e) => setSyncConfig({...syncConfig, key: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Where (Optional)</label>
                                            <input 
                                                type="text" 
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={syncConfig.where}
                                                onChange={(e) => setSyncConfig({...syncConfig, where: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Limit (Optional)</label>
                                            <input 
                                                type="number" 
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={syncConfig.limit}
                                                onChange={(e) => setSyncConfig({...syncConfig, limit: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Order By (Optional)</label>
                                            <input 
                                                type="text" 
                                                className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={syncConfig.orderBy}
                                                onChange={(e) => setSyncConfig({...syncConfig, orderBy: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={isSyncing}
                                    className={`inline-flex justify-center px-4 py-2 w-full text-base font-medium text-white rounded-md border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                                        isSyncing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    <RefreshCw className={`mr-2 w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsSyncModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlAccountSetup;
