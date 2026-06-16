import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

const monthName = (m, y) =>
    new Date(y, (m || 1) - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
    samity_id: '',
    date: today(),
    member_id: '',
    savings_account_id: '',
    amount: '',        // fee only (goes to savings balance)
    total_amount: '',  // fee + penalty (what member actually pays)
    status: 'pending',
    description: '',
    is_subscription: true,
    period_month: '',
    period_year: '',
    penalty_amount: 0,
});

const DepositMoney = () => {
    const { user } = useAuth();
    const isUser = user?.roles?.some(role => role.slug === 'user');

    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState(emptyForm());

    const [dueInfo, setDueInfo] = useState(null);     // { monthly_fee, next_due, unpaid_months, summary }
    const [dueLoading, setDueLoading] = useState(false);
    const [slipFile, setSlipFile] = useState(null);
    const [slipPreview, setSlipPreview] = useState(null);  // { url, type, name, size }
    const [loading, setLoading] = useState(false);
    const [slip, setSlip] = useState(null);            // printable slip after a successful deposit

    useEffect(() => { fetchSamities(); }, []);

    useEffect(() => {
        if (formData.samity_id) {
            fetchMembers(formData.samity_id);
        } else {
            setMembers([]); setAccounts([]);
            setFormData(prev => ({ ...prev, member_id: '', savings_account_id: '' }));
        }
    }, [formData.samity_id]);

    useEffect(() => {
        if (formData.member_id) {
            fetchAccounts(formData.member_id);
        } else {
            setAccounts([]);
            setFormData(prev => ({ ...prev, savings_account_id: '' }));
        }
    }, [formData.member_id]);

    // Load the subscription due whenever subscription mode is on and a member is chosen.
    useEffect(() => {
        if (formData.is_subscription && formData.member_id) {
            fetchDue(formData.member_id);
        } else {
            setDueInfo(null);
            if (!formData.is_subscription) {
                setFormData(prev => ({ ...prev, period_month: '', period_year: '', penalty_amount: 0 }));
            }
        }
    }, [formData.is_subscription, formData.member_id]);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setSamities(list);
            if (list.length === 1) setFormData(prev => ({ ...prev, samity_id: list[0].id }));
        } catch (err) {
            console.error('Error fetching samities', err);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const response = await api.get(`/global/members?samity_id=${samityId}`);
            const list = response.data || [];
            setMembers(list);
            if (list.length === 1) setFormData(prev => ({ ...prev, member_id: list[0].id }));
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchAccounts = async (memberId) => {
        try {
            const response = await api.get(`/global/members/${memberId}/accounts`);
            const list = response.data.savings || [];
            setAccounts(list);
            if (list.length === 1) setFormData(prev => ({ ...prev, savings_account_id: list[0].id }));
        } catch (err) {
            console.error('Error fetching accounts', err);
            setAccounts([]);
        }
    };

    const fetchDue = async (memberId) => {
        setDueLoading(true);
        try {
            const res = await api.get('/member-subscription-due/next', { params: { member_id: memberId } });
            const d = res.data?.data || null;
            setDueInfo(d);
            if (d?.next_due) {
                applyMonth(d.next_due);
            } else {
                setFormData(prev => ({ ...prev, period_month: '', period_year: '', penalty_amount: 0, amount: '', total_amount: '' }));
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not load subscription due';
            Swal.fire({ position: 'top-end', icon: 'error', title: msg, showConfirmButton: false, timer: 2500, toast: true });
            setDueInfo(null);
        } finally {
            setDueLoading(false);
        }
    };

    // Apply a selected unpaid month -> fills period, penalty, deposit amount, and total.
    const applyMonth = (m) => {
        setFormData(prev => ({
            ...prev,
            period_month: m.month,
            period_year: m.year,
            penalty_amount: m.penalty,
            amount: m.subscription_fee,  // fee only → stored in deposit_requests.amount
            total_amount: m.total,       // fee + penalty → shown as total payable
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleMonthChange = (e) => {
        const key = e.target.value;
        const m = (dueInfo?.unpaid_months || []).find(x => `${x.year}-${x.month}` === key);
        if (m) applyMonth(m);
    };

    // Build a local preview for the chosen slip so the user can confirm the file.
    const handleSlipChange = (e) => {
        const file = e.target.files?.[0] || null;
        setSlipFile(file);
        setSlipPreview(prev => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            if (!file) return null;
            return { url: URL.createObjectURL(file), type: file.type, name: file.name, size: file.size };
        });
    };

    const clearSlipPreview = () => {
        setSlipPreview(prev => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return null;
        });
    };

    const resetForm = () => {
        setFormData(emptyForm());
        setMembers([]); setAccounts([]); setDueInfo(null); setSlipFile(null);
        clearSlipPreview();
        if (samities.length === 1) setFormData(prev => ({ ...emptyForm(), samity_id: samities[0].id }));
    };

    const buildSlip = (body) => {
        const savedId = body?.data?.id;
        const member = members.find(m => String(m.id) === String(formData.member_id));
        const account = accounts.find(a => String(a.id) === String(formData.savings_account_id));
        const samity = samities.find(s => String(s.id) === String(formData.samity_id));
        const fee = Number(formData.amount || 0);
        const penalty = Number(formData.penalty_amount || 0);
        const total = Number(formData.total_amount || 0) || fee + penalty;
        return {
            ref: body?.reference || (savedId ? `DEP-${savedId}` : '—'),
            samity_name: samity?.samity_name || 'Samity',
            member_name: member?.member_name || '',
            member_code: member?.member_code || '',
            account_number: account?.account_number || '',
            product: account?.product?.product_name || 'Savings',
            date: formData.date,
            is_subscription: formData.is_subscription,
            period: formData.is_subscription && formData.period_month
                ? monthName(formData.period_month, formData.period_year) : null,
            fee,
            penalty,
            total,
            status: body?.data?.status || (isUser ? 'pending' : formData.status),
            balance: body?.balance != null ? Number(body.balance) : null,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!slipFile) {
            Swal.fire({ position: 'top-end', icon: 'warning', title: 'A deposit slip is required', showConfirmButton: false, timer: 2200, toast: true });
            return;
        }
        if (formData.is_subscription && !formData.period_month) {
            Swal.fire({ position: 'top-end', icon: 'warning', title: 'No subscription month is due to pay', showConfirmButton: false, timer: 2500, toast: true });
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('member_id', formData.member_id);
            fd.append('savings_account_id', formData.savings_account_id);
            fd.append('amount', formData.amount || 0);
            fd.append('total_amount', formData.total_amount || formData.amount || 0);
            fd.append('status', isUser ? 'pending' : formData.status);
            fd.append('description', formData.description || '');
            fd.append('is_subscription', formData.is_subscription ? '1' : '0');
            if (formData.is_subscription) {
                fd.append('period_month', formData.period_month);
                fd.append('period_year', formData.period_year);
                fd.append('penalty_amount', formData.penalty_amount || 0);
            }
            fd.append('attachment', slipFile);

            const res = await api.post('/deposit-requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

            const slipData = buildSlip(res.data);

            Swal.fire({ position: 'top-end', icon: 'success', title: 'Deposit submitted successfully!', showConfirmButton: false, timer: 1500, toast: true });

            setSlip(slipData);   // show printable slip
            resetForm();
        } catch (err) {
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors)[0][0]
                : (err.response?.data?.message || 'Failed to submit deposit request.');
            Swal.fire({ position: 'top-end', icon: 'error', title: msg, showConfirmButton: false, timer: 3000, toast: true });
        } finally {
            setLoading(false);
        }
    };

    const printSlip = () => {
        if (!slip) return;
        const c = money;
        const rows = [
            ['Reference', slip.ref],
            ['Date', slip.date],
            ['Member', `${slip.member_name}${slip.member_code ? ` (${slip.member_code})` : ''}`],
            ['Account', `${slip.account_number} — ${slip.product}`],
            slip.is_subscription ? ['Subscription Month', slip.period] : null,
            slip.is_subscription ? ['Subscription Fee', c(slip.fee)] : null,
            slip.is_subscription ? ['Penalty', c(slip.penalty)] : null,
            ['Total Amount', c(slip.total)],
            (slip.status === 'approved' && slip.balance != null) ? ['Balance After Deposit', c(slip.balance)] : null,
            ['Status', slip.status],
        ].filter(Boolean);

        const html = `<!DOCTYPE html><html><head><title>Deposit Slip ${slip.ref}</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;padding:24px;}
          .slip{max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;}
          .head{background:#1e3a8a;color:#fff;padding:18px 22px;}
          .head h1{margin:0;font-size:18px;} .head p{margin:4px 0 0;font-size:12px;color:#bfdbfe;}
          table{width:100%;border-collapse:collapse;} td{padding:10px 22px;font-size:14px;border-bottom:1px solid #f1f5f9;}
          td.k{color:#6b7280;} td.v{text-align:right;font-weight:bold;}
          tr.total td{background:#ecfdf5;color:#047857;font-size:16px;}
          .foot{padding:14px 22px;font-size:11px;color:#9ca3af;}
        </style></head><body>
          <div class="slip">
            <div class="head"><h1>${slip.samity_name}</h1><p>Deposit Slip</p></div>
            <table>${rows.map(([k, v], i) => `<tr class="${k === 'Total Amount' ? 'total' : ''}"><td class="k">${k}</td><td class="v">${v ?? '—'}</td></tr>`).join('')}</table>
            <div class="foot">System-generated deposit slip. Please retain for your records.</div>
          </div>
          <script>window.onload=function(){window.print();}</script>
        </body></html>`;

        const w = window.open('', '_blank', 'width=640,height=720');
        if (w) { w.document.write(html); w.document.close(); }
    };

    const inputCls = 'px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline';
    const labelCls = 'block mb-2 text-sm font-bold text-gray-700';

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* This menu is dedicated to monthly subscription payments */}
                <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-semibold text-blue-900">Monthly Subscription Payment</p>
                    <p className="text-xs text-blue-700">The amount is calculated from the member's due month (fee + penalty if overdue).</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="mb-2">
                        <label className={labelCls} htmlFor="samity_id">Samity</label>
                        <select name="samity_id" id="samity_id" value={formData.samity_id} onChange={handleChange} className={inputCls} required>
                            <option value="">Select Samity</option>
                            {samities.map(s => <option key={s.id} value={s.id}>{s.samity_name}</option>)}
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className={labelCls} htmlFor="date">Date</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={inputCls} required />
                    </div>

                    <div className="mb-2">
                        <label className={labelCls} htmlFor="member_id">Member</label>
                        <select name="member_id" id="member_id" value={formData.member_id} onChange={handleChange} className={inputCls} required disabled={!formData.samity_id}>
                            <option value="">Select Member</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.member_name} ({m.member_code})</option>)}
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className={labelCls} htmlFor="savings_account_id">Account Number</label>
                        <select name="savings_account_id" id="savings_account_id" value={formData.savings_account_id} onChange={handleChange} className={inputCls} required disabled={!formData.member_id}>
                            <option value="">Select Account</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} - {a.product?.product_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Subscription due panel */}
                {formData.is_subscription && (
                    <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                        {dueLoading ? (
                            <div className="text-sm text-amber-700">Loading subscription due...</div>
                        ) : !formData.member_id ? (
                            <div className="text-sm text-amber-700">Select a member to see their subscription due.</div>
                        ) : !dueInfo || !dueInfo.next_due ? (
                            <div className="text-sm font-medium text-green-700">✓ This member has no subscription due. All months are paid.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block mb-1 text-xs font-semibold tracking-wide text-amber-800 uppercase">Pay for Month</label>
                                        <select
                                            value={`${formData.period_year}-${formData.period_month}`}
                                            onChange={handleMonthChange}
                                            className={inputCls}
                                        >
                                            {(dueInfo.unpaid_months || []).map(m => (
                                                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                                                    {m.month_label} — {m.status === 'overdue' ? 'Overdue' : 'Due'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-sm text-amber-900">
                                        <div className="flex justify-between"><span>Subscription Fee</span><span className="font-semibold">{money(formData.amount)}</span></div>
                                        <div className="flex justify-between"><span>Penalty {Number(formData.penalty_amount) > 0 ? '(overdue)' : ''}</span><span className="font-semibold">{money(formData.penalty_amount)}</span></div>
                                        <div className="flex justify-between pt-1 mt-1 border-t border-amber-200 text-base"><span className="font-bold">Total Payable</span><span className="font-bold text-red-700">{money(formData.total_amount)}</span></div>
                                    </div>
                                </div>
                                {dueInfo.summary && (
                                    <p className="text-xs text-amber-700">
                                        {dueInfo.summary.overdue_months} overdue month(s) · total outstanding <b>{money(dueInfo.summary.total_outstanding)}</b>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="mb-2">
                        <label className={labelCls} htmlFor="amount">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={formData.is_subscription ? (formData.total_amount || '') : formData.amount}
                            onChange={handleChange}
                            className={`${inputCls} ${formData.is_subscription ? 'bg-gray-100' : ''}`}
                            required
                            min="0"
                            step="0.01"
                            readOnly={formData.is_subscription}
                        />
                        {formData.is_subscription && <p className="mt-1 text-xs text-gray-500">Auto-calculated from the selected month (fee + penalty).</p>}
                    </div>

                    {/* Mandatory deposit slip */}
                    <div className="mb-2">
                        <label className={labelCls} htmlFor="attachment">Deposit Slip <span className="text-red-500">*</span></label>
                        <input
                            type="file"
                            id="attachment"
                            accept="image/*,application/pdf"
                            onChange={handleSlipChange}
                            className="px-3 py-2 w-full text-sm rounded border shadow"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Image or PDF, max 4 MB. Required for every deposit.</p>

                        {slipPreview && (
                            <div className="mt-2 p-2 rounded border border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
                                    <span className="truncate" title={slipPreview.name}>
                                        {slipPreview.name} · {Math.max(1, Math.round(slipPreview.size / 1024))} KB
                                    </span>
                                    <a href={slipPreview.url} target="_blank" rel="noreferrer" className="ml-2 font-medium text-blue-600 shrink-0 hover:underline">Open full</a>
                                </div>
                                {slipPreview.type.startsWith('image/') ? (
                                    <img src={slipPreview.url} alt="Deposit slip preview" className="object-contain mx-auto max-h-64 bg-white rounded border" />
                                ) : slipPreview.type === 'application/pdf' ? (
                                    <iframe src={slipPreview.url} title="Deposit slip preview" className="w-full bg-white rounded border h-72" />
                                ) : (
                                    <div className="p-3 text-xs text-center text-gray-500">No inline preview for this file type — use “Open full”.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {!isUser && (
                        <div className="mb-2">
                            <label className={labelCls} htmlFor="status">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className={inputCls} required>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="mb-2">
                    <label className={labelCls} htmlFor="description">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} className={inputCls} rows="3"></textarea>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Submit Deposit'}
                    </button>
                </div>
            </form>

            {/* Printable slip modal */}
            {slip && (
                <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
                        <div className="px-6 py-4 text-white rounded-t-xl bg-blue-900">
                            <h3 className="text-lg font-bold">{slip.samity_name}</h3>
                            <p className="text-sm text-blue-200">Deposit Slip · {slip.ref}</p>
                        </div>
                        <div className="px-6 py-4 text-sm divide-y divide-gray-100">
                            <Row k="Date" v={slip.date} />
                            <Row k="Member" v={`${slip.member_name}${slip.member_code ? ` (${slip.member_code})` : ''}`} />
                            <Row k="Account" v={`${slip.account_number} — ${slip.product}`} />
                            {slip.is_subscription && <Row k="Subscription Month" v={slip.period} />}
                            {slip.is_subscription && <Row k="Subscription Fee" v={money(slip.fee)} />}
                            {slip.is_subscription && <Row k="Penalty" v={money(slip.penalty)} />}
                            <Row k="Total Amount" v={money(slip.total)} strong />
                            {slip.status === 'approved' && slip.balance != null && <Row k="Balance After Deposit" v={money(slip.balance)} strong />}
                            <Row k="Status" v={slip.status} />
                        </div>
                        <div className="flex gap-3 justify-end px-6 py-4 bg-gray-50 rounded-b-xl">
                            <button onClick={() => setSlip(null)} className="px-4 py-2 text-sm font-medium text-gray-700 rounded border hover:bg-gray-100">Close</button>
                            <button onClick={printSlip} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Print Slip</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Row = ({ k, v, strong }) => (
    <div className="flex justify-between py-2">
        <span className="text-gray-500">{k}</span>
        <span className={strong ? 'font-bold text-blue-900' : 'font-medium text-gray-800'}>{v ?? '—'}</span>
    </div>
);

export default DepositMoney;
