import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const DepositRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/deposit-requests?status=pending');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch deposit requests',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'pending') return;

        try {
            const actionText = newStatus === 'approved' ? 'approve' : 'reject';
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: `You are about to ${actionText} this deposit request.${newStatus === 'approved' ? ' This will create a transaction.' : ''}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: newStatus === 'approved' ? '#3085d6' : '#d33',
                cancelButtonColor: '#aaa',
                confirmButtonText: `Yes, ${actionText} it!`
            });

            if (result.isConfirmed) {
                await api.put(`/deposit-requests/${id}`, { status: newStatus });
                
                Swal.fire(
                    'Updated!',
                    `Deposit request has been ${newStatus}.`,
                    'success'
                );
                
                fetchRequests(); // Refresh list
            }
        } catch (error) {
            console.error('Error updating status', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update status',
            });
        }
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold mb-6">Pending Deposit Requests</h2>
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Member
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Account
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
                                        {request.member?.member_name_eng} ({request.member?.member_id})
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {request.savings_account?.account_no}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {request.amount}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span className="relative inline-block px-3 py-1 font-semibold text-orange-900 leading-tight">
                                            <span aria-hidden className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
                                            <span className="relative capitalize">{request.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <select
                                            className="block w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                                            value={request.status}
                                            onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approve</option>
                                            <option value="rejected">Reject</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DepositRequestList;