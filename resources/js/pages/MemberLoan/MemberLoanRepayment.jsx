import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const initialForm = {
    payment_date: new Date().toISOString().split('T')[0],
    emi_amount: '',
    interest_amount: '',
    remarks: '',
};

const MemberLoanRepayment = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-repayments');
            setAccounts(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load member loan accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAccount = async (account) => {
        setSelectedAccount(account);
        const response = await api.get(`/member-loan-accounts/${account.id}/history`);
        setHistory(response.data || []);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAccount) {
            Swal.fire('Error', 'Select an account first', 'error');
            return;
        }

        try {
            await api.post('/member-loan-repayments', {
                account_id: selectedAccount.id,
                ...formData,
            });
            Swal.fire('Success', 'Repayment processed successfully', 'success');
            setFormData(initialForm);
            fetchAccounts();
            loadAccount(selectedAccount);
        } catch (error) {
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : (error.response?.data?.message || 'Repayment failed'), 'error');
        }
    };

    if (!hasPermission('member.loan.repayment.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Member Loan Repayment</h1>
                <p className="text-sm text-gray-500">Take EMI and interest input, then auto-adjust against current dues.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Account</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Outstanding</th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="3" className="px-4 py-6 text-center">Loading...</td></tr>
                            ) : accounts.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">No active account found.</td></tr>
                            ) : accounts.map((account) => (
                                <tr key={account.id} className={`cursor-pointer hover:bg-gray-50 ${selectedAccount?.id === account.id ? 'bg-blue-50' : ''}`} onClick={() => loadAccount(account)}>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{account.account_no}</div>
                                        <div className="text-xs text-gray-400">{account.member?.member_name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{account.total_outstanding}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{account.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">Repayment Entry</h2>
                        {selectedAccount ? (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div><span className="font-medium">Principal:</span> {selectedAccount.outstanding_principal}</div>
                                    <div><span className="font-medium">Interest:</span> {selectedAccount.accrued_interest_balance}</div>
                                    <div><span className="font-medium">Overdue:</span> {selectedAccount.overdue_interest_balance}</div>
                                    <div><span className="font-medium">Next Accrual:</span> {selectedAccount.next_accrual_date || '-'}</div>
                                </div>
                                {hasPermission('member.loan.repayment.create') && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Payment Date</label>
                                            <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">EMI Amount</label>
                                            <input type="number" step="0.01" name="emi_amount" value={formData.emi_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Interest Amount</label>
                                            <input type="number" step="0.01" name="interest_amount" value={formData.interest_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Remarks</label>
                                            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                                        </div>
                                        <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Post Repayment</button>
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-gray-500">Select an account from the left side.</div>
                        )}
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Transactions</h2>
                        <div className="space-y-3">
                            {history.slice(0, 10).map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                                    <div>
                                        <div className="font-medium text-gray-700">{item.transaction_type}</div>
                                        <div className="text-xs text-gray-400">{item.transaction_date}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-700">{item.input_total_amount}</div>
                                        <div className="text-xs text-gray-400">Bal: {item.total_outstanding_after}</div>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <div className="text-sm text-gray-500">No transaction found.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberLoanRepayment;
