import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, Plus, Trash2, Edit } from 'lucide-react';

const LoanApplication = () => {
    const [view, setView] = useState('list'); // list, create, edit
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        samity_id: '',
        member_id: '',
        product_id: '',
        amount: '',
        duration_months: '',
        interest_rate: '',
        installment_type: 'weekly',
        apply_date: new Date().toISOString().split('T')[0],
        purpose: '',
        remarks: '',
        
        // Nominees Array
        nominees: [{
            nominee_type: 'external', // member or external
            member_id: '',
            nominee_name: '',
            relation: '',
            dob: '',
            nid: '',
            percentage: 100,
            image: null,
            signature: null,
            nid_image: null,
            other_documents: null
        }],

        // Guarantors Array
        guarantors: [{
            guarantor_type: 'external',
            member_id: '',
            name: '',
            father_name: '',
            husband_name: '',
            relation: '',
            address: '',
            contact_no: '',
            nid: '',
            image: null,
            signature: null,
            nid_image: null
        }]
    });

    // Dropdown Data
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);

    // Filters
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedSamity, setSelectedSamity] = useState(null);

    const selectedProduct = products.find(p => p.id == formData.product_id);

    useEffect(() => {
        fetchSamities();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            setFormData(prev => ({
                ...prev,
                interest_rate: selectedProduct.profit_rate || '',
                installment_type: selectedProduct.installment_type || 'weekly'
            }));
        }
    }, [formData.product_id, products]);

    useEffect(() => {
        if (view === 'list') {
            fetchApplications();
        }
    }, [view, filterStatus, selectedSamity]);

    useEffect(() => {
        if (formData.samity_id) {
            fetchMembers(formData.samity_id);
        } else {
            setMembers([]);
        }
    }, [formData.samity_id]);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            setSamities(response.data);
        } catch (err) {
            console.error('Error fetching samities', err);
        }
    };

    const fetchProducts = async () => {
        try {
            // Fetch only loan products
            const response = await api.get('/products?type=loan');
            
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else if (response.data?.data) {
                setProducts(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching products', err);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const response = await api.get(`/global/members?samity_id=${samityId}`);
            setMembers(response.data);
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const params = { status: filterStatus };
            if (selectedSamity) params.samity_id = selectedSamity;
            
            const response = await api.get('/loan-applications', { params });
            setApplications(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching applications', err);
        } finally {
            setLoading(false);
        }
    };

    // Nominee Handlers
    const addNominee = () => {
        setFormData(prev => ({
            ...prev,
            nominees: [...prev.nominees, {
                nominee_type: 'external',
                member_id: '',
                nominee_name: '',
                relation: '',
                dob: '',
                nid: '',
                percentage: 0,
                image: null,
                signature: null,
                nid_image: null,
                other_documents: null
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

    // Guarantor Handlers
    const addGuarantor = () => {
        setFormData(prev => ({
            ...prev,
            guarantors: [...prev.guarantors, {
                guarantor_type: 'external',
                member_id: '',
                name: '',
                father_name: '',
                husband_name: '',
                relation: '',
                address: '',
                contact_no: '',
                nid: '',
                image: null,
                signature: null,
                nid_image: null
            }]
        }));
    };

    const removeGuarantor = (index) => {
        if (formData.guarantors.length > 0) {
            setFormData(prev => ({
                ...prev,
                guarantors: prev.guarantors.filter((_, i) => i !== index)
            }));
        }
    };

    const updateGuarantor = (index, field, value) => {
        setFormData(prev => {
            const newGuarantors = [...prev.guarantors];
            newGuarantors[index] = { ...newGuarantors[index], [field]: value };
            return { ...prev, guarantors: newGuarantors };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            
            // Append regular fields
            Object.keys(formData).forEach(key => {
                if (key !== 'nominees' && key !== 'guarantors') {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        data.append(key, formData[key]);
                    }
                }
            });

            // Append Nominees
            formData.nominees.forEach((nominee, index) => {
                data.append(`nominees[${index}][nominee_type]`, nominee.nominee_type);
                
                if (nominee.nominee_type === 'member') {
                    if (nominee.member_id) data.append(`nominees[${index}][member_id]`, nominee.member_id);
                } else {
                    if (nominee.nominee_name) data.append(`nominees[${index}][nominee_name]`, nominee.nominee_name);
                    if (nominee.relation) data.append(`nominees[${index}][relation]`, nominee.relation);
                    if (nominee.dob) data.append(`nominees[${index}][dob]`, nominee.dob);
                    if (nominee.nid) data.append(`nominees[${index}][nid]`, nominee.nid);
                }
                
                if (nominee.percentage) data.append(`nominees[${index}][percentage]`, nominee.percentage);
                
                // Files
                if (nominee.image) {
                    data.append(`nominees[${index}][image]`, nominee.image);
                } else if (nominee.existing_image) {
                    data.append(`nominees[${index}][existing_image]`, nominee.existing_image);
                }

                if (nominee.signature) {
                    data.append(`nominees[${index}][signature]`, nominee.signature);
                } else if (nominee.existing_signature) {
                    data.append(`nominees[${index}][existing_signature]`, nominee.existing_signature);
                }

                if (nominee.nid_image) {
                    data.append(`nominees[${index}][nid_image]`, nominee.nid_image);
                } else if (nominee.existing_nid_image) {
                    data.append(`nominees[${index}][existing_nid_image]`, nominee.existing_nid_image);
                }

                if (nominee.other_documents) {
                    data.append(`nominees[${index}][other_documents]`, nominee.other_documents);
                } else if (nominee.existing_other_documents) {
                    data.append(`nominees[${index}][existing_other_documents]`, nominee.existing_other_documents);
                }
            });

            // Append Guarantors
            formData.guarantors.forEach((guarantor, index) => {
                data.append(`guarantors[${index}][guarantor_type]`, guarantor.guarantor_type);
                
                if (guarantor.guarantor_type === 'member') {
                    if (guarantor.member_id) data.append(`guarantors[${index}][member_id]`, guarantor.member_id);
                } else {
                    if (guarantor.name) data.append(`guarantors[${index}][name]`, guarantor.name);
                    if (guarantor.relation) data.append(`guarantors[${index}][relation]`, guarantor.relation);
                }
                
                if (guarantor.father_name) data.append(`guarantors[${index}][father_name]`, guarantor.father_name);
                if (guarantor.husband_name) data.append(`guarantors[${index}][husband_name]`, guarantor.husband_name);
                if (guarantor.address) data.append(`guarantors[${index}][address]`, guarantor.address);
                if (guarantor.contact_no) data.append(`guarantors[${index}][contact_no]`, guarantor.contact_no);
                if (guarantor.nid) data.append(`guarantors[${index}][nid]`, guarantor.nid);
                
                // Files
                if (guarantor.image) {
                    data.append(`guarantors[${index}][image]`, guarantor.image);
                } else if (guarantor.existing_image) {
                    data.append(`guarantors[${index}][existing_image]`, guarantor.existing_image);
                }

                if (guarantor.signature) {
                    data.append(`guarantors[${index}][signature]`, guarantor.signature);
                } else if (guarantor.existing_signature) {
                    data.append(`guarantors[${index}][existing_signature]`, guarantor.existing_signature);
                }

                if (guarantor.nid_image) {
                    data.append(`guarantors[${index}][nid_image]`, guarantor.nid_image);
                } else if (guarantor.existing_nid_image) {
                    data.append(`guarantors[${index}][existing_nid_image]`, guarantor.existing_nid_image);
                }
            });

            // Important: Laravel needs _method=PUT for file uploads in updates
            if (formData.id) {
                data.append('_method', 'PUT');
                await api.post(`/loan-applications/${formData.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Success', 'Loan Application updated successfully', 'success');
            } else {
                await api.post('/loan-applications', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Success', 'Loan Application submitted successfully', 'success');
            }
            setView('list');
            resetForm();
        } catch (err) {
            console.error('Error submitting application', err);
            // Handle validation errors
            if (err.response?.status === 422) {
                 const errors = err.response.data.errors;
                 let errorMsg = 'Validation Error:\n';
                 for (const key in errors) {
                     errorMsg += `${errors[key][0]}\n`;
                 }
                 Swal.fire('Error', errorMsg, 'error');
            } else {
                 Swal.fire('Error', err.response?.data?.message || 'Failed to submit application', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this application?')) return;
        try {
            await api.delete(`/loan-applications/${id}`);
            Swal.fire('Success', 'Application deleted', 'success');
            fetchApplications();
        } catch (err) {
            console.error('Error deleting application', err);
            Swal.fire('Error', 'Failed to delete application', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            samity_id: '',
            member_id: '',
            product_id: '',
            amount: '',
            duration_months: '',
            interest_rate: '',
            installment_type: 'weekly',
            apply_date: new Date().toISOString().split('T')[0],
            purpose: '',
            remarks: '',
            nominees: [{
                nominee_type: 'external',
                member_id: '',
                nominee_name: '',
                relation: '',
                dob: '',
                nid: '',
                percentage: 100,
                image: null,
                signature: null,
                nid_image: null,
                other_documents: null
            }],
            guarantors: [{
                guarantor_type: 'external',
                member_id: '',
                name: '',
                father_name: '',
                husband_name: '',
                relation: '',
                address: '',
                contact_no: '',
                nid: '',
                image: null,
                signature: null,
                nid_image: null
            }]
        });
    };

    const handleEdit = (app) => {
        const mappedNominees = app.nominees && app.nominees.length > 0 ? app.nominees.map(n => ({
            nominee_type: n.nominee_type,
            member_id: n.member_id || '',
            nominee_name: n.nominee_name || '',
            relation: n.relation || '',
            dob: n.dob || '',
            nid: n.nid || '',
            percentage: n.percentage || 100,
            image: null,
            signature: null,
            nid_image: null,
            other_documents: null,
            // Keep track if existing
            existing_image: n.image,
            existing_signature: n.signature,
            existing_nid_image: n.nid_image,
            existing_other_documents: n.other_documents
        })) : [{
            nominee_type: 'external',
            member_id: '',
            nominee_name: '',
            relation: '',
            dob: '',
            nid: '',
            percentage: 100,
            image: null,
            signature: null,
            nid_image: null,
            other_documents: null
        }];

        const mappedGuarantors = app.guarantors && app.guarantors.length > 0 ? app.guarantors.map(g => ({
            guarantor_type: g.guarantor_type,
            member_id: g.member_id || '',
            name: g.name || '',
            father_name: g.father_name || '',
            husband_name: g.husband_name || '',
            relation: g.relation || '',
            address: g.address || '',
            contact_no: g.contact_no || '',
            nid: g.nid || '',
            image: null,
            signature: null,
            nid_image: null,
            // Keep track if existing
            existing_image: g.image,
            existing_signature: g.signature,
            existing_nid_image: g.nid_image
        })) : [{
            guarantor_type: 'external',
            member_id: '',
            name: '',
            father_name: '',
            husband_name: '',
            relation: '',
            address: '',
            contact_no: '',
            nid: '',
            image: null,
            signature: null,
            nid_image: null
        }];

        setFormData({
            id: app.id,
            samity_id: app.samity_id,
            member_id: app.member_id,
            product_id: app.product_id,
            amount: app.amount,
            duration_months: app.duration_months,
            interest_rate: app.interest_rate,
            installment_type: app.installment_type,
            apply_date: app.apply_date,
            purpose: app.purpose,
            remarks: app.remarks,
            nominees: mappedNominees,
            guarantors: mappedGuarantors
        });
        setView('create');
    };

    // Combobox helper for Member selection
    const [query, setQuery] = useState('');
    const [previewSchedule, setPreviewSchedule] = useState([]);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [approving, setApproving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredMembers =
        query === ''
            ? members
            : members.filter((member) =>
                member.member_name
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .includes(query.toLowerCase().replace(/\s+/g, ''))
            );

    const handleApproveClick = async (id) => {
        try {
            setSelectedApplicationId(id);
            setPreviewLoading(true);
            const response = await api.get(`/loan-applications/${id}/preview-schedule`);
            setPreviewSchedule(response.data);
            setView('preview');
        } catch (err) {
            console.error('Error fetching schedule preview', err);
            Swal.fire('Error', 'Failed to fetch schedule preview', 'error');
            setSelectedApplicationId(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const confirmApprove = async () => {
        if (!selectedApplicationId) return;
        
        setApproving(true);
        try {
            await api.post(`/loan-applications/${selectedApplicationId}/approve`);
            Swal.fire('Success', 'Loan approved and schedule generated', 'success');
            setView('list');
            setPreviewSchedule([]);
            setSelectedApplicationId(null);
            fetchApplications();
        } catch (err) {
            console.error('Error approving loan', err);
            Swal.fire('Error', 'Failed to approve loan', 'error');
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="p-6">
            {view === 'preview' ? (
                <div className="overflow-hidden p-6 mx-auto max-w-4xl bg-white rounded-lg shadow">
                    <div className="flex justify-between items-center pb-4 mb-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Repayment Schedule Preview</h2>
                        <button
                            onClick={() => { setView('list'); setPreviewSchedule([]); setSelectedApplicationId(null); }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">No</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Principal</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Interest</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewSchedule.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-sm text-center text-gray-500">
                                                No schedule generated. Please check loan settings.
                                            </td>
                                        </tr>
                                    ) : (
                                        previewSchedule.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.installment_no}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(item.due_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.principal_amount}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{item.interest_amount}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{item.total_amount}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {previewSchedule.length > 0 && (
                                    <tfoot className="font-bold bg-gray-50">
                                        <tr>
                                            <td colSpan="2" className="px-6 py-3 text-xs tracking-wider text-right uppercase">Total</td>
                                            <td className="px-6 py-3 text-sm text-gray-900">
                                                {previewSchedule.reduce((sum, item) => sum + Number(item.principal_amount), 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-900">
                                                {previewSchedule.reduce((sum, item) => sum + Number(item.interest_amount), 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-900">
                                                {previewSchedule.reduce((sum, item) => sum + Number(item.total_amount), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => { setView('list'); setPreviewSchedule([]); setSelectedApplicationId(null); }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmApprove}
                            disabled={approving || previewSchedule.length === 0}
                            className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                previewSchedule.length === 0 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            }`}
                        >
                            {approving ? 'Processing...' : 'Confirm Approval'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Loan Applications</h1>
                {view === 'list' && (
                    <button
                        onClick={() => { resetForm(); setView('create'); }}
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        New Application
                    </button>
                )}
                {view !== 'list' && (
                    <button
                        onClick={() => setView('list')}
                        className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
                    >
                        Back to List
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <div className="flex gap-4 p-4 border-b border-gray-200">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 rounded border"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="disbursed">Disbursed</option>
                        </select>
                        <select
                            value={selectedSamity || ''}
                            onChange={(e) => setSelectedSamity(e.target.value)}
                            className="px-3 py-2 rounded border"
                        >
                            <option value="">All Samities</option>
                            {samities.map(s => (
                                <option key={s.id} value={s.id}>{s.samity_name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Samity</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Duration</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-6 py-4 text-center">Loading...</td></tr>
                                ) : applications.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-4 text-center">No applications found</td></tr>
                                ) : (
                                    applications.map(app => (
                                        <tr key={app.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{app.apply_date}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                {app.member?.member_name} <br/>
                                                <span className="text-xs text-gray-500">{app.member?.member_code}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{app.samity?.samity_name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{app.amount}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{app.duration_months} M</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                      app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                      app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                {app.status === 'pending' && (
                                                    <div className="flex items-center space-x-3">
                                                        <button 
                                                            onClick={() => handleApproveClick(app.id)} 
                                                            disabled={previewLoading}
                                                            title="Approve"
                                                            className={`text-green-600 hover:text-green-900 ${previewLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {previewLoading && selectedApplicationId === app.id ? (
                                                                <span className="text-xs">...</span>
                                                            ) : (
                                                                <Check size={20} />
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEdit(app)} 
                                                            title="Edit"
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            <Edit size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(app.id)} 
                                                            title="Delete"
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-6 mx-auto max-w-4xl bg-white rounded-lg shadow">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Loan Details */}
                        <div className="bg-gray-50 p-4 rounded border">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Loan Details</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Samity Selection */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Samity</label>
                                    <select
                                        value={formData.samity_id}
                                        onChange={(e) => setFormData({ ...formData, samity_id: e.target.value })}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Samity</option>
                                        {samities.map(s => (
                                            <option key={s.id} value={s.id}>{s.samity_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Apply Date */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Apply Date</label>
                                    <input
                                        type="date"
                                        value={formData.apply_date}
                                        onChange={(e) => setFormData({ ...formData, apply_date: e.target.value })}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Member Selection (Combobox) */}
                                <div className="col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Member</label>
                                    <Combobox value={formData.member_id} onChange={(value) => setFormData({ ...formData, member_id: value })}>
                                        <div className="relative mt-1">
                                            <div className="overflow-hidden relative w-full text-left bg-white rounded-lg border cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                                <Combobox.Input
                                                    className="py-2 pr-10 pl-3 w-full text-sm leading-5 text-gray-900 border-none focus:ring-0"
                                                    displayValue={(id) => {
                                                        const m = members.find(m => m.id === id);
                                                        return m ? `${m.member_name} - ${m.member_code}` : '';
                                                    }}
                                                    onChange={(event) => setQuery(event.target.value)}
                                                    placeholder="Search Member..."
                                                />
                                                <Combobox.Button className="flex absolute inset-y-0 right-0 items-center pr-2">
                                                    <ChevronsUpDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                                </Combobox.Button>
                                            </div>
                                            <Combobox.Options className="overflow-auto absolute z-10 py-1 mt-1 w-full max-h-60 text-base bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg focus:outline-none sm:text-sm">
                                                {filteredMembers.length === 0 && query !== '' ? (
                                                    <div className="relative px-4 py-2 text-gray-700 cursor-default select-none">
                                                        Nothing found.
                                                    </div>
                                                ) : (
                                                    filteredMembers.map((member) => (
                                                        <Combobox.Option
                                                            key={member.id}
                                                            className={({ active }) =>
                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                                }`
                                                            }
                                                            value={member.id}
                                                        >
                                                            {({ selected, active }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                        {member.member_name} - {member.member_code}
                                                                    </span>
                                                                    {selected ? (
                                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'}`}>
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
                                </div>

                                {/* Product Selection */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Product</label>
                                    <select
                                        value={formData.product_id}
                                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.product_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            const max = selectedProduct?.max_amount;
                                            if (max && val > max) return; // Prevent typing more than max
                                            setFormData({ ...formData, amount: e.target.value });
                                        }}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min={selectedProduct?.min_amount || "1"}
                                        max={selectedProduct?.max_amount}
                                    />
                                    {selectedProduct && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Min: {selectedProduct.min_amount} - Max: {selectedProduct.max_amount}
                                        </p>
                                    )}
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Duration (Months)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_months}
                                        onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min={selectedProduct?.min_tenure_month || "1"}
                                        max={selectedProduct?.max_tenure_month}
                                    />
                                    {selectedProduct && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Min: {selectedProduct.min_tenure_month} - Max: {selectedProduct.max_tenure_month} Months
                                        </p>
                                    )}
                                </div>

                                {/* Interest Rate */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData.interest_rate}
                                        onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${selectedProduct ? 'bg-gray-100' : ''}`}
                                        required
                                        min="0"
                                        step="0.01"
                                        readOnly={!!selectedProduct}
                                    />
                                </div>

                                {/* Installment Type */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Installment Type</label>
                                    <select
                                        value={formData.installment_type}
                                        onChange={(e) => setFormData({ ...formData, installment_type: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded focus:ring-blue-500 focus:border-blue-500 ${selectedProduct ? 'bg-gray-100' : ''}`}
                                        required
                                        disabled={!!selectedProduct}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                {/* Purpose */}
                                <div className="col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Purpose</label>
                                    <textarea
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Nominee Section */}
                        <div className="bg-gray-50 p-4 rounded border">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-medium text-gray-800">Nominee Information</h3>
                                <button
                                    type="button"
                                    onClick={addNominee}
                                    className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Nominee
                                </button>
                            </div>
                            
                            {formData.nominees.map((nominee, index) => (
                                <div key={index} className="p-4 mb-4 bg-white rounded border shadow-sm relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-700">Nominee {index + 1}</h4>
                                        {formData.nominees.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeNominee(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Nominee Type */}
                                        <div className="col-span-2">
                                            <span className="block mb-2 text-sm font-medium text-gray-700">Nominee Type:</span>
                                            <div className="flex space-x-4">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        name={`nominee_type_${index}`}
                                                        value="external"
                                                        checked={nominee.nominee_type === 'external'}
                                                        onChange={(e) => updateNominee(index, 'nominee_type', 'external')}
                                                    />
                                                    <span className="ml-2">External Person</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        name={`nominee_type_${index}`}
                                                        value="member"
                                                        checked={nominee.nominee_type === 'member'}
                                                        onChange={(e) => updateNominee(index, 'nominee_type', 'member')}
                                                    />
                                                    <span className="ml-2">Existing Member</span>
                                                </label>
                                            </div>
                                        </div>

                                        {nominee.nominee_type === 'member' ? (
                                            <div className="col-span-2">
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Select Member as Nominee</label>
                                                <select
                                                    value={nominee.member_id}
                                                    onChange={(e) => updateNominee(index, 'member_id', e.target.value)}
                                                    className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Member</option>
                                                    {members.map(m => (
                                                        <option key={m.id} value={m.id}>{m.member_name} - {m.member_code}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Nominee Name</label>
                                                    <input
                                                        type="text"
                                                        value={nominee.nominee_name}
                                                        onChange={(e) => updateNominee(index, 'nominee_name', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                        required={nominee.nominee_type === 'external'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Relation</label>
                                                    <input
                                                        type="text"
                                                        value={nominee.relation}
                                                        onChange={(e) => updateNominee(index, 'relation', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                        required={nominee.nominee_type === 'external'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        value={nominee.dob}
                                                        onChange={(e) => updateNominee(index, 'dob', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">NID Number</label>
                                                    <input
                                                        type="text"
                                                        value={nominee.nid}
                                                        onChange={(e) => updateNominee(index, 'nid', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Percentage Share */}
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Share Percentage (%)</label>
                                            <input
                                                type="number"
                                                value={nominee.percentage}
                                                onChange={(e) => updateNominee(index, 'percentage', e.target.value)}
                                                className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                min="1"
                                                max="100"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Nominee Documents */}
                                    <div className="mt-4 pt-4 border-t">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Documents (Optional)</h5>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">Nominee Image</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateNominee(index, 'image', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*"
                                                />
                                                {nominee.existing_image && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">Nominee Signature</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateNominee(index, 'signature', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*"
                                                />
                                                {nominee.existing_signature && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">NID Image</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateNominee(index, 'nid_image', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*,application/pdf"
                                                />
                                                {nominee.existing_nid_image && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">Other Documents</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateNominee(index, 'other_documents', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*,application/pdf"
                                                />
                                                {nominee.existing_other_documents && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Guarantor Section */}
                        <div className="bg-gray-50 p-4 rounded border mt-6">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-lg font-medium text-gray-800">Guarantor Information</h3>
                                <button
                                    type="button"
                                    onClick={addGuarantor}
                                    className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Guarantor
                                </button>
                            </div>
                            
                            {formData.guarantors.map((guarantor, index) => (
                                <div key={index} className="p-4 mb-4 bg-white rounded border shadow-sm relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-700">Guarantor {index + 1}</h4>
                                        {formData.guarantors.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeGuarantor(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Guarantor Type */}
                                        <div className="col-span-2">
                                            <span className="block mb-2 text-sm font-medium text-gray-700">Guarantor Type:</span>
                                            <div className="flex space-x-4">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        name={`guarantor_type_${index}`}
                                                        value="external"
                                                        checked={guarantor.guarantor_type === 'external'}
                                                        onChange={(e) => updateGuarantor(index, 'guarantor_type', 'external')}
                                                    />
                                                    <span className="ml-2">External Person</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        className="form-radio text-blue-600"
                                                        name={`guarantor_type_${index}`}
                                                        value="member"
                                                        checked={guarantor.guarantor_type === 'member'}
                                                        onChange={(e) => updateGuarantor(index, 'guarantor_type', 'member')}
                                                    />
                                                    <span className="ml-2">Existing Member</span>
                                                </label>
                                            </div>
                                        </div>

                                        {guarantor.guarantor_type === 'member' ? (
                                            <div className="col-span-2">
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Select Member as Guarantor</label>
                                                <select
                                                    value={guarantor.member_id}
                                                    onChange={(e) => updateGuarantor(index, 'member_id', e.target.value)}
                                                    className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Member</option>
                                                    {members.map(m => (
                                                        <option key={m.id} value={m.id}>{m.member_name} - {m.member_code}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Guarantor Name</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.name}
                                                        onChange={(e) => updateGuarantor(index, 'name', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                        required={guarantor.guarantor_type === 'external'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Relation</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.relation}
                                                        onChange={(e) => updateGuarantor(index, 'relation', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                        required={guarantor.guarantor_type === 'external'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Father's Name</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.father_name}
                                                        onChange={(e) => updateGuarantor(index, 'father_name', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Husband's Name</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.husband_name}
                                                        onChange={(e) => updateGuarantor(index, 'husband_name', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Address</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.address}
                                                        onChange={(e) => updateGuarantor(index, 'address', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">Contact No</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.contact_no}
                                                        onChange={(e) => updateGuarantor(index, 'contact_no', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-sm font-medium text-gray-700">NID</label>
                                                    <input
                                                        type="text"
                                                        value={guarantor.nid}
                                                        onChange={(e) => updateGuarantor(index, 'nid', e.target.value)}
                                                        className="px-3 py-2 w-full rounded border focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Guarantor Documents */}
                                    <div className="mt-4 pt-4 border-t">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Documents (Optional)</h5>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">Guarantor Image</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateGuarantor(index, 'image', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*"
                                                />
                                                {guarantor.existing_image && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">Guarantor Signature</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateGuarantor(index, 'signature', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*"
                                                />
                                                {guarantor.existing_signature && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-medium text-gray-600">NID Image</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => updateGuarantor(index, 'nid_image', e.target.files[0])}
                                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    accept="image/*,application/pdf"
                                                />
                                                {guarantor.existing_nid_image && <span className="text-xs text-green-600">Existing file present</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="px-4 py-2 text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Processing...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            </>
        )}
        </div>
    );
};

export default LoanApplication;
