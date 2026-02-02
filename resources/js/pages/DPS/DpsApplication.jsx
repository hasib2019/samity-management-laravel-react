import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, Save, X, Loader } from 'lucide-react';

const DpsApplication = () => {
    const [view, setView] = useState('list'); // list, create, edit
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        member_id: '',
        product_id: '',
        dps_amount: '',
        duration: '',
        start_date: new Date().toISOString().split('T')[0],
        interest_rate: '',
        
        // Nominees Array
        nominees: [{
            nominee_name: '',
            relation: '',
            dob: '',
            nid: '',
            percentage: 100,
            image: null
        }]
    });

    // Dropdown Data
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
        fetchMembers(); // Load all members or use search
        if (view === 'list') {
            fetchApplications();
        }
    }, [view]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products?type=dps');
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else if (response.data?.data) {
                setProducts(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching products', err);
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
            const response = await api.get('/dps-applications');
            setApplications(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching applications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.post('/dps-applications', formData);
            Swal.fire('Success', 'DPS Application created successfully', 'success');
            setView('list');
            fetchApplications();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to create application', 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Nominee Handlers
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
            setFormData(prev => ({
                ...prev,
                nominees: prev.nominees.filter((_, i) => i !== index)
            }));
        }
    };

    const updateNominee = (index, field, value) => {
        setFormData(prev => {
            const newNominees = [...prev.nominees];
            newNominees[index] = { ...newNominees[index], [field]: value };
            return { ...prev, nominees: newNominees };
        });
    };

    if (view === 'create') {
        return (
            <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">New DPS Application</h2>
                    <button onClick={() => setView('list')} className="flex items-center text-gray-600 hover:text-gray-800">
                        <X className="w-4 h-4 mr-1" /> Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Member</label>
                            <select 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.member_id}
                                onChange={e => setFormData({...formData, member_id: e.target.value})}
                                required
                            >
                                <option value="">Select Member</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.member_name} ({m.member_code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Product Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Product</label>
                            <select 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.product_id}
                                onChange={e => {
                                    const prod = products.find(p => p.id == e.target.value);
                                    setFormData({
                                        ...formData, 
                                        product_id: e.target.value,
                                        interest_rate: prod?.profit_rate || ''
                                    });
                                }}
                                required
                            >
                                <option value="">Select Product</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.product_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
                            <input 
                                type="number" 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.dps_amount}
                                onChange={e => setFormData({...formData, dps_amount: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (Months)</label>
                            <input 
                                type="number" 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.duration}
                                onChange={e => setFormData({...formData, duration: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input 
                                type="date" 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.start_date}
                                onChange={e => setFormData({...formData, start_date: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.interest_rate}
                                onChange={e => setFormData({...formData, interest_rate: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Nominees Section */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Nominees</h3>
                            <button type="button" onClick={addNominee} className="flex items-center text-sm text-indigo-600 hover:text-indigo-900">
                                <Plus className="w-4 h-4 mr-1" /> Add Nominee
                            </button>
                        </div>
                        {formData.nominees.map((nominee, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 relative">
                                {formData.nominees.length > 1 && (
                                    <button type="button" onClick={() => removeNominee(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Nominee Name" 
                                        className="rounded-md border-gray-300 shadow-sm"
                                        value={nominee.nominee_name}
                                        onChange={e => updateNominee(index, 'nominee_name', e.target.value)}
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Relation" 
                                        className="rounded-md border-gray-300 shadow-sm"
                                        value={nominee.relation}
                                        onChange={e => updateNominee(index, 'relation', e.target.value)}
                                        required
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Percentage" 
                                        className="rounded-md border-gray-300 shadow-sm"
                                        value={nominee.percentage}
                                        onChange={e => updateNominee(index, 'percentage', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={processing}
                            className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Save Application
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">DPS Applications</h1>
                <button 
                    onClick={() => setView('create')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Application
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : applications.map((app) => (
                            <tr key={app.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.account_no}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {app.member?.member_name} ({app.member?.member_code})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.product?.product_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{app.dps_amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{app.balance}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        app.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DpsApplication;
