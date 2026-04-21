import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const initialForm = {
    samity_id: '',
    member_id: '',
    product_id: '',
    application_date: new Date().toISOString().split('T')[0],
    requested_amount: '',
    tenure_months: '',
    monthly_interest_rate: '1',
    purpose: '',
    remarks: '',
};

const MemberLoanApplication = () => {
    const { hasPermission } = useAuth();
    const [applications, setApplications] = useState([]);
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchApplications();
        fetchSamities();
        fetchMembers();
        fetchProducts();
    }, []);

    const filteredMembers = useMemo(() => {
        if (!formData.samity_id) return [];
        return members.filter((member) => String(member.samity_id) === String(formData.samity_id));
    }, [members, formData.samity_id]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-applications');
            setApplications(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load member loan applications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSamities = async () => {
        const response = await api.get('/global/samities');
        setSamities(response.data || []);
    };

    const fetchMembers = async () => {
        const response = await api.get('/global/members');
        setMembers(response.data || []);
    };

    const fetchProducts = async () => {
        const response = await api.get('/products', { params: { type: 'member_loan' } });
        setProducts(response.data || []);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'samity_id' ? { member_id: '' } : {}),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/member-loan-applications', formData);
            Swal.fire('Success', 'Member loan application created successfully', 'success');
            setIsModalOpen(false);
            setFormData(initialForm);
            fetchApplications();
        } catch (error) {
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : (error.response?.data?.message || 'Failed to create application'), 'error');
        }
    };

    const handleApprove = async (application) => {
        try {
            await api.post(`/member-loan-applications/${application.id}/approve`, {
                approved_date: new Date().toISOString().split('T')[0],
                approved_amount: application.requested_amount,
                monthly_interest_rate: application.monthly_interest_rate,
                tenure_months: application.tenure_months,
            });
            Swal.fire('Success', 'Application approved successfully', 'success');
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Approval failed', 'error');
        }
    };

    const handleReject = async (application) => {
        try {
            await api.post(`/member-loan-applications/${application.id}/reject`, {
                remarks: 'Rejected by authorized user',
            });
            Swal.fire('Success', 'Application rejected successfully', 'success');
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Rejection failed', 'error');
        }
    };

    if (!hasPermission('member.loan.application.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Member Loan Application</h1>
                    <p className="text-sm text-gray-500">Create and approve isolated member loan applications.</p>
                </div>
                {hasPermission('member.loan.application.create') && (
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        New Application
                    </button>
                )}
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Application</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Samity</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Tenure</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="7" className="px-4 py-6 text-center">Loading...</td></tr>
                        ) : applications.length === 0 ? (
                            <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">No member loan application found.</td></tr>
                        ) : applications.map((application) => (
                            <tr key={application.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div>{application.application_no}</div>
                                    <div className="text-xs text-gray-400">{application.application_date}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{application.samity?.samity_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{application.member?.member_name}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{application.requested_amount}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{application.tenure_months}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{application.status}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    {application.status === 'pending' && hasPermission('member.loan.application.approve') && (
                                        <button onClick={() => handleApprove(application)} className="mr-2 text-green-600 hover:text-green-800">Approve</button>
                                    )}
                                    {application.status === 'pending' && hasPermission('member.loan.application.reject') && (
                                        <button onClick={() => handleReject(application)} className="text-red-600 hover:text-red-800">Reject</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
                    <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-xl">
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">New Member Loan Application</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Samity</label>
                                    <select name="samity_id" value={formData.samity_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                        <option value="">Select Samity</option>
                                        {samities.map((samity) => <option key={samity.id} value={samity.id}>{samity.samity_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Member</label>
                                    <select name="member_id" value={formData.member_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                        <option value="">Select Member</option>
                                        {filteredMembers.map((member) => <option key={member.id} value={member.id}>{member.member_name} ({member.member_code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Product</label>
                                    <select name="product_id" value={formData.product_id} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
                                        <option value="">Select Product</option>
                                        {products.map((product) => <option key={product.id} value={product.id}>{product.product_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Application Date</label>
                                    <input type="date" name="application_date" value={formData.application_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Requested Amount</label>
                                    <input type="number" step="0.01" name="requested_amount" value={formData.requested_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Tenure (Months)</label>
                                    <input type="number" name="tenure_months" value={formData.tenure_months} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium">Monthly Interest Rate (%)</label>
                                    <input type="number" step="0.0001" name="monthly_interest_rate" value={formData.monthly_interest_rate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block mb-1 text-sm font-medium">Purpose</label>
                                    <textarea name="purpose" value={formData.purpose} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberLoanApplication;
