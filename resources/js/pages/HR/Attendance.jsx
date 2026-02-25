import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const Attendance = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    check_in: '',
    check_out: '',
    remarks: '',
  });
  const [filters, setFilters] = useState({ employee_id: '', from: '', to: '' });

  const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

  const load = async () => {
    const res = await api.get('/hr/attendances', { params: filters });
    setItems(normalize(res.data));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/hr/attendances', form);
    setForm(f => ({ ...f, employee_id: '', check_in: '', check_out: '', remarks: '' }));
    load();
  };

  const remove = async (id) => {
    await api.delete(`/hr/attendances/${id}`);
    load();
  };

  const applyFilter = async (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Mark Attendance</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Employee ID</label>
              <input value={form.employee_id} onChange={e=>setForm(v=>({...v,employee_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input type="date" value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="half">Half Day</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Check In</label>
                <input type="time" value={form.check_in} onChange={e=>setForm(v=>({...v,check_in:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Check Out</label>
                <input type="time" value={form.check_out} onChange={e=>setForm(v=>({...v,check_out:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Remarks</label>
              <input value={form.remarks} onChange={e=>setForm(v=>({...v,remarks:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </form>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Filter</h3>
          <form onSubmit={applyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Employee ID" value={filters.employee_id} onChange={e=>setFilters(v=>({...v,employee_id:e.target.value}))} className="border rounded-lg px-3 py-2" />
            <input type="date" value={filters.from} onChange={e=>setFilters(v=>({...v,from:e.target.value}))} className="border rounded-lg px-3 py-2" />
            <input type="date" value={filters.to} onChange={e=>setFilters(v=>({...v,to:e.target.value}))} className="border rounded-lg px-3 py-2" />
            <button className="px-3 py-2 border rounded-lg">Apply</button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Date</th>
                <th className="py-2">Employee</th>
                <th className="py-2">Status</th>
                <th className="py-2">Check In</th>
                <th className="py-2">Check Out</th>
                <th className="py-2">Remarks</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(row => (
                <tr key={row.id}>
                  <td className="py-2">{row.date}</td>
                  <td className="py-2">{row.employee?.full_name || `ID ${row.employee_id}`}</td>
                  <td className="py-2 capitalize">{row.status}</td>
                  <td className="py-2">{row.check_in || '-'}</td>
                  <td className="py-2">{row.check_out || '-'}</td>
                  <td className="py-2">{row.remarks || '-'}</td>
                  <td className="py-2 text-right">
                    <button onClick={()=>remove(row.id)} className="text-red-600 hover:underline">Delete</button>
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

export default Attendance;

