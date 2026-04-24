import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import LoadingButton from '../../components/LoadingButton';

const initialForm = {
    closing_date: new Date().toISOString().split('T')[0],
    settlement_amount: '',
    remarks: 'Full settlement closure',
};

const parseAmount = (value) => Number(value || 0);

const MemberLoanClosing = () => {
    const { hasPermission } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [previewInfo, setPreviewInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            loadPreview(selectedAccount.id, formData.closing_date);
        }
    }, [selectedAccount, formData.closing_date]);

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

    const loadPreview = async (accountId, closingDate) => {
        setPreviewLoading(true);
        try {
            const response = await api.get(`/member-loan-accounts/${accountId}/balance`, {
                params: { as_of_date: closingDate },
            });
            const data = response.data || null;
            setPreviewInfo(data);
            setFormData((prev) => ({
                ...prev,
                settlement_amount: data ? String(data.total_outstanding ?? '') : '',
            }));
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setPreviewInfo(null);
        setFormData({
            ...initialForm,
            remarks: `Full settlement closure for ${account.account_no}`,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const settlementAmount = parseAmount(formData.settlement_amount);
    const previewTotalDue = parseAmount(previewInfo?.total_outstanding);
    const remainingAfterPayment = Math.max(previewTotalDue - settlementAmount, 0);
    const canClose = previewInfo && Math.abs(settlementAmount - previewTotalDue) <= 0.009 && settlementAmount > 0;

    const handleClose = async (e) => {
        e.preventDefault();

        if (!selectedAccount) {
            Swal.fire('Error', 'Age ekta account select korun', 'error');
            return;
        }

        if (!canClose) {
            Swal.fire('Error', 'Loan close korte full outstanding amount dite hobe', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/member-loan-closings', {
                account_id: selectedAccount.id,
                closing_date: formData.closing_date,
                settlement_amount: settlementAmount,
                remarks: formData.remarks,
            });
            Swal.fire('Success', 'Member loan closed successfully', 'success');
            setSelectedAccount(null);
            setPreviewInfo(null);
            setFormData(initialForm);
            fetchAccounts();
        } catch (error) {
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : (error.response?.data?.message || 'Loan closing failed'), 'error');
        } finally {
            setSubmitting(false);
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Account</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Principal</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Interest</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center">Loading...</td></tr>
                            ) : accounts.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">No active account found.</td></tr>
                            ) : accounts.map((account) => (
                                <tr key={account.id} className={`cursor-pointer hover:bg-gray-50 ${selectedAccount?.id === account.id ? 'bg-blue-50' : ''}`} onClick={() => handleSelectAccount(account)}>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{account.account_no}</div>
                                        <div className="text-xs text-gray-400">{account.member?.member_name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{account.outstanding_principal}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{Number(account.accrued_interest_balance || 0) + Number(account.overdue_interest_balance || 0)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-800">{account.total_outstanding}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Loan Closing Settlement</h2>
                    {selectedAccount ? (
                        <form onSubmit={handleClose} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Account No:</span> {selectedAccount.account_no}</div>
                                <div><span className="font-medium">Member:</span> {selectedAccount.member?.member_name || '-'}</div>
                                <div><span className="font-medium">Last Payment Date:</span> {selectedAccount.last_payment_date ? String(selectedAccount.last_payment_date).slice(0, 10) : '-'}</div>
                                <div><span className="font-medium">Status:</span> {previewInfo?.status || selectedAccount.status}</div>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Closing Date</label>
                                <input type="date" name="closing_date" value={formData.closing_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 text-sm border rounded-lg bg-gray-50">
                                <div><span className="font-medium">Principal Due:</span> {previewLoading ? 'Loading...' : (previewInfo?.outstanding_principal ?? 0)}</div>
                                <div><span className="font-medium">Interest Due:</span> {previewLoading ? 'Loading...' : (Number(previewInfo?.accrued_interest_balance || 0) + Number(previewInfo?.overdue_interest_balance || 0)).toFixed(2)}</div>
                                <div><span className="font-medium">Total Closing Due:</span> {previewLoading ? 'Loading...' : (previewInfo?.total_outstanding ?? 0)}</div>
                                <div><span className="font-medium">Next 30 Day Date:</span> {previewLoading ? 'Loading...' : (previewInfo?.next_accrual_date || '-')}</div>
                            </div>

                            <div className="p-3 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                                Closing date change korle oi date porjonto due preview update hobe. Full outstanding amount dilei account close hobe.
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Settlement Amount</label>
                                <input type="number" step="0.01" min="0" name="settlement_amount" value={formData.settlement_amount} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 text-sm border rounded-lg bg-amber-50">
                                <div><span className="font-medium">Given Amount:</span> {settlementAmount.toFixed(2)}</div>
                                <div><span className="font-medium">Outstanding After Payment:</span> {remainingAfterPayment.toFixed(2)}</div>
                            </div>

                            {!canClose && !previewLoading && (
                                <div className="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                                    Full due amount na dile loan close hobe na.
                                </div>
                            )}

                            <div>
                                <label className="block mb-1 text-sm font-medium">Remarks</label>
                                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                            </div>

                            {hasPermission('member.loan.closing.create') && (
                                <LoadingButton type="submit" isLoading={submitting} loadingText="Closing..." className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    Close Loan Account
                                </LoadingButton>
                            )}
                        </form>
                    ) : (
                        <div className="text-sm text-gray-500">Bam pas theke ekta account select korle closing settlement screen dekhabe.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberLoanClosing;
