import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const VoucherRequestList = () => {
    const { hasPermission } = useAuth();
    const [requests, setRequests] = useState([]);
    const [voucherTypes, setVoucherTypes] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        voucher_type_id: '',
        member_id: '',
        amount: '',
        description: '',
        status: 'pending'
    });

    const fetchRequests = async () => {
        try {
            const response = await api.get('/voucher-requests', {
                params: { status: 'pending' }
            });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests', error);
            Swal.fire('Error', 'Failed to fetch voucher requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchVoucherTypes = async () => {
        try {
            const response = await api.get('/types', {
                params: { type_for: 'voucher' }
            });
            setVoucherTypes(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/global/members');
            setMembers(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchVoucherTypes();
        fetchMembers();
    }, []);

    const getVoucherTypeName = (id) => {
        const t = voucherTypes.find(x => x.id === id);
        return t ? t.name : '';
    };

    const getMemberName = (id) => {
        const m = members.find(x => x.id === id);
        if (!m) return '';
        return `${m.member_name_eng} (${m.member_id})`;
    };

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'pending') return;

        try {
            const actionText = newStatus === 'approved' ? 'approve' : 'reject';
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You are about to ${actionText} this voucher request.${newStatus === 'approved' ? ' This will create transactions.' : ''}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: newStatus === 'approved' ? '#3085d6' : '#d33',
                cancelButtonColor: '#aaa',
                confirmButtonText: `Yes, ${actionText} it!`
            });

            if (!result.isConfirmed) return;

            await api.put(`/voucher-requests/${id}`, { status: newStatus });

            Swal.fire(
                'Updated!',
                `Voucher request has been ${newStatus}.`,
                'success'
            );

            fetchRequests();
        } catch (error) {
            console.error('Error updating status', error);
            Swal.fire(
                'Error',
                error.response?.data?.message || 'Failed to update status',
                'error'
            );
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            voucher_type_id: '',
            member_id: '',
            amount: '',
            description: '',
            status: 'pending'
        });
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/voucher-requests', formData);
            Swal.fire('Success', 'Voucher request created successfully', 'success');
            setIsModalOpen(false);
            fetchRequests();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Operation failed';
            Swal.fire('Error', message, 'error');
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                Swal.fire('Validation Error', errors, 'error');
            }
        }
    };

    if (!hasPermission('voucher.request.view')) {
        return <div className="py-10 text-center text-red-500">Permission Denied</div>;
    }

    if (loading) return <div className="text-center p-4">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Pending Voucher Requests</h2>
                {hasPermission('voucher.request.create') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        New Voucher Request
                    </button>
                )}
            </div>

            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Voucher Type
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Member
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                    No pending requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {getVoucherTypeName(request.voucher_type_id)}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {getMemberName(request.member_id)}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {request.amount}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className="relative inline-block px-3 py-1 font-semibold text-orange-900 leading-tight">
                                            <span aria-hidden className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
                                            <span className="relative">Pending</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {hasPermission('voucher.request.approve') || hasPermission('voucher.request.reject') ? (
                                            <select
                                                className="block w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                                                value={request.status}
                                                onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                {hasPermission('voucher.request.approve') && (
                                                    <option value="approved">Approve</option>
                                                )}
                                                {hasPermission('voucher.request.reject') && (
                                                    <option value="rejected">Reject</option>
                                                )}
                                            </select>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">New Voucher Request</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Voucher Type</label>
                                <select
                                    name="voucher_type_id"
                                    value={formData.voucher_type_id}
                                    onChange={handleFormChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                >
                                    <option value="">Select Voucher Type</option>
                                    {voucherTypes.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Member</label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleFormChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                >
                                    <option value="">Select Member</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.member_name_eng} ({m.member_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Amount</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleFormChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherRequestList;

