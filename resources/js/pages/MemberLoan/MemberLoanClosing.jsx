import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const MemberLoanClosing = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-closings');
            setAccounts(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load closable accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async (account) => {
        try {
            await api.post('/member-loan-closings', {
                account_id: account.id,
                closing_date: new Date().toISOString().split('T')[0],
                remarks: 'Full settlement closure',
            });
            Swal.fire('Success', 'Member loan closed successfully', 'success');
            fetchAccounts();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Loan closing failed', 'error');
        }
    };

    if (!hasPermission('member.loan.closing.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Member Loan Closing</h1>
                <p className="text-sm text-gray-500">Close loans when total outstanding is fully settled.</p>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Account</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Principal</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Interest</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Overdue</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="px-4 py-6 text-center">Loading...</td></tr>
                        ) : accounts.length === 0 ? (
                            <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No active account found.</td></tr>
                        ) : accounts.map((account) => (
                            <tr key={account.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div>{account.account_no}</div>
                                    <div className="text-xs text-gray-400">{account.member?.member_name}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{account.outstanding_principal}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{account.accrued_interest_balance}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{account.overdue_interest_balance}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-800">{account.total_outstanding}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    {hasPermission('member.loan.closing.create') && (
                                        <button onClick={() => handleClose(account)} className="text-blue-600 hover:text-blue-800">Close</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MemberLoanClosing;
