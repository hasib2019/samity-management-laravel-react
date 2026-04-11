import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const WithdrawRequest = () => {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [status]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/withdraw-requests', { params: { status } });
            setRequests(response.data);
        } catch (err) {
            console.error('Failed to fetch withdraw requests', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, nextStatus) => {
        try {
            if (nextStatus === 'approved') {
                const req = requests.find(r => r.id === id);
                const memberId = req?.member_id || req?.member?.id;
                if (!memberId) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: 'Member information missing',
                        showConfirmButton: false,
                        timer: 1500,
                        toast: true
                    });
                    return;
                }
                const accountsRes = await api.get(`/global/members/${memberId}/accounts`);
                const savingsAccounts = accountsRes.data?.savings || [];
                const acc = savingsAccounts.find(a => String(a.id) === String(req.savings_account_id));
                if (!acc) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: 'Account not found',
                        showConfirmButton: false,
                        timer: 1500,
                        toast: true
                    });
                    return;
                }
                const minBal = acc.product?.min_amount ? parseFloat(acc.product.min_amount) : 0;
                const currBal = acc.current_balance ? parseFloat(acc.current_balance) : 0;
                const available = Math.max(currBal - minBal, 0);
                const reqAmt = req.amount ? parseFloat(req.amount) : 0;
                if (reqAmt > available) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: `Insufficient balance. Available: ${available.toFixed(2)}`,
                        showConfirmButton: false,
                        timer: 2000,
                        toast: true
                    });
                    return;
                }
            }
            await api.put(`/withdraw-requests/${id}`, { status: nextStatus });
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
                title: err?.response?.data?.message || 'Failed to update status',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Withdraw Requests</h2>
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

            <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                            <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Account</th>
                            <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
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
                                                    className="px-3 py-1 text-white bg-green-600 rounded"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(r.id, 'rejected')}
                                                    className="px-3 py-1 text-white bg-red-600 rounded"
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

export default WithdrawRequest;
