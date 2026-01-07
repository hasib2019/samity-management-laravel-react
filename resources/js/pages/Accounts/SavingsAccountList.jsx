import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../utils/sweetAlert';

const SavingsAccountList = () => {
    const [accounts, setAccounts] = useState([]);
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        account_number: '',
        member_id: '',
        savings_product_id: '',
        status: true,
        opening_balance: '',
        description: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchAccounts();
        fetchMembers();
        fetchProducts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/savings-accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch savings accounts', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/savings-products');
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const handleOpenModal = (account = null) => {
        if (account) {
            setEditingId(account.id);
            setFormData({
                account_number: account.account_number,
                member_id: account.member_id,
                savings_product_id: account.savings_product_id,
                status: account.status,
                opening_balance: account.opening_balance,
                description: account.description || '',
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.account_number.length < 12) {
            showErrorToast('Account Number must be at least 12 digits');
            return;
        }

        try {
            if (editingId) {
                await api.put(`/savings-accounts/${editingId}`, formData);
                showSuccessToast('Savings Account updated successfully');
            } else {
                await api.post('/savings-accounts', formData);
                showSuccessToast('Savings Account created successfully');
            }
            fetchAccounts();
            handleCloseModal();
        } catch (error) {
            console.error('Operation failed', error);
            showErrorToast(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        const result = await confirmDelete();
        if (result.isConfirmed) {
            try {
                await api.delete(`/savings-accounts/${id}`);
                showSuccessToast('Savings Account deleted successfully');
                fetchAccounts();
            } catch (error) {
                console.error('Delete failed', error);
                showErrorToast('Failed to delete savings account');
            }
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.member?.member_name && account.member.member_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">All Accounts</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Add Account
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search accounts or members..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Account No</th>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Account Type</th>
                                <th className="px-6 py-3">Balance</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No accounts found</td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">{account.account_number}</td>
                                        <td className="px-6 py-4">{account.member?.member_name}</td>
                                        <td className="px-6 py-4">{account.product?.name}</td>
                                        <td className="px-6 py-4">{account.opening_balance}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${account.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {account.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(account)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Edit Savings Account' : 'Add New Savings Account'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (Min 12 digits)</label>
                                <input
                                    type="text"
                                    name="account_number"
                                    value={formData.account_number}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={12}
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.member_name} ({member.member_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                                <select
                                    name="savings_product_id"
                                    value={formData.savings_product_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Account Type</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="opening_balance"
                                    value={formData.opening_balance}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="col-span-2 md:col-span-1 flex items-center mt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="status"
                                        checked={formData.status}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Update Account' : 'Save Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsAccountList;