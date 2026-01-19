import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const DepositRequest = () => {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [status]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/deposit-requests', { params: { status } });
            setRequests(response.data);
        } catch (err) {
            console.error('Failed to fetch deposit requests', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, nextStatus) => {
        try {
            await api.put(`/deposit-requests/${id}`, { status: nextStatus });
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: `Request ${nextStatus}`,
                showConfirmButton: false,
                timer: 1200,
                toast: true
            });
            fetchRequests();
        } catch (err) {
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Failed to update status',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Deposit Requests</h2>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 rounded-md border border-gray-300"
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td className="px-6 py-4" colSpan={5}>Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td className="px-6 py-4" colSpan={5}>No requests found</td></tr>
                        ) : (
                            requests.map(r => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 text-sm text-gray-700">{r.member?.member_name || r.member_id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{r.savings_account_id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{r.amount}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{r.status}</td>
                                    <td className="px-6 py-4">
                                        {status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateStatus(r.id, 'approved')}
                                                    className="px-3 py-1 rounded bg-green-600 text-white"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(r.id, 'rejected')}
                                                    className="px-3 py-1 rounded bg-red-600 text-white"
                                                >
                                                    Reject
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
    );
};

export default DepositRequest;
