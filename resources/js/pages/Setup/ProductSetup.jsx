import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Combobox } from '@headlessui/react';
import { 
    Plus, Edit, Trash2, Search, Save, X, Check, ChevronsUpDown
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';

// Helper component for GL selection
const GlCombobox = ({ value, onChange, options, label }) => {
    const [query, setQuery] = useState('');
    
    const filteredOptions =
        query === ''
            ? options
            : options.filter((option) =>
                (option.glac_name.toLowerCase() + option.glac_code.toLowerCase())
                    .replace(/\s+/g, '')
                    .includes(query.toLowerCase().replace(/\s+/g, ''))
            );

    const selectedOption = options.find(o => o.id === value) || null;

    return (
        <Combobox value={selectedOption} onChange={(val) => onChange(val ? val.id : '')} nullable>
            <div className="relative mt-1">
                <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
                <div className="overflow-hidden relative w-full text-left bg-white rounded-lg border border-gray-300 cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                    <Combobox.Input
                        className="py-2 pr-10 pl-3 w-full text-sm leading-5 text-gray-900 border-none focus:ring-0"
                        displayValue={(option) => option ? `${option.glac_code} - ${option.glac_name}` : ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search GL Account..."
                    />
                    <Combobox.Button className="flex absolute inset-y-0 right-0 items-center pr-2">
                        <ChevronsUpDown
                            className="w-5 h-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </Combobox.Button>
                </div>
                <Combobox.Options className="overflow-auto absolute z-50 py-1 mt-1 w-full max-h-60 text-base bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg focus:outline-none sm:text-sm">
                    {filteredOptions.length === 0 && query !== '' ? (
                        <div className="relative px-4 py-2 text-gray-700 cursor-default select-none">
                            Nothing found.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <Combobox.Option
                                key={option.id}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                    }`
                                }
                                value={option}
                            >
                                {({ selected, active }) => (
                                    <>
                                        <span
                                            className={`block truncate ${
                                                selected ? 'font-medium' : 'font-normal'
                                            }`}
                                        >
                                            {option.glac_code} - {option.glac_name}
                                        </span>
                                        {selected ? (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                    active ? 'text-white' : 'text-blue-600'
                                                }`}
                                            >
                                                <Check className="w-5 h-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Combobox.Option>
                        ))
                    )}
                </Combobox.Options>
            </div>
        </Combobox>
    );
};

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
        rate_type: '',
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
        gl_loan_outstanding_id: '',
        gl_loan_disbursement_id: '',
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
            rate_type: '',
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
            gl_loan_outstanding_id: '',
            gl_loan_disbursement_id: '',
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
            gl_loan_outstanding_id: product.gl_loan_outstanding_id || '',
            gl_loan_disbursement_id: product.gl_loan_disbursement_id || '',
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
                                {formData.product_type === 'loan' && (
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Rate Type</label>
                                        <select
                                            name="rate_type"
                                            value={formData.rate_type || ''}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Select Rate Type</option>
                                            <option value="fixed">Fixed Rate</option>
                                            <option value="floating">Floating / Variable Rate</option>
                                            <option value="flat">Flat Rate</option>
                                            <option value="reducing">Reducing Balance Rate (Reducing / Declining)</option>
                                            <option value="interest_free">Interest-Free / Service Charge Rate</option>
                                        </select>
                                    </div>
                                )}
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
                                        <GlCombobox
                                            label="Principal GL"
                                            value={formData.gl_principal_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_principal_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Loan Outstanding GL (Dr GL)"
                                            value={formData.gl_loan_outstanding_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_loan_outstanding_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Loan Disbursement GL (Cr GL)"
                                            value={formData.gl_loan_disbursement_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_loan_disbursement_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Profit/Interest GL"
                                            value={formData.gl_profit_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_profit_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Penalty GL"
                                            value={formData.gl_penalty_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_penalty_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Income/Liability Cr-GL"
                                            value={formData.gl_income_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_income_id: val }))}
                                            options={glAccounts}
                                        />
                                    </div>
                                    <div>
                                        <GlCombobox
                                            label="Asset/Expense Dr-GL"
                                            value={formData.gl_expense_id}
                                            onChange={(val) => setFormData(prev => ({ ...prev, gl_expense_id: val }))}
                                            options={glAccounts}
                                        />
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
