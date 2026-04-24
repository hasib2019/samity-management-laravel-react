import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import LoadingButton from '../../components/LoadingButton';

const MemberLoanAccounts = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [statementMonth, setStatementMonth] = useState(new Date().toISOString().slice(0, 7));
    const [statement, setStatement] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statementLoading, setStatementLoading] = useState(false);
    const [accrualLoading, setAccrualLoading] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-accounts');
            setAccounts(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAccount = async (account) => {
        setSelectedAccount(account);
        const [historyRes, statementRes] = await Promise.all([
            api.get(`/member-loan-accounts/${account.id}/history`),
            api.get(`/member-loan-accounts/${account.id}/statement`, { params: { month: statementMonth } }),
        ]);
        setHistory(historyRes.data || []);
        setStatement(statementRes.data);
    };

    const refreshStatement = async (account = selectedAccount) => {
        if (!account) return;
        setStatementLoading(true);
        try {
            const response = await api.get(`/member-loan-accounts/${account.id}/statement`, { params: { month: statementMonth } });
            setStatement(response.data);
        } finally {
            setStatementLoading(false);
        }
    };

    const runAccrual = async () => {
        if (!selectedAccount) return;
        setAccrualLoading(true);
        try {
            await api.post(`/member-loan-accounts/${selectedAccount.id}/accrue`, {
                as_of_date: new Date().toISOString().split('T')[0],
                remarks: 'Manual accrual run',
            });
            Swal.fire('Success', 'Accrual completed successfully', 'success');
            fetchAccounts();
            loadAccount(selectedAccount);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Accrual failed', 'error');
        } finally {
            setAccrualLoading(false);
        }
    };

    if (!hasPermission('member.loan.account.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Member Loan Accounts</h1>
                    <p className="text-sm text-gray-500">View outstanding principal, 30 day interest accrual and repayment history.</p>
                </div>
                {selectedAccount && hasPermission('member.loan.accrual.run') && (
                    <LoadingButton onClick={runAccrual} isLoading={accrualLoading} loadingText="Running..." className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        Run 30 Day Accrual
                    </LoadingButton>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                                <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">No account found.</td></tr>
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Monthly Loan Summary</h2>
                            <div className="flex gap-2">
                                <input type="month" value={statementMonth} onChange={(e) => setStatementMonth(e.target.value)} className="px-3 py-2 border rounded-lg" />
                                <LoadingButton onClick={() => refreshStatement()} isLoading={statementLoading} loadingText="Loading..." className="px-3 py-2 border rounded-lg">
                                    Load
                                </LoadingButton>
                            </div>
                        </div>
                        {statement ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Opening Due:</span> {statement.opening_balance}</div>
                                <div><span className="font-medium">30 Day Interest:</span> {statement.interest_charged}</div>
                                <div><span className="font-medium">Payments:</span> {statement.payments_received}</div>
                                <div className="col-span-2"><span className="font-medium">Closing Due:</span> {statement.closing_balance}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">Select an account to view statement.</div>
                        )}
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">Transaction History</h2>
                        <div className="space-y-3 max-h-[420px] overflow-y-auto">
                            {history.map((item) => (
                                <div key={item.id} className="flex items-center justify-between pb-2 text-sm border-b">
                                    <div>
                                        <div className="font-medium text-gray-700">{item.transaction_type}</div>
                                        <div className="text-xs text-gray-400">{item.transaction_date}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-700">{item.input_total_amount || item.accrued_interest_amount || 0}</div>
                                        <div className="text-xs text-gray-400">Outstanding: {item.total_outstanding_after}</div>
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

export default MemberLoanAccounts;
