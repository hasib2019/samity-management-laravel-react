import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, Save, X, Loader, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FdrApplication = () => {
    const { user } = useAuth();
    const [view, setView] = useState('list'); // list, create, edit, view
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form Data
    const initialFormState = {
        member_id: '',
        product_id: '',
        fdr_amount: '',
        duration: '',
        start_date: new Date().toISOString().split('T')[0],
        interest_rate: '',
        interest_payment_type: 'monthly', // monthly, quarterly, half_yearly, yearly, maturity
        nominees: [{
            nominee_name: '',
            relation: '',
            dob: '',
            nid: '',
            percentage: 100,
            image: null
        }]
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedApplication, setSelectedApplication] = useState(null);

    // Dropdown Data
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (view === 'create' || view === 'edit') {
            fetchProducts();
            fetchMembers();
        }
        if (view === 'list') {
            fetchApplications();
        }
    }, [view]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products?type=fdr');
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else if (response.data?.data) {
                setProducts(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching products', err);
            Swal.fire('Error', 'Failed to fetch products', 'error');
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/global/members');
            setMembers(response.data);
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/fdr-applications');
            setApplications(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching applications', err);
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

        // Auto-fill interest rate if product is selected
        if (name === 'product_id') {
            const product = products.find(p => p.id == value);
            if (product) {
                setFormData(prev => ({
                    ...prev,
                    interest_rate: product.interest_rate || '',
                    duration: product.duration || prev.duration
                }));
            }
        }
    };

    const handleNomineeChange = (index, field, value) => {
        const newNominees = [...formData.nominees];
        newNominees[index][field] = value;
        setFormData(prev => ({ ...prev, nominees: newNominees }));
    };

    const addNominee = () => {
        setFormData(prev => ({
            ...prev,
            nominees: [...prev.nominees, {
                nominee_name: '',
                relation: '',
                dob: '',
                nid: '',
                percentage: 0,
                image: null
            }]
        }));
    };

    const removeNominee = (index) => {
        if (formData.nominees.length > 1) {
            const newNominees = formData.nominees.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, nominees: newNominees }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (selectedApplication) {
                await api.put(`/fdr-applications/${selectedApplication.id}`, formData);
                Swal.fire('Success', 'FDR Application updated successfully', 'success');
            } else {
                await api.post('/fdr-applications', formData);
                Swal.fire('Success', 'FDR Application created successfully', 'success');
            }
            setView('list');
            fetchApplications();
            setFormData(initialFormState);
            setSelectedApplication(null);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', err.response?.data?.message || 'Failed to save application', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = (app) => {
        setSelectedApplication(app);
        setFormData({
            member_id: app.member_id,
            product_id: app.product_id,
            fdr_amount: app.fdr_amount,
            duration: app.duration,
            start_date: app.start_date,
            interest_rate: app.interest_rate,
            interest_payment_type: app.interest_payment_type,
            nominees: app.nominees || []
        });
        setView('edit');
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
                await api.delete(`/fdr-applications/${id}`);
                Swal.fire('Deleted!', 'FDR Application has been deleted.', 'success');
                fetchApplications();
            } catch (err) {
                Swal.fire('Error', 'Failed to delete application', 'error');
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">FDR Applications</h1>
                {view === 'list' && (
                    <button
                        onClick={() => {
                            setFormData(initialFormState);
                            setSelectedApplication(null);
                            setView('create');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> New Application
                    </button>
                )}
                {view !== 'list' && (
                    <button
                        onClick={() => setView('list')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                    >
                        <ArrowLeft size={20} /> Back to List
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Account No or Member Name..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader className="animate-spin mr-2" /> Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No applications found
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {app.account_no}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.member?.name_en} ({app.member?.member_code})
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {parseFloat(app.fdr_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.start_date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {app.maturity_date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${app.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                      app.status === 'closed' ? 'bg-red-100 text-red-800' : 
                                                      'bg-yellow-100 text-yellow-800'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(app)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
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
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.name_en} ({member.member_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                <select
                                    name="product_id"
                                    value={formData.product_id}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.product_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">FDR Amount</label>
                                <input
                                    type="number"
                                    name="fdr_amount"
                                    value={formData.fdr_amount}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interest_rate"
                                    value={formData.interest_rate}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Payment Type</label>
                                <select
                                    name="interest_payment_type"
                                    value={formData.interest_payment_type}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="half_yearly">Half Yearly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="maturity">On Maturity</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Nominee Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Nominees</h3>
                                <button
                                    type="button"
                                    onClick={addNominee}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Nominee
                                </button>
                            </div>
                            
                            {formData.nominees.map((nominee, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 relative">
                                    {formData.nominees.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeNominee(index)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Nominee Name</label>
                                            <input
                                                type="text"
                                                value={nominee.nominee_name}
                                                onChange={(e) => handleNomineeChange(index, 'nominee_name', e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Relation</label>
                                            <input
                                                type="text"
                                                value={nominee.relation}
                                                onChange={(e) => handleNomineeChange(index, 'relation', e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Percentage (%)</label>
                                            <input
                                                type="number"
                                                value={nominee.percentage}
                                                onChange={(e) => handleNomineeChange(index, 'percentage', e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={nominee.dob}
                                                onChange={(e) => handleNomineeChange(index, 'dob', e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">NID</label>
                                            <input
                                                type="text"
                                                value={nominee.nid}
                                                onChange={(e) => handleNomineeChange(index, 'nid', e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setView('list');
                                    setFormData(initialFormState);
                                    setSelectedApplication(null);
                                }}
                                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                {processing ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                {selectedApplication ? 'Update Application' : 'Create Application'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FdrApplication;
