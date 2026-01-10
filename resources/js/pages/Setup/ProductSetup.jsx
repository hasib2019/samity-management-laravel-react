import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Plus, Edit, Trash2, Search, Save, X
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';

const ProductSetup = () => {
    const { hasPermission } = useAuth();
    const [products, setProducts] = useState([]);
    const [glAccounts, setGlAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        product_code: '',
        product_name: '',
        product_type: 'saving',
        product_category: 'deposit',
        min_amount: 0,
        max_amount: 0,
        tenure_required: false,
        min_tenure_month: '',
        max_tenure_month: '',
        profit_applicable: false,
        profit_rate: '',
        profit_calculation: 'monthly',
        profit_posting: 'monthly',
        installment_required: false,
        installment_type: 'monthly',
        installment_amount: '',
        loan_calculation: 'flat',
        grace_period_month: 0,
        penalty_applicable: false,
        penalty_rate: '',
        gl_principal_id: '',
        gl_profit_id: '',
        gl_penalty_id: '',
        gl_income_id: '',
        gl_expense_id: '',
        status: 'active'
    });

    useEffect(() => {
        fetchProducts();
        fetchGlAccounts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchGlAccounts = async () => {
        try {
            const response = await api.get('/gl-accounts', { params: { parent_child: 'C' } });
            setGlAccounts(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            product_code: '',
            product_name: '',
            product_type: 'saving',
            product_category: 'deposit',
            min_amount: 0,
            max_amount: 0,
            tenure_required: false,
            min_tenure_month: '',
            max_tenure_month: '',
            profit_applicable: false,
            profit_rate: '',
            profit_calculation: 'monthly',
            profit_posting: 'monthly',
            installment_required: false,
            installment_type: 'monthly',
            installment_amount: '',
            loan_calculation: 'flat',
            grace_period_month: 0,
            penalty_applicable: false,
            penalty_rate: '',
            gl_principal_id: '',
            gl_profit_id: '',
            gl_penalty_id: '',
            gl_income_id: '',
            gl_expense_id: '',
            status: 'active'
        });
        setEditingProduct(null);
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            ...product,
            // Ensure booleans are correctly set
            tenure_required: !!product.tenure_required,
            profit_applicable: !!product.profit_applicable,
            installment_required: !!product.installment_required,
            penalty_applicable: !!product.penalty_applicable,
            // Handle nulls
            min_tenure_month: product.min_tenure_month || '',
            max_tenure_month: product.max_tenure_month || '',
            profit_rate: product.profit_rate || '',
            installment_amount: product.installment_amount || '',
            penalty_rate: product.penalty_rate || '',
            gl_principal_id: product.gl_principal_id || '',
            gl_profit_id: product.gl_profit_id || '',
            gl_penalty_id: product.gl_penalty_id || '',
            gl_income_id: product.gl_income_id || '',
            gl_expense_id: product.gl_expense_id || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
                showSuccessToast('Product updated successfully');
            } else {
                await api.post('/products', formData);
                showSuccessToast('Product created successfully');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            showErrorToast(error.response?.data?.message || 'Operation failed');
            if (error.response?.data?.errors) {
                // simple alert for validation errors
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                showErrorToast(errors);
            }
        }
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
                await api.delete(`/products/${id}`);
                showSuccessToast('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                showErrorToast('Failed to delete product');
            }
        }
    };

    // Filter products
    const filteredProducts = products.filter(p => 
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Product Setup</h1>
                {hasPermission('product.setup.create') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" />
                        Add Product
                    </button>
                )}
            </div>

            <div className="p-4 mb-6 bg-white rounded-lg shadow">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                </div>
            ) : (
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{product.product_code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{product.product_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize whitespace-nowrap">{product.product_type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize whitespace-nowrap">{product.product_category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                        {hasPermission('product.setup.edit') && (
                                            <button onClick={() => handleOpenEditModal(product)} className="mr-4 text-indigo-600 hover:text-indigo-900">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {hasPermission('product.setup.delete') && (
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex sticky top-0 z-10 justify-between items-center p-6 bg-white border-b">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingProduct ? 'Edit Product' : 'Create New Product'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Product Code</label>
                                    <input
                                        type="text"
                                        name="product_code"
                                        value={formData.product_code}
                                        onChange={handleInputChange}
                                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Product Name</label>
                                    <input
                                        type="text"
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleInputChange}
                                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        name="product_type"
                                        value={formData.product_type}
                                        onChange={handleInputChange}
                                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="saving">Saving</option>
                                        <option value="share">Share</option>
                                        <option value="fdr">FDR</option>
                                        <option value="dps">DPS</option>
                                        <option value="loan">Loan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        name="product_category"
                                        value={formData.product_category}
                                        onChange={handleInputChange}
                                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="deposit">Deposit</option>
                                        <option value="investment">Investment</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Rules Section - Dynamic based on Type */}
                            <div className="pt-4 border-t">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Rules & Configuration</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Amount Rules */}
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Min Amount</label>
                                        <input
                                            type="number"
                                            name="min_amount"
                                            value={formData.min_amount}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Max Amount</label>
                                        <input
                                            type="number"
                                            name="max_amount"
                                            value={formData.max_amount}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
                                        />
                                    </div>

                                    {/* Tenure Rules */}
                                    <div className="col-span-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="tenure_required"
                                                checked={formData.tenure_required}
                                                onChange={handleInputChange}
                                                className="text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Tenure Required</span>
                                        </label>
                                    </div>
                                    {formData.tenure_required && (
                                        <>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Min Tenure (Months)</label>
                                                <input
                                                    type="number"
                                                    name="min_tenure_month"
                                                    value={formData.min_tenure_month}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Max Tenure (Months)</label>
                                                <input
                                                    type="number"
                                                    name="max_tenure_month"
                                                    value={formData.max_tenure_month}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Profit Rules */}
                                    <div className="col-span-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="profit_applicable"
                                                checked={formData.profit_applicable}
                                                onChange={handleInputChange}
                                                className="text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Profit Applicable</span>
                                        </label>
                                    </div>
                                    {formData.profit_applicable && (
                                        <>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Profit Rate (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="profit_rate"
                                                    value={formData.profit_rate}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Profit Calculation</label>
                                                <select
                                                    name="profit_calculation"
                                                    value={formData.profit_calculation}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                >
                                                    <option value="daily">Daily</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                    <option value="maturity">Maturity</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Profit Posting</label>
                                                <select
                                                    name="profit_posting"
                                                    value={formData.profit_posting}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="quarterly">Quarterly</option>
                                                    <option value="maturity">Maturity</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* Installment Rules */}
                                    <div className="col-span-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="installment_required"
                                                checked={formData.installment_required}
                                                onChange={handleInputChange}
                                                className="text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Installment Required</span>
                                        </label>
                                    </div>
                                    {formData.installment_required && (
                                        <>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Installment Type</label>
                                                <select
                                                    name="installment_type"
                                                    value={formData.installment_type}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="weekly">Weekly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Installment Amount</label>
                                                <input
                                                    type="number"
                                                    name="installment_amount"
                                                    value={formData.installment_amount}
                                                    onChange={handleInputChange}
                                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                                />
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Penalty Rules */}
                                    <div className="col-span-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="penalty_applicable"
                                                checked={formData.penalty_applicable}
                                                onChange={handleInputChange}
                                                className="text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Penalty Applicable</span>
                                        </label>
                                    </div>
                                    {formData.penalty_applicable && (
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Penalty Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="penalty_rate"
                                                value={formData.penalty_rate}
                                                onChange={handleInputChange}
                                                className="px-3 py-2 w-full rounded-md border border-gray-300"
                                            />
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Accounting Mapping */}
                            <div className="pt-4 border-t">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">GL Account Mapping</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Principal GL</label>
                                        <select
                                            name="gl_principal_id"
                                            value={formData.gl_principal_id}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
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
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Profit/Interest GL</label>
                                        <select
                                            name="gl_profit_id"
                                            value={formData.gl_profit_id}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
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
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Penalty GL</label>
                                        <select
                                            name="gl_penalty_id"
                                            value={formData.gl_penalty_id}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
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
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Income/Liability Cr-GL</label>
                                        <select
                                            name="gl_income_id"
                                            value={formData.gl_income_id}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
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
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Asset/Expense Dr-GL</label>
                                        <select
                                            name="gl_expense_id"
                                            value={formData.gl_expense_id}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300"
                                        >
                                            <option value="">Select GL Account</option>
                                            {glAccounts.map(gl => (
                                                <option key={gl.id} value={gl.id}>
                                                    {gl.glac_code} - {gl.glac_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end pt-6 space-x-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    <Save className="mr-2 w-4 h-4" />
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSetup;
