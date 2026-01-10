import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, CreditCard, Save, X, Search, Eye, Loader2 } from 'lucide-react';
import MemberViewModal from './MemberViewModal';
import { showSuccessToast, showErrorToast, confirmDelete } from '../../utils/sweetAlert';

const MemberProfile = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewMember, setViewMember] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [samityList, setSamityList] = useState([]);
    const [savingProducts, setSavingProducts] = useState([]);
    const [imagePreviews, setImagePreviews] = useState({
        member_photo: null,
        member_sign: null,
        nid_photo: null
    });
    
    // Initial Form State
    const initialFormState = {
        member_code: '',
        occupation_id: '',
        samity_id: '',
        education_level_id: '',
        marital_status_id: '',
        gender_id: '',
        nid: '',
        dob: '',
        member_name: '',
        member_name_bangla: '',
        father_name: '',
        mother_name: '',
        spouse_name: '',
        mobile: '',
        email: '',
        committee_organizer: 'N',
        committee_contact_person: 'N',
        committee_signatory_person: 'N',
        ref_samity_id: '',
        member_admission_date: '',
        brn: '',
        doptor_id: '',
        is_active: true,
        is_samity_member: true,
        account_details: false,
        product_id: '',
        principal_amount: '',
        tenure_month: '',
        religion_id: '',
        share_price: '',
        no_of_share: '',
        member_photo: null,
        member_sign: null,
        nid_photo: null,
        others: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchMembers();
        fetchSamityList();
        fetchSavingProducts();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSamityList = async () => {
        try {
            const response = await api.get('/samity-profiles');
            if (response.data && !Array.isArray(response.data)) {
                setSamityList([response.data]);
                if (!editingId) {
                    setFormData(prev => ({ ...prev, samity_id: response.data.id }));
                }
            } else if (Array.isArray(response.data)) {
                setSamityList(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch samity list', error);
        }
    };

    const fetchSavingProducts = async () => {
        try {
            const response = await api.get('/products?type=saving');
            setSavingProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch saving products', error);
        }
    };

    const STORAGE_URL = '/storage/';

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingId(member.id);
            setFormData({
                member_code: member.member_code || '',
                occupation_id: member.occupation_id || '',
                samity_id: member.samity_id || '',
                education_level_id: member.education_level_id || '',
                marital_status_id: member.marital_status_id || '',
                gender_id: member.gender_id || '',
                nid: member.nid || '',
                dob: member.dob || '',
                member_name: member.member_name || '',
                member_name_bangla: member.member_name_bangla || '',
                father_name: member.father_name || '',
                mother_name: member.mother_name || '',
                spouse_name: member.spouse_name || '',
                mobile: member.mobile || '',
                email: member.email || '',
                committee_organizer: member.committee_organizer || 'N',
                committee_contact_person: member.committee_contact_person || 'N',
                committee_signatory_person: member.committee_signatory_person || 'N',
                ref_samity_id: member.ref_samity_id || '',
                member_admission_date: member.member_admission_date || '',
                brn: member.brn || '',
                doptor_id: member.doptor_id || '',
                is_active: member.is_active !== undefined ? member.is_active : true,
                is_samity_member: member.is_samity_member !== undefined ? member.is_samity_member : true,
                account_details: false, 
                product_id: '',
                principal_amount: '',
                tenure_month: '',
                description: '',
                religion_id: member.religion_id || '',
                share_price: member.share_price || '',
                no_of_share: member.no_of_share || '',
                member_photo: null, // Don't pre-fill file inputs
                member_sign: null,
                nid_photo: null,
                others: member.others || '',
            });
            setImagePreviews({
                member_photo: member.member_photo ? `${STORAGE_URL}${member.member_photo}` : null,
                member_sign: member.member_sign ? `${STORAGE_URL}${member.member_sign}` : null,
                nid_photo: member.nid_photo ? `${STORAGE_URL}${member.nid_photo}` : null,
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
            setImagePreviews({
                member_photo: null,
                member_sign: null,
                nid_photo: null
            });
            if (samityList.length === 1) {
                setFormData(prev => ({ ...prev, samity_id: samityList[0].id }));
            }
        }
        setIsModalOpen(true);
    };

    const handleViewMember = (member) => {
        setViewMember(member);
        setIsViewModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
            
            // Create preview
            const objectUrl = URL.createObjectURL(files[0]);
            setImagePreviews(prev => ({
                ...prev,
                [name]: objectUrl
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                 if (key === 'is_active' || key === 'is_samity_member') {
                     data.append(key, formData[key] ? '1' : '0');
                 } else {
                     data.append(key, formData[key]);
                 }
            }
        });

        if (editingId) {
            data.append('_method', 'PUT');
        }

        try {
            if (editingId) {
                await api.post(`/members/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccessToast('Member updated successfully');
            } else {
                await api.post('/members', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showSuccessToast('Member created successfully');
            }
            setIsModalOpen(false);
            fetchMembers();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                const firstError = Object.values(error.response.data.errors)[0][0];
                showErrorToast(firstError);
            } else {
                showErrorToast(error.response?.data?.message || 'Something went wrong');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDelete();
        if (isConfirmed) {
            try {
                await api.delete(`/members/${id}`);
                showSuccessToast('Member deleted successfully');
                fetchMembers();
            } catch (error) {
                showErrorToast('Failed to delete member');
            }
        }
    };

    if (loading) return <div className="py-10 text-center">Loading...</div>;

    if (!hasPermission('member.view')) {
        return <div className="py-10 text-center text-red-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Member List</h2>
                {hasPermission('member.create') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" />
                        Add Member
                    </button>
                )}
            </div>

            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Member</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Samity</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No members found
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gray-100 rounded-full">
                                                <User className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{member.member_name}</div>
                                                <div className="text-xs text-gray-500">Code: {member.member_code || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Phone className="mr-1 w-3 h-3 text-gray-400" /> {member.mobile || 'N/A'}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Mail className="mr-1 w-3 h-3 text-gray-400" /> {member.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{member.samity?.samity_name || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                        {hasPermission('member.view') && (
                                            <button onClick={() => handleViewMember(member)} className="mr-3 text-purple-600 hover:text-purple-900" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        {hasPermission('member.edit') && (
                                            <button onClick={() => handleOpenModal(member)} className="mr-3 text-blue-600 hover:text-blue-900">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {hasPermission('member.delete') && (
                                            <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            <MemberViewModal 
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                member={viewMember}
                STORAGE_URL={STORAGE_URL}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
                        <div className="fixed inset-0 backdrop-blur-sm transition-opacity bg-black/50" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-[101]">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                                    <div className="flex justify-between items-center pb-3 mb-5 border-b border-gray-100">
                                        <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                            {editingId ? 'Edit Member' : 'Add New Member'}
                                        </h3>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Form Fields Grid */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {/* Basic Info */}
                                        <div className="pb-2 mb-2 border-b md:col-span-3">
                                            <h4 className="text-sm font-semibold text-gray-500 uppercase">Basic Information</h4>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Samity <span className="text-red-500">*</span></label>
                                            <select
                                                name="samity_id"
                                                required
                                                value={formData.samity_id}
                                                onChange={handleInputChange}
                                                className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value="">Select Samity</option>
                                                {samityList.map(samity => (
                                                    <option key={samity.id} value={samity.id}>{samity.samity_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Member Name <span className="text-red-500">*</span></label>
                                            <input type="text" name="member_name" required value={formData.member_name} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Member Name (Bangla)</label>
                                            <input type="text" name="member_name_bangla" value={formData.member_name_bangla} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Member Code</label>
                                            <input type="text" name="member_code" value={formData.member_code} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Mobile <span className="text-red-500">*</span></label>
                                            <input type="text" name="mobile" required value={formData.mobile} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">NID</label>
                                            <input type="text" name="nid" value={formData.nid} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                            <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Admission Date</label>
                                            <input type="date" name="member_admission_date" value={formData.member_admission_date} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        {/* Family Info */}
                                        <div className="pb-2 mt-4 mb-2 border-b md:col-span-3">
                                            <h4 className="text-sm font-semibold text-gray-500 uppercase">Family Information</h4>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                                            <input type="text" name="father_name" value={formData.father_name} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                                            <input type="text" name="mother_name" value={formData.mother_name} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Spouse Name</label>
                                            <input type="text" name="spouse_name" value={formData.spouse_name} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        {/* Financial & Status */}
                                        <div className="pb-2 mt-4 mb-2 border-b md:col-span-3">
                                            <h4 className="text-sm font-semibold text-gray-500 uppercase">Financial & Status</h4>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Share Amount</label>
                                            <input type="number" name="share_price" value={formData.share_price} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">No of Share</label>
                                            <input type="number" name="no_of_share" value={formData.no_of_share} onChange={handleInputChange} className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="flex items-center mt-6 space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="is_samity_member"
                                                    checked={formData.is_samity_member}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span>Is Samity Member?</span>
                                            </label>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="flex items-center mt-6 space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span>Is Active?</span>
                                            </label>
                                        </div>

                                        {/* Account Details Toggle - Only show when creating new member */}
                                        {!editingId && (
                                            <div className="col-span-1">
                                                <label className="flex items-center mt-6 space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="account_details"
                                                        checked={formData.account_details}
                                                        onChange={handleInputChange}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span>Add Account Details</span>
                                                </label>
                                            </div>
                                        )}

                                        {/* Savings Account Section */}
                                        {formData.account_details && !editingId && (
                                            <div className="pb-2 mt-4 mb-2 border-b md:col-span-3">
                                                <h4 className="text-sm font-semibold text-gray-500 uppercase">Savings Account Information</h4>
                                            </div>
                                        )}

                                        {formData.account_details && !editingId && (
                                            <>
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></label>
                                                    <select
                                                        name="product_id"
                                                        required={formData.account_details}
                                                        value={formData.product_id}
                                                        onChange={handleInputChange}
                                                        className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    >
                                                        <option value="">Select Product</option>
                                                        {savingProducts.map(product => (
                                                            <option key={product.id} value={product.id}>{product.product_name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700">Principal Amount</label>
                                                    <input
                                                        type="number"
                                                        name="principal_amount"
                                                        value={formData.principal_amount}
                                                        onChange={handleInputChange}
                                                        className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    />
                                                </div>

                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700">Tenure (Month)</label>
                                                    <input
                                                        type="number"
                                                        name="tenure_month"
                                                        value={formData.tenure_month}
                                                        onChange={handleInputChange}
                                                        className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    />
                                                </div>

                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                                    <input
                                                        type="text"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    />
                                                </div>
                                                
                                                <div className="col-span-1 md:col-span-3">
                                                    <p className="text-sm italic text-gray-500">
                                                        * Account Number will be auto-generated upon creation.
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {/* Documents & Images */}
                                                                               {/* Documents & Images */}
                                        <div className="pb-2 mt-4 mb-2 border-b md:col-span-3">
                                            <h4 className="text-sm font-semibold text-gray-500 uppercase">Documents & Images</h4>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Member Photo</label>
                                            <input type="file" name="member_photo" onChange={handleFileChange} accept="image/*" className="block mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                            {imagePreviews.member_photo && (
                                                <div className="mt-2">
                                                    <img src={imagePreviews.member_photo} alt="Member Photo" className="object-cover w-20 h-20 rounded-md border" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">Member Signature</label>
                                            <input type="file" name="member_sign" onChange={handleFileChange} accept="image/*" className="block mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                            {imagePreviews.member_sign && (
                                                <div className="mt-2">
                                                    <img src={imagePreviews.member_sign} alt="Member Signature" className="object-cover w-20 h-20 rounded-md border" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700">NID Photo</label>
                                            <input type="file" name="nid_photo" onChange={handleFileChange} accept="image/*" className="block mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                            {imagePreviews.nid_photo && (
                                                <div className="mt-2">
                                                    <img src={imagePreviews.nid_photo} alt="NID Photo" className="object-cover w-20 h-20 rounded-md border" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-3">
                                            <label className="block text-sm font-medium text-gray-700">Others</label>
                                            <textarea name="others" value={formData.others} onChange={handleInputChange} rows="2" className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                                        </div>



                                        

                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex justify-center items-center px-4 py-2 w-full text-base font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 w-4 h-4" />
                                                {editingId ? 'Update Member' : 'Create Member'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default MemberProfile;
