import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const Leaves = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [typeForm, setTypeForm] = useState({ name: '', max_days_per_year: 0, is_paid: true });
  const [reqForm, setReqForm] = useState({ employee_id: '', leave_type_id: '', date_from: '', date_to: '', reason: '' });

  const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

  const loadTypes = async () => {
    const res = await api.get('/hr/leave-types');
    setLeaveTypes(normalize(res.data));
  };
  const loadRequests = async () => {
    const res = await api.get('/hr/leave-requests');
    setRequests(normalize(res.data));
  };

  useEffect(() => { loadTypes(); loadRequests(); }, []);

  const createType = async (e) => {
    e.preventDefault();
    await api.post('/hr/leave-types', typeForm);
    setTypeForm({ name: '', max_days_per_year: 0, is_paid: true });
    loadTypes();
  };

  const removeType = async (id) => {
    await api.delete(`/hr/leave-types/${id}`);
    loadTypes();
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    await api.post('/hr/leave-requests', reqForm);
    setReqForm({ employee_id: '', leave_type_id: '', date_from: '', date_to: '', reason: '' });
    loadRequests();
  };

  const approve = async (id) => {
    await api.post(`/hr/leave-requests/${id}/approve`);
    loadRequests();
  };
  const reject = async (id) => {
    await api.post(`/hr/leave-requests/${id}/reject`);
    loadRequests();
  };
  const removeReq = async (id) => {
    await api.delete(`/hr/leave-requests/${id}`);
    loadRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Leaves</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitRequest} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Request Leave</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Employee ID</label>
                <input value={reqForm.employee_id} onChange={e=>setReqForm(v=>({...v,employee_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Leave Type</label>
                <select value={reqForm.leave_type_id} onChange={e=>setReqForm(v=>({...v,leave_type_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required>
                  <option value="">Select</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">From</label>
                <input type="date" value={reqForm.date_from} onChange={e=>setReqForm(v=>({...v,date_from:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">To</label>
                <input type="date" value={reqForm.date_to} onChange={e=>setReqForm(v=>({...v,date_to:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Reason</label>
              <input value={reqForm.reason} onChange={e=>setReqForm(v=>({...v,reason:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Submit</button>
          </div>
        </form>

        <form onSubmit={createType} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Add Leave Type</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <input value={typeForm.name} onChange={e=>setTypeForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Max Days/Year</label>
                <input type="number" min="0" value={typeForm.max_days_per_year} onChange={e=>setTypeForm(v=>({...v,max_days_per_year:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" checked={typeForm.is_paid} onChange={e=>setTypeForm(v=>({...v,is_paid:e.target.checked}))} />
                <label className="text-sm text-gray-600">Paid Leave</label>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-2">Leave Types</h4>
            <div className="divide-y">
              {leaveTypes.map(t => (
                <div key={t.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.is_paid ? 'Paid' : 'Unpaid'} • Max {t.max_days_per_year} days</div>
                  </div>
                  <button onClick={()=>removeType(t.id)} type="button" className="text-red-600 hover:underline">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-semibold text-gray-800 mb-4">Leave Requests</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Employee</th>
                <th className="py-2">Type</th>
                <th className="py-2">From</th>
                <th className="py-2">To</th>
                <th className="py-2">Days</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="py-2">{r.employee?.full_name || `ID ${r.employee_id}`}</td>
                  <td className="py-2">{r.type?.name || '-'}</td>
                  <td className="py-2">{r.date_from}</td>
                  <td className="py-2">{r.date_to}</td>
                  <td className="py-2">{r.days}</td>
                  <td className="py-2 capitalize">{r.status}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-3">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={()=>approve(r.id)} className="text-green-600 hover:underline">Approve</button>
                          <button onClick={()=>reject(r.id)} className="text-yellow-700 hover:underline">Reject</button>
                        </>
                      )}
                      <button onClick={()=>removeReq(r.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;

