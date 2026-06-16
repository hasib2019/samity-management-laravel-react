import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_BADGE = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  due: 'bg-yellow-100 text-yellow-800',
};

const MemberDue = () => {
  const { hasPermission } = useAuth();
  const canView = hasPermission('subscription.due.view');

  const [samities, setSamities] = useState([]);
  const [members, setMembers] = useState([]);
  const [samityId, setSamityId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canView) fetchSamities();
  }, []);

  const fetchSamities = async () => {
    try {
      const res = await api.get('/global/samities');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSamities(list);
      if (list.length === 1) onSamityChange(String(list[0].id));
    } catch (e) {
      setSamities([]);
    }
  };

  const onSamityChange = async (id) => {
    setSamityId(id);
    setMemberId('');
    setMembers([]);
    setReport(null);
    if (!id) return;
    try {
      const res = await api.get(`/global/members?samity_id=${id}`);
      setMembers(res.data || []);
    } catch (e) {
      setMembers([]);
    }
  };

  const fetchReport = async (mId) => {
    setMemberId(mId);
    setReport(null);
    if (!mId) return;
    setLoading(true);
    try {
      const res = await api.get('/member-subscription-due', { params: { member_id: mId } });
      setReport(res.data?.data || null);
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Failed to load due report', showConfirmButton: false, timer: 2500, toast: true });
    } finally {
      setLoading(false);
    }
  };

  if (!canView) return <div className="py-10 text-center text-red-500">Permission Denied</div>;

  const s = report?.summary;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Member Subscription Due</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Samity</label>
          <select value={samityId} onChange={(e) => onSamityChange(e.target.value)} className="px-3 py-2 w-full rounded-md border border-gray-300">
            <option value="">Select samity...</option>
            {samities.map((s) => (
              <option key={s.id} value={s.id}>{s.samity_name} ({s.samity_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Member</label>
          <select value={memberId} onChange={(e) => fetchReport(e.target.value)} disabled={!samityId} className="px-3 py-2 w-full rounded-md border border-gray-300 disabled:bg-gray-100">
            <option value="">Select member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.member_name} {m.member_code ? `(${m.member_code})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="py-10 text-center text-gray-500">Calculating...</div>}

      {report && !loading && (
        <>
          {/* Context */}
          <div className="p-4 text-sm bg-blue-50 rounded-lg border border-blue-100 text-blue-900">
            <span className="font-semibold">{report.member.name}</span>
            {report.member.code ? ` (${report.member.code})` : ''} — monthly fee <b>{money(report.samity.monthly_subscription_fee)}</b>,
            penalty <b>{money(report.samity.penalty_amount)}</b> after day <b>{report.samity.penalty_late_date}</b> of each month.
            Schedule from <b>{report.start_date}</b> to <b>{report.as_of}</b>.
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Months</div>
              <div className="text-2xl font-bold text-gray-800">{s.months_count}</div>
              <div className="text-xs text-gray-500">
                <span className="text-green-600">{s.paid_months} paid</span> · <span className="text-red-500">{s.overdue_months} overdue</span>
              </div>
            </div>
            <div className="p-4 rounded-lg border shadow-sm bg-green-50 border-green-200">
              <div className="text-xs text-green-700 uppercase">Total Paid</div>
              <div className="text-2xl font-bold text-green-700">{money(s.total_paid)}</div>
            </div>
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Penalty</div>
              <div className="text-2xl font-bold text-amber-600">{money(s.total_penalty)}</div>
            </div>
            <div className="p-4 rounded-lg border shadow-sm bg-red-50 border-red-200">
              <div className="text-xs text-red-600 uppercase">Outstanding</div>
              <div className="text-2xl font-bold text-red-700">{money(s.total_outstanding)}</div>
            </div>
          </div>

          {/* Month-wise table */}
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Subscription</th>
                  <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Penalty</th>
                  <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-xs font-medium text-center text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.months.map((m, i) => (
                  <tr key={`${m.year}-${m.month}`} className={m.status === 'overdue' ? 'bg-red-50/40' : (m.status === 'paid' ? 'bg-green-50/40' : '')}>
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.month_label}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.due_date}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{money(m.subscription_fee)}</td>
                    <td className="px-4 py-3 text-sm text-right text-amber-600">{money(m.penalty)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">{money(m.total)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-700">{money(m.paid_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${STATUS_BADGE[m.status] || 'bg-gray-100 text-gray-700'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-semibold text-gray-800">
                  <td className="px-4 py-3 text-sm" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-sm text-right">{money(s.total_subscription)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-700">{money(s.total_penalty)}</td>
                  <td className="px-4 py-3 text-sm text-right">{money(s.total_subscription + s.total_penalty)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700">{money(s.total_paid)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-gray-400">
            Paid months are those with an approved subscription deposit (tagged to that month). Pending months have a deposit awaiting approval.
          </p>
        </>
      )}
    </div>
  );
};

export default MemberDue;
