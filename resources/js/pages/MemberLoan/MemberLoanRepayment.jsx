import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import LoadingButton from '../../components/LoadingButton';

const initialForm = {
    payment_date: new Date().toISOString().split('T')[0],
    emi_amount: '',
    interest_amount: '',
    remarks: '',
};

const parseSafeDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    const normalizedValue = String(value).trim();
    if (!normalizedValue) return null;

    const dateOnlyMatch = normalizedValue.match(/^(\d{4}-\d{2}-\d{2})/);
    const candidate = dateOnlyMatch ? `${dateOnlyMatch[1]}T00:00:00` : normalizedValue;
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (dateString, days) => {
    const date = parseSafeDate(dateString);
    if (!date) return null;
    date.setDate(date.getDate() + days);
    return date;
};

const calculatePreviewBalance = (account, currentBalance, paymentDate) => {
    if (!account) return null;

    const principal = Number(currentBalance?.outstanding_principal ?? account.outstanding_principal ?? 0);
    let accruedInterest = Number(currentBalance?.accrued_interest_balance ?? account.accrued_interest_balance ?? 0);
    const overdueInterest = Number(currentBalance?.overdue_interest_balance ?? account.overdue_interest_balance ?? 0);
    const monthlyRate = Number(account.monthly_interest_rate ?? 0);
    const baseNextAccrualDate =
        currentBalance?.next_accrual_date ??
        account.next_accrual_date ??
        formatDate(addDays(account.last_accrual_date ?? account.disbursed_date, 30));
    let nextAccrualDate = baseNextAccrualDate;
    let accrualCount = 0;

    if (paymentDate && nextAccrualDate && principal > 0) {
        const asOf = parseSafeDate(paymentDate);
        let nextDate = parseSafeDate(nextAccrualDate);

        while (asOf && nextDate && nextDate <= asOf) {
            accruedInterest += Number(((principal * monthlyRate) / 100).toFixed(2));
            accrualCount += 1;
            nextDate = addDays(formatDate(nextDate), 30);
        }

        nextAccrualDate = formatDate(nextDate);
    }

    const totalOutstanding = Number((principal + accruedInterest + overdueInterest).toFixed(2));
    const status = totalOutstanding <= 0
        ? 'closed'
        : (() => {
            const nextDate = parseSafeDate(nextAccrualDate);
            const asOf = parseSafeDate(paymentDate);
            return nextDate && asOf && nextDate <= asOf
                ? 'overdue'
                : (currentBalance?.status ?? account.status ?? 'active');
        })();

    return {
        outstanding_principal: principal,
        accrued_interest_balance: Number(accruedInterest.toFixed(2)),
        overdue_interest_balance: overdueInterest,
        total_outstanding: totalOutstanding,
        next_accrual_date: nextAccrualDate,
        status,
        accrual_count: accrualCount,
    };
};

const MemberLoanRepayment = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialForm);
    const [balanceInfo, setBalanceInfo] = useState(null);
    const previewBalance = useMemo(
        () => calculatePreviewBalance(selectedAccount, balanceInfo, formData.payment_date),
        [selectedAccount, balanceInfo, formData.payment_date]
    );

    const principalDue = Number(previewBalance?.outstanding_principal ?? 0);
    const interestDue = Number((previewBalance?.accrued_interest_balance ?? 0) + (previewBalance?.overdue_interest_balance ?? 0));
    const totalDue = Number(previewBalance?.total_outstanding ?? 0);
    const enteredPrincipal = Number(formData.emi_amount || 0);
    const enteredInterest = Number(formData.interest_amount || 0);
    const enteredTotal = enteredPrincipal + enteredInterest;

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-repayments');
            const fetchedAccounts = response.data || [];
            setAccounts(fetchedAccounts);
            return fetchedAccounts;
        } catch (error) {
            Swal.fire('Error', 'Failed to load member loan accounts', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const loadAccount = async (account) => {
        setSelectedAccount(account);
        const [historyResponse, balanceResponse] = await Promise.all([
            api.get(`/member-loan-accounts/${account.id}/history`),
            api.get(`/member-loan-accounts/${account.id}/balance`),
        ]);
        setHistory(historyResponse.data || []);
        setBalanceInfo(balanceResponse.data || null);
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

        if (enteredPrincipal - principalDue > 0.009) {
            Swal.fire('Error', 'Outstanding balance input current principal due er cheye beshi.', 'error');
            return;
        }

        if (enteredInterest - interestDue > 0.009) {
            Swal.fire('Error', 'Interest input current interest due er cheye beshi.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/member-loan-repayments', {
                account_id: selectedAccount.id,
                emi_amount: formData.emi_amount,
                interest_amount: formData.interest_amount,
                payment_amount: enteredTotal,
                payment_date: formData.payment_date,
                remarks: formData.remarks,
            });
            const postedAccount = response.data?.data || null;
            setFormData(initialForm);
            const refreshedAccounts = await fetchAccounts();
            const latestAccount =
                refreshedAccounts.find((account) => String(account.id) === String(selectedAccount.id)) ||
                postedAccount ||
                selectedAccount;

            if (String(latestAccount?.status).toLowerCase() === 'closed') {
                setSelectedAccount(null);
                setBalanceInfo(null);
                setHistory([]);
                Swal.fire('Success', 'Full due payment deya hoise. Loan account auto close hoye geche.', 'success');
            } else {
                await loadAccount(latestAccount);
                Swal.fire('Success', 'Repayment processed successfully', 'success');
            }
        } catch (error) {
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : (error.response?.data?.message || 'Repayment failed'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasPermission('member.loan.repayment.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Member Loan Repayment</h1>
                <p className="text-sm text-gray-500">System 30 din por por outstanding principal-er upor interest calculate korbe. Ekhane principal/outstanding ar interest alada input deya jabe.</p>
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
                                    <div><span className="font-medium">Principal:</span> {previewBalance?.outstanding_principal ?? 0}</div>
                                    <div><span className="font-medium">Interest:</span> {interestDue.toFixed(2)}</div>
                                    <div><span className="font-medium">Total Due:</span> {previewBalance?.total_outstanding ?? 0}</div>
                                    <div><span className="font-medium">Next 30 Day Date:</span> {previewBalance?.next_accrual_date || '-'}</div>
                                    <div><span className="font-medium">Last Payment Date:</span> {formatDate(parseSafeDate(selectedAccount?.last_payment_date)) || '-'}</div>
                                </div>
                                <div className="mb-4 text-xs text-amber-700">
                                    Payment Date extra 30 day accrual count: {previewBalance?.accrual_count ?? 0}
                                </div>
                                <div className="p-3 mb-4 text-sm text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                                    Full due amount payment dile repayment submit-er shathe shathe loan account auto close hoye jabe.
                                </div>
                                {hasPermission('member.loan.repayment.create') && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Payment Date</label>
                                            <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="px-3 py-2 w-full rounded-lg border" required />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Outstanding Balance Input</label>
                                            <input type="number" step="0.01" min="0" name="emi_amount" value={formData.emi_amount} onChange={handleChange} className="px-3 py-2 w-full rounded-lg border" placeholder={`Max ${principalDue.toFixed(2)}`} />
                                            <div className="mt-1 text-xs text-gray-500">Current principal due: {principalDue.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Interest Input</label>
                                            <input type="number" step="0.01" min="0" name="interest_amount" value={formData.interest_amount} onChange={handleChange} className="px-3 py-2 w-full rounded-lg border" placeholder={`Max ${interestDue.toFixed(2)}`} />
                                            <div className="mt-1 text-xs text-gray-500">Current interest due: {interestDue.toFixed(2)}</div>
                                        </div>
                                        <div className="p-3 text-sm bg-gray-50 rounded-lg border">
                                            <div><span className="font-medium">Entered Total:</span> {enteredTotal.toFixed(2)}</div>
                                            <div><span className="font-medium">Current Total Due:</span> {totalDue.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-medium">Remarks</label>
                                            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="px-3 py-2 w-full rounded-lg border" />
                                        </div>
                                        <LoadingButton type="submit" isLoading={submitting} loadingText="Posting..." className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                            Post Repayment
                                        </LoadingButton>
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
                                <div key={item.id} className="flex justify-between items-center pb-2 text-sm border-b">
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
