import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const fmt = (n) =>
    !n ? '' : Number(n).toLocaleString('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtTotal = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().split('T')[0];

const MemberBalanceReport = () => {
    const [samities, setSamities] = useState([]);
    const [samityId, setSamityId] = useState('');
    const [asOf, setAsOf]         = useState(today());
    const [report, setReport]     = useState(null);
    const [loading, setLoading]   = useState(false);
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
            const res = await api.get('/reports/member-balance', {
                params: { samity_id: samityId, as_of: asOf },
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
        const w = window.open('', '_blank', 'width=1100,height=800');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>সদস্য স্থিতি বিবরণী</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:'SutonnyMJ',Arial,sans-serif;font-size:10px;color:#000;padding:12px;}
          .header{text-align:center;margin-bottom:10px;}
          .header h2{font-size:15px;font-weight:bold;}
          .header p{font-size:11px;margin-top:2px;}
          table{width:100%;border-collapse:collapse;margin-top:8px;}
          th,td{border:1px solid #333;padding:3px 5px;}
          th{background:#e8f4fd;font-weight:bold;text-align:center;font-size:9px;}
          td{font-size:9.5px;}
          .num{text-align:right;}
          .center{text-align:center;}
          tfoot td{background:#f0f9ff;font-weight:bold;}
          @media print{@page{size:A4 landscape;margin:10mm;}}
        </style></head><body>${content}
        <script>window.onload=function(){window.print();}<\/script>
        </body></html>`);
        w.document.close();
    };

    const r = report;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">সদস্য স্থিতি বিবরণী</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">সমিতি</label>
                    <select
                        value={samityId}
                        onChange={e => setSamityId(e.target.value)}
                        className="px-3 py-2 text-sm rounded-md border border-gray-300 min-w-[220px]"
                    >
                        <option value="">সমিতি নির্বাচন করুন...</option>
                        {samities.map(s => (
                            <option key={s.id} value={s.id}>{s.samity_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">তারিখ পর্যন্ত</label>
                    <input
                        type="date"
                        value={asOf}
                        onChange={e => setAsOf(e.target.value)}
                        className="px-3 py-2 text-sm rounded-md border border-gray-300"
                    />
                </div>
                <button
                    onClick={fetchReport}
                    disabled={!samityId || loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'লোড হচ্ছে...' : 'তৈরি করুন'}
                </button>
                {r && (
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        প্রিন্ট করুন
                    </button>
                )}
            </div>

            {loading && <div className="py-10 text-center text-gray-500">রিপোর্ট তৈরি হচ্ছে...</div>}

            {r && !loading && (
                <div ref={printRef}>
                    {/* Report Header */}
                    <div className="header mb-4 text-center">
                        <h2 className="text-xl font-bold text-gray-900">{r.samity.name}</h2>
                        <p className="text-sm text-gray-600">{r.as_of} পর্যন্ত</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-300 shadow-sm">
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-blue-50">
                                    <th className="px-3 py-2 text-center border border-gray-300 w-12">ক্রমিক নং</th>
                                    <th className="px-3 py-2 text-left border border-gray-300 min-w-[180px]">সদস্য/সদস্যার নাম</th>
                                    <th className="px-3 py-2 text-center border border-gray-300 w-24">কোড নং</th>
                                    <th className="px-3 py-2 text-right border border-gray-300 w-28">শেয়ার স্থিতি</th>
                                    <th className="px-3 py-2 text-right border border-gray-300 w-32">সাধারণ সঞ্চয় স্থিতি</th>
                                    <th className="px-3 py-2 text-right border border-gray-300 w-28">মেয়াদী সঞ্চয় স্থিতি</th>
                                    <th className="px-3 py-2 text-right border border-gray-300 w-28">এককালীন সঞ্চয় স্থিতি</th>
                                    <th className="px-3 py-2 text-right border border-gray-300 w-28">বর্তমান ঋণ স্থিতি</th>
                                </tr>
                            </thead>
                            <tbody>
                                {r.rows.map((row) => (
                                    <tr key={row.member_id} className="hover:bg-gray-50 border-b border-gray-200">
                                        <td className="px-3 py-1.5 text-center border border-gray-200 text-gray-600">{row.serial}</td>
                                        <td className="px-3 py-1.5 border border-gray-200 font-medium text-gray-900">{row.member_name}</td>
                                        <td className="px-3 py-1.5 text-center border border-gray-200 font-mono text-xs text-gray-600">{row.member_code}</td>
                                        <td className="px-3 py-1.5 text-right border border-gray-200">{fmt(row.share_balance)}</td>
                                        <td className="px-3 py-1.5 text-right border border-gray-200">{fmt(row.savings_balance)}</td>
                                        <td className="px-3 py-1.5 text-right border border-gray-200">{fmt(row.dps_balance)}</td>
                                        <td className="px-3 py-1.5 text-right border border-gray-200">{fmt(row.fdr_balance)}</td>
                                        <td className={`px-3 py-1.5 text-right border border-gray-200 ${row.loan_balance > 0 ? 'text-red-700 font-semibold' : ''}`}>
                                            {fmt(row.loan_balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-50 font-bold text-gray-800">
                                    <td colSpan={3} className="px-3 py-2 text-right border border-gray-300">সর্বমোট</td>
                                    <td className="px-3 py-2 text-right border border-gray-300">{fmtTotal(r.totals.share)}</td>
                                    <td className="px-3 py-2 text-right border border-gray-300">{fmtTotal(r.totals.savings)}</td>
                                    <td className="px-3 py-2 text-right border border-gray-300">{fmtTotal(r.totals.dps)}</td>
                                    <td className="px-3 py-2 text-right border border-gray-300">{fmtTotal(r.totals.fdr)}</td>
                                    <td className="px-3 py-2 text-right border border-gray-300 text-red-700">{fmtTotal(r.totals.loan)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-5">
                        <Card label="শেয়ার" value={r.totals.share} color="gray" />
                        <Card label="সাধারণ সঞ্চয়" value={r.totals.savings} color="blue" />
                        <Card label="মেয়াদী সঞ্চয়" value={r.totals.dps} color="purple" />
                        <Card label="এককালীন সঞ্চয়" value={r.totals.fdr} color="green" />
                        <Card label="বর্তমান ঋণ" value={r.totals.loan} color="red" />
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ label, value, color }) => {
    const cls = {
        gray:   'bg-gray-50 border-gray-200 text-gray-700',
        blue:   'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        green:  'bg-green-50 border-green-200 text-green-700',
        red:    'bg-red-50 border-red-200 text-red-700',
    };
    return (
        <div className={`p-3 rounded-lg border ${cls[color]}`}>
            <div className="text-xs font-medium opacity-80">{label}</div>
            <div className="text-lg font-bold">
                {Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );
};

export default MemberBalanceReport;
