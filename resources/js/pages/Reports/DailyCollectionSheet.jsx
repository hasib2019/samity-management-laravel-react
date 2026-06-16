import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const money = (n) =>
    n == null || n === '' ? '—' :
    Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

const STATUS_CLS = {
    paid:    'bg-green-100 text-green-700',
    pending: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    due:     'bg-yellow-100 text-yellow-700',
    active:  'bg-gray-100 text-gray-600',
};

const Badge = ({ s }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_CLS[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
);

const DailyCollectionSheet = () => {
    const [samities, setSamities]   = useState([]);
    const [samityId, setSamityId]   = useState('');
    const [date, setDate]           = useState(today());
    const [report, setReport]       = useState(null);
    const [loading, setLoading]     = useState(false);
    const printRef = useRef();

    useEffect(() => {
        api.get('/global/samities').then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setSamities(list);
            if (list.length === 1) setSamityId(String(list[0].id));
        }).catch(() => {});
    }, []);

    const fetchReport = async () => {
        if (!samityId) return;
        setLoading(true);
        setReport(null);
        try {
            const res = await api.get('/reports/daily-collection-sheet', {
                params: { samity_id: samityId, date },
            });
            setReport(res.data?.data || null);
        } catch (err) {
            Swal.fire({
                position: 'top-end', icon: 'error', toast: true,
                title: err.response?.data?.message || 'Failed to load report',
                showConfirmButton: false, timer: 2500,
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const w = window.open('', '_blank', 'width=1200,height=800');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><title>Daily Collection Sheet</title>
        <style>
          *{box-sizing:border-box;}
          body{font-family:Arial,sans-serif;font-size:9px;color:#111;padding:8px;}
          h2{text-align:center;font-size:13px;margin:0 0 2px;}
          .sub-title{text-align:center;font-size:10px;margin:0 0 6px;}
          .meta{display:flex;justify-content:space-between;margin-bottom:6px;font-size:9px;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #555;padding:2px 3px;text-align:center;white-space:nowrap;}
          th{background:#dbeafe;font-weight:bold;font-size:8px;}
          .th-section{background:#bfdbfe;font-size:8px;}
          .text-left{text-align:left;}
          .text-right{text-align:right;}
          .tfoot td{background:#f1f5f9;font-weight:bold;}
          .paid{color:#166534;} .overdue{color:#991b1b;} .due{color:#92400e;} .pending{color:#1e40af;}
          @media print{@page{size:A3 landscape;margin:8mm;}}
        </style></head><body>${content}<script>window.onload=function(){window.print();}<\/script></body></html>`);
        w.document.close();
    };

    const r = report;
    const totals = r?.totals;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Daily Collection Sheet</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">Samity</label>
                    <select
                        value={samityId}
                        onChange={e => setSamityId(e.target.value)}
                        className="px-3 py-2 text-sm rounded-md border border-gray-300 min-w-[200px]"
                    >
                        <option value="">Select samity...</option>
                        {samities.map(s => (
                            <option key={s.id} value={s.id}>{s.samity_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="px-3 py-2 text-sm rounded-md border border-gray-300"
                    />
                </div>
                <button
                    onClick={fetchReport}
                    disabled={!samityId || loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Generate'}
                </button>
                {r && (
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        Print
                    </button>
                )}
            </div>

            {loading && <div className="py-10 text-center text-gray-500">Generating report...</div>}

            {r && !loading && (
                <div ref={printRef}>
                    {/* Header */}
                    <div className="mb-4 text-center">
                        <h2 className="text-xl font-bold text-gray-900">{r.samity.name}</h2>
                        <p className="text-lg font-bold text-blue-800">ডেইলি কালেকশন শিট</p>
                        <div className="flex gap-6 justify-center mt-1 text-sm text-gray-600">
                            <span>মাস: <b>{r.month_label}</b></span>
                            <span>তারিখ: <b>{r.date}</b></span>
                            <span>মাসিক ফি: <b>{money(r.samity.monthly_subscription_fee)}</b></span>
                            <span>জরিমানা: <b>{money(r.samity.penalty_amount)}</b></span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full text-xs border-collapse">
                            <thead>
                                <tr>
                                    <th rowSpan={2} className="px-2 py-2 text-center border border-gray-300 bg-gray-100">ক্রমিক</th>
                                    <th rowSpan={2} className="px-2 py-2 text-left border border-gray-300 bg-gray-100">কোড</th>
                                    <th rowSpan={2} className="px-2 py-2 text-left border border-gray-300 bg-gray-100 min-w-[140px]">সদস্যের নাম</th>
                                    {/* Savings */}
                                    <th colSpan={5} className="px-2 py-1 text-center border border-gray-300 bg-blue-100">সঞ্চয় (মাসিক চাঁদা)</th>
                                    {/* Loan */}
                                    <th colSpan={4} className="px-2 py-1 text-center border border-gray-300 bg-orange-100">ঋণ</th>
                                    {/* Member Loan */}
                                    <th colSpan={3} className="px-2 py-1 text-center border border-gray-300 bg-yellow-100">সদস্য ঋণ</th>
                                    {/* DPS */}
                                    <th colSpan={4} className="px-2 py-1 text-center border border-gray-300 bg-purple-100">ডি পি এস</th>
                                </tr>
                                <tr>
                                    {/* Savings sub-headers */}
                                    <th className="px-2 py-1 border border-gray-300 bg-blue-50">হিসাব নং</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-blue-50">মাসিক ফি</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-blue-50">জরিমানা</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-blue-50">মোট দেয়</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-blue-50">স্থিতি</th>
                                    {/* Loan sub-headers */}
                                    <th className="px-2 py-1 border border-gray-300 bg-orange-50">কিস্তি নং</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-orange-50">মূল ঋণ</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-orange-50">কিস্তি</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-orange-50">স্থিতি</th>
                                    {/* Member Loan sub-headers */}
                                    <th className="px-2 py-1 border border-gray-300 bg-yellow-50">বকেয়া</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-yellow-50">মাসিক দেয়</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-yellow-50">স্থিতি</th>
                                    {/* DPS sub-headers */}
                                    <th className="px-2 py-1 border border-gray-300 bg-purple-50">কিস্তি নং</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-purple-50">মাসিক</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-purple-50">জরিমানা</th>
                                    <th className="px-2 py-1 border border-gray-300 bg-purple-50">স্থিতি</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {r.rows.map((row) => (
                                    <tr key={row.member_id} className="hover:bg-gray-50">
                                        <td className="px-2 py-1.5 text-center border border-gray-200">{row.serial}</td>
                                        <td className="px-2 py-1.5 border border-gray-200 font-mono text-xs">{row.member_code}</td>
                                        <td className="px-2 py-1.5 border border-gray-200 font-medium">{row.member_name}</td>

                                        {/* Savings */}
                                        <td className="px-2 py-1.5 text-center border border-gray-200 text-[11px] text-gray-500">{row.savings.account_number || '—'}</td>
                                        <td className="px-2 py-1.5 text-right border border-gray-200">{money(row.savings.monthly_fee)}</td>
                                        <td className="px-2 py-1.5 text-right border border-gray-200 text-red-600">{money(row.savings.penalty)}</td>
                                        <td className="px-2 py-1.5 text-right border border-gray-200 font-semibold">{row.savings.status === 'paid' ? '—' : money(row.savings.total_due)}</td>
                                        <td className="px-2 py-1.5 text-center border border-gray-200"><Badge s={row.savings.status} /></td>

                                        {/* Loan */}
                                        {row.loan ? <>
                                            <td className="px-2 py-1.5 text-center border border-gray-200">{row.loan.installment_no ?? '—'}</td>
                                            <td className="px-2 py-1.5 text-right border border-gray-200">{money(row.loan.principal_amount)}</td>
                                            <td className="px-2 py-1.5 text-right border border-gray-200 font-semibold">{money(row.loan.installment_amount)}</td>
                                            <td className="px-2 py-1.5 text-center border border-gray-200"><Badge s={row.loan.status} /></td>
                                        </> : <td colSpan={4} className="px-2 py-1.5 text-center border border-gray-200 text-gray-300">—</td>}

                                        {/* Member Loan */}
                                        {row.member_loan ? <>
                                            <td className="px-2 py-1.5 text-right border border-gray-200">{money(row.member_loan.outstanding_balance)}</td>
                                            <td className="px-2 py-1.5 text-right border border-gray-200 font-semibold">{money(row.member_loan.monthly_due)}</td>
                                            <td className="px-2 py-1.5 text-center border border-gray-200"><Badge s={row.member_loan.status} /></td>
                                        </> : <td colSpan={3} className="px-2 py-1.5 text-center border border-gray-200 text-gray-300">—</td>}

                                        {/* DPS */}
                                        {row.dps ? <>
                                            <td className="px-2 py-1.5 text-center border border-gray-200">{row.dps.installment_no ?? '—'}</td>
                                            <td className="px-2 py-1.5 text-right border border-gray-200 font-semibold">{money(row.dps.monthly_amount)}</td>
                                            <td className="px-2 py-1.5 text-right border border-gray-200 text-red-600">{money(row.dps.fine_amount)}</td>
                                            <td className="px-2 py-1.5 text-center border border-gray-200"><Badge s={row.dps.status} /></td>
                                        </> : <td colSpan={4} className="px-2 py-1.5 text-center border border-gray-200 text-gray-300">—</td>}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold text-gray-800">
                                    <td colSpan={3} className="px-2 py-2 text-right border border-gray-300">মোট</td>
                                    {/* savings total */}
                                    <td className="border border-gray-300"></td>
                                    <td className="px-2 py-2 text-right border border-gray-300">
                                        {money(r.rows.reduce((s, x) => s + x.savings.monthly_fee, 0))}
                                    </td>
                                    <td className="px-2 py-2 text-right border border-gray-300 text-red-700">
                                        {money(r.rows.reduce((s, x) => s + x.savings.penalty, 0))}
                                    </td>
                                    <td className="px-2 py-2 text-right border border-gray-300">{money(totals.savings_due)}</td>
                                    <td className="border border-gray-300"></td>
                                    {/* loan total */}
                                    <td className="border border-gray-300"></td>
                                    <td className="border border-gray-300"></td>
                                    <td className="px-2 py-2 text-right border border-gray-300">{money(totals.loan_install)}</td>
                                    <td className="border border-gray-300"></td>
                                    {/* member loan total */}
                                    <td className="border border-gray-300"></td>
                                    <td className="px-2 py-2 text-right border border-gray-300">{money(totals.member_loan)}</td>
                                    <td className="border border-gray-300"></td>
                                    {/* dps total */}
                                    <td className="border border-gray-300"></td>
                                    <td className="px-2 py-2 text-right border border-gray-300">{money(totals.dps)}</td>
                                    <td className="border border-gray-300"></td>
                                    <td className="border border-gray-300"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-5">
                        <SummaryCard label="মাসিক চাঁদা" value={totals.savings_due} color="blue" />
                        <SummaryCard label="ঋণ কিস্তি" value={totals.loan_install} color="orange" />
                        <SummaryCard label="সদস্য ঋণ" value={totals.member_loan} color="yellow" />
                        <SummaryCard label="ডি পি এস" value={totals.dps} color="purple" />
                        <SummaryCard label="মোট সংগ্রহ" value={totals.grand_total} color="green" bold />
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ label, value, color, bold }) => {
    const colors = {
        blue:   'bg-blue-50 border-blue-200 text-blue-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        green:  'bg-green-50 border-green-200 text-green-700',
    };
    return (
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <div className="text-xs font-medium opacity-80">{label}</div>
            <div className={`text-lg ${bold ? 'font-extrabold' : 'font-bold'}`}>
                {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );
};

export default DailyCollectionSheet;
