import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { Combobox } from '@headlessui/react';

const ReceivedVoucher = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('voucher.received.create');

  const [glAccounts, setGlAccounts] = useState([]);
  const [glQuery, setGlQuery] = useState('');
  const [samities, setSamities] = useState([]);
  const [samityQuery, setSamityQuery] = useState('');
  const [form, setForm] = useState({
    tran_date: new Date().toISOString().slice(0, 10),
    amount: '',
    gl_mst_id: '',
    samity_id: '',
    naration: '',
  });

  useEffect(() => {
    fetchGlAccounts();
    fetchSamities();
  }, []);

  const fetchGlAccounts = async () => {
    try {
      const res = await api.get('/gl-accounts', { params: { parent_child: 'C' } });
      const active = (res.data || []).filter(a => 
        a.status === 'A' && 
        ['A', 'L', 'E'].includes(a.glac_type)
      );
      setGlAccounts(active);
    } catch (e) {
      setGlAccounts([]);
    }
  };

  const fetchSamities = async () => {
    try {
      const res = await api.get('/global/samities');
      setSamities(res.data || []);
      const first = (res.data || [])[0];
      if (first && !form.samity_id) {
        setForm(prev => ({ ...prev, samity_id: first.id }));
      }
    } catch (e) {
      setSamities([]);
    }
  };

  const filteredGlAccounts = useMemo(() => {
    const q = glQuery.trim().toLowerCase();
    if (!q) return glAccounts;
    return glAccounts.filter(gl =>
      String(gl.glac_code || '').toLowerCase().includes(q) ||
      String(gl.glac_name || '').toLowerCase().includes(q)
    );
  }, [glAccounts, glQuery]);

  const filteredSamities = useMemo(() => {
    const q = samityQuery.trim().toLowerCase();
    if (!q) return samities;
    return samities.filter(s =>
      String(s.samity_code || '').toLowerCase().includes(q) ||
      String(s.samity_name || '').toLowerCase().includes(q)
    );
  }, [samities, samityQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tran_date: form.tran_date,
        amount: Number(form.amount),
        gl_mst_id: form.gl_mst_id,
        samity_id: form.samity_id,
        naration: form.naration,
      };
      await api.post('/received-voucher', payload);
      Swal.fire({ position: 'top-end', icon: 'success', title: 'Received posted', showConfirmButton: false, timer: 1200, toast: true });
      setForm({ tran_date: new Date().toISOString().slice(0, 10), amount: '', gl_mst_id: '', samity_id: '', naration: '' });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        Swal.fire({ position: 'top-end', icon: 'error', title: firstError, showConfirmButton: false, timer: 2000, toast: true });
      } else {
        Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Operation failed', showConfirmButton: false, timer: 2000, toast: true });
      }
    }
  };

  if (!canCreate) return <div className="py-10 text-center text-red-500">Permission Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Received Voucher</h2>
      </div>

      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={submit}>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Samity</label>
                <Combobox
                  value={samities.find(s => s.id === form.samity_id) || null}
                  onChange={(val) => setForm(prev => ({ ...prev, samity_id: val?.id || '' }))}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      displayValue={(val) => val ? `${val.samity_code} - ${val.samity_name}` : ''}
                      onChange={(e) => setSamityQuery(e.target.value)}
                    />
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                      {filteredSamities.map(s => (
                        <Combobox.Option
                          key={s.id}
                          value={s}
                          className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <span>{s.samity_code} - {s.samity_name}</span>
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="tran_date"
                  value={form.tran_date}
                  onChange={handleChange}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Select GL</label>
                <Combobox
                  value={glAccounts.find(a => a.id === form.gl_mst_id) || null}
                  onChange={(val) => setForm(prev => ({ ...prev, gl_mst_id: val?.id || '' }))}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                      onChange={(e) => setGlQuery(e.target.value)}
                    />
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                      {filteredGlAccounts.map(gl => (
                        <Combobox.Option
                          key={gl.id}
                          value={gl}
                          className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <span>{gl.glac_code} - {gl.glac_name}</span>
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Narration</label>
                <textarea
                  name="naration"
                  value={form.naration}
                  onChange={handleChange}
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-3 bg-gray-50 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">Post Received</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceivedVoucher;
