import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { Combobox } from '@headlessui/react';

const Payroll = () => {
  const [components, setComponents] = useState([]);
  const [compForm, setCompForm] = useState({ name: '', code: '', type: 'earning', amount_type: 'fixed', amount: 0 });
  const [salaries, setSalaries] = useState([]);
  const [salForm, setSalForm] = useState({ employee_id: '', base_salary: 0, effective_from: '' });
  const [runs, setRuns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [runForm, setRunForm] = useState({ period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1 });
  const [selectedRun, setSelectedRun] = useState(null);
  const [summary, setSummary] = useState({ rows: [], overall: { headcount: 0, gross: 0, deduction: 0, net: 0 } });
  const [glAccounts, setGlAccounts] = useState([]);
  const [glQuery, setGlQuery] = useState('');
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isAccrualOpen, setIsAccrualOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    tran_date: '',
    expense_gl_id: '',
    bank_gl_id: '',
    deduction_gl_id: '',
    naration: ''
  });
  const [accrualForm, setAccrualForm] = useState({
    tran_date: '',
    expense_gl_id: '',
    salary_payable_gl_id: '',
    deduction_gl_id: '',
    naration: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    tran_date: '',
    salary_payable_gl_id: '',
    bank_gl_id: '',
    naration: ''
  });

  const normalize = (res) => (Array.isArray(res) ? res : res?.data ?? []);

  const loadComponents = async () => {
    const res = await api.get('/hr/salary-components');
    setComponents(normalize(res.data));
  };
  const loadSalaries = async () => {
    const res = await api.get('/hr/employee-salaries');
    setSalaries(normalize(res.data));
  };
  const loadRuns = async () => {
    const res = await api.get('/hr/payroll-runs');
    setRuns(normalize(res.data));
  };
  const loadPayslips = async (runId) => {
    const res = await api.get('/hr/payslips', { params: { run_id: runId } });
    setPayslips(normalize(res.data));
  };
  const loadSummary = async (runId) => {
    const res = await api.get('/hr/payroll-summary', { params: { run_id: runId } });
    setSummary(res.data || { rows: [], overall: { headcount: 0, gross: 0, deduction: 0, net: 0 } });
  };

  useEffect(() => {
    loadComponents();
    loadSalaries();
    loadRuns();
    fetchGlAccounts();
  }, []);

  const fetchGlAccounts = async () => {
    try {
      const res = await api.get('/gl-accounts', { params: { parent_child: 'C' } });
      const active = (res.data || []).filter(a => a.status === 'A');
      setGlAccounts(active);
    } catch (e) {
      setGlAccounts([]);
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

  const openPostModal = () => {
    if (!selectedRun) return;
    const run = runs.find(r => r.id === selectedRun);
    const year = run?.period_year || new Date().getFullYear();
    const month = run?.period_month || (new Date().getMonth() + 1);
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    setPostForm(prev => ({
      ...prev,
      tran_date: `${yyyy}-${mm}-${dd}`,
      naration: `Payroll ${year}-${String(month).padStart(2,'0')}`
    }));
    setIsPostOpen(true);
  };

  const postToGl = async (e) => {
    e?.preventDefault?.();
    if (!selectedRun) return;
    const payload = {
      tran_date: postForm.tran_date,
      expense_gl_id: postForm.expense_gl_id,
      bank_gl_id: postForm.bank_gl_id,
      deduction_gl_id: postForm.deduction_gl_id || null,
      naration: postForm.naration
    };
    const res = await api.post(`/hr/payroll-runs/${selectedRun}/post-gl`, payload);
    if (res.status === 201) {
      setIsPostOpen(false);
      alert('GL posted successfully');
    }
  };

  const openAccrualModal = () => {
    if (!selectedRun) return;
    const run = runs.find(r => r.id === selectedRun);
    const year = run?.period_year || new Date().getFullYear();
    const month = run?.period_month || (new Date().getMonth() + 1);
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    setAccrualForm(prev => ({
      ...prev,
      tran_date: `${yyyy}-${mm}-${dd}`,
      naration: `Payroll Accrual ${year}-${String(month).padStart(2,'0')}`
    }));
    setIsAccrualOpen(true);
  };

  const openPaymentModal = () => {
    if (!selectedRun) return;
    const run = runs.find(r => r.id === selectedRun);
    const year = run?.period_year || new Date().getFullYear();
    const month = run?.period_month || (new Date().getMonth() + 1);
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    setPaymentForm(prev => ({
      ...prev,
      tran_date: `${yyyy}-${mm}-${dd}`,
      naration: `Payroll Payment ${year}-${String(month).padStart(2,'0')}`
    }));
    setIsPaymentOpen(true);
  };

  const accrueToGl = async (e) => {
    e?.preventDefault?.();
    if (!selectedRun) return;
    const payload = {
      tran_date: accrualForm.tran_date,
      expense_gl_id: accrualForm.expense_gl_id,
      salary_payable_gl_id: accrualForm.salary_payable_gl_id,
      deduction_gl_id: accrualForm.deduction_gl_id || null,
      naration: accrualForm.naration
    };
    const res = await api.post(`/hr/payroll-runs/${selectedRun}/accrue-gl`, payload);
    if (res.status === 201) {
      setIsAccrualOpen(false);
      alert('Accrual posted successfully');
    }
  };

  const payFromGl = async (e) => {
    e?.preventDefault?.();
    if (!selectedRun) return;
    const payload = {
      tran_date: paymentForm.tran_date,
      salary_payable_gl_id: paymentForm.salary_payable_gl_id,
      bank_gl_id: paymentForm.bank_gl_id,
      naration: paymentForm.naration
    };
    const res = await api.post(`/hr/payroll-runs/${selectedRun}/pay-gl`, payload);
    if (res.status === 201) {
      setIsPaymentOpen(false);
      alert('Payment posted successfully');
    }
  };

  const createComponent = async (e) => {
    e.preventDefault();
    await api.post('/hr/salary-components', compForm);
    setCompForm({ name: '', code: '', type: 'earning', amount_type: 'fixed', amount: 0 });
    loadComponents();
  };
  const deleteComponent = async (id) => {
    await api.delete(`/hr/salary-components/${id}`);
    loadComponents();
  };

  const createSalary = async (e) => {
    e.preventDefault();
    await api.post('/hr/employee-salaries', salForm);
    setSalForm({ employee_id: '', base_salary: 0, effective_from: '' });
    loadSalaries();
  };
  const deleteSalary = async (id) => {
    await api.delete(`/hr/employee-salaries/${id}`);
    loadSalaries();
  };

  const runPayroll = async (e) => {
    e.preventDefault();
    const res = await api.post('/hr/payroll-runs/run', runForm);
    setSelectedRun(res.data?.data?.id || null);
    loadRuns();
    if (res.data?.data?.id) loadPayslips(res.data.data.id);
  };

  const selectRun = (id) => {
    setSelectedRun(id);
    loadPayslips(id);
    loadSummary(id);
  };

  const printPayslip = (p) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const comps = Array.isArray(p.components) ? p.components : [];
    const rows = comps.map(c => `<tr><td style="padding:6px;border:1px solid #e5e7eb">${c.name}</td><td style="padding:6px;border:1px solid #e5e7eb;text-transform:capitalize">${c.type}</td><td style="padding:6px;border:1px solid #e5e7eb;text-align:right">${Number(c.amount).toFixed(2)}</td></tr>`).join('');
    win.document.write(`
      <html>
        <head>
          <title>Payslip</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 16px; color: #111827; }
            h2 { margin: 0 0 8px; }
            .muted { color: #6b7280; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h2>Payslip</h2>
          <div class="muted">${p.employee?.full_name || ('Employee ' + p.employee_id)}</div>
          <div class="muted">Gross: ${Number(p.gross).toFixed(2)} | Deduction: ${Number(p.total_deduction).toFixed(2)} | Net: ${Number(p.net).toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;border:1px solid #e5e7eb">Component</th>
                <th style="text-align:left;padding:6px;border:1px solid #e5e7eb">Type</th>
                <th style="text-align:right;padding:6px;border:1px solid #e5e7eb">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Payroll</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={createComponent} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Salary Components</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <input value={compForm.name} onChange={e=>setCompForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Code</label>
              <input value={compForm.code} onChange={e=>setCompForm(v=>({...v,code:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <select value={compForm.type} onChange={e=>setCompForm(v=>({...v,type:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="basic">Basic</option>
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Amount Type</label>
                <select value={compForm.amount_type} onChange={e=>setCompForm(v=>({...v,amount_type:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="fixed">Fixed</option>
                  <option value="percent">Percent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Amount</label>
              <input type="number" step="0.01" value={compForm.amount} onChange={e=>setCompForm(v=>({...v,amount:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
          <div className="mt-4 divide-y">
            {components.map(c => (
              <div key={c.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.code})</span></div>
                  <div className="text-xs text-gray-500">{c.type} • {c.amount_type} {c.amount}</div>
                </div>
                <button type="button" onClick={()=>deleteComponent(c.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </form>

        <form onSubmit={createSalary} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Employee Salary</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Employee ID</label>
              <input value={salForm.employee_id} onChange={e=>setSalForm(v=>({...v,employee_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Base Salary</label>
              <input type="number" step="0.01" value={salForm.base_salary} onChange={e=>setSalForm(v=>({...v,base_salary:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Effective From</label>
              <input type="date" value={salForm.effective_from} onChange={e=>setSalForm(v=>({...v,effective_from:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
          <div className="mt-4 divide-y">
            {salaries.map(s => (
              <div key={s.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">Employee {s.employee_id}</div>
                  <div className="text-xs text-gray-500">Base {Number(s.base_salary).toFixed(2)} {s.effective_from ? `• From ${s.effective_from}` : ''}</div>
                </div>
                <button type="button" onClick={()=>deleteSalary(s.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </form>

        <form onSubmit={runPayroll} className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-4">Run Payroll</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Year</label>
                <input type="number" value={runForm.period_year} onChange={e=>setRunForm(v=>({...v,period_year:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Month</label>
                <input type="number" min="1" max="12" value={runForm.period_month} onChange={e=>setRunForm(v=>({...v,period_month:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg">Process</button>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">Runs</h4>
            <div className="divide-y">
              {runs.map(r => (
                <div key={r.id} className="py-2 flex items-center justify-between">
                  <div className="text-sm">{r.period_year}-{String(r.period_month).padStart(2,'0')} • {r.status}</div>
                  <button type="button" onClick={()=>selectRun(r.id)} className="text-blue-600 hover:underline">View</button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Payslips</h3>
          {selectedRun && (
            <div className="flex items-center gap-2">
              <a
                href={`/api/hr/payroll-bank.csv?run_id=${selectedRun}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white"
              >
                Bank CSV
              </a>
              <button
                onClick={openPostModal}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
              >
                Post to GL
              </button>
              <button
                onClick={openAccrualModal}
                className="px-3 py-2 rounded-lg bg-orange-600 text-white"
              >
                Accrue
              </button>
              <button
                onClick={openPaymentModal}
                className="px-3 py-2 rounded-lg bg-purple-600 text-white"
              >
                Pay
              </button>
            </div>
          )}
        </div>
        {selectedRun ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Employee</th>
                  <th className="py-2">Gross</th>
                  <th className="py-2">Deduction</th>
                  <th className="py-2">Net</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payslips.map(p => (
                  <tr key={p.id}>
                    <td className="py-2">{p.employee?.full_name || `ID ${p.employee_id}`}</td>
                    <td className="py-2">{Number(p.gross).toFixed(2)}</td>
                    <td className="py-2">{Number(p.total_deduction).toFixed(2)}</td>
                    <td className="py-2 font-semibold">{Number(p.net).toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <button onClick={()=>printPayslip(p)} className="text-blue-600 hover:underline">Print</button>
                      <a
                        href={`/api/hr/payslips/${p.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-3 text-indigo-600 hover:underline"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">Select a run to view payslips.</div>
        )}
      </div>

      {isPostOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Post Payroll to GL</h4>
              <button onClick={()=>setIsPostOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={postToGl}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={postForm.tran_date}
                    onChange={(e)=>setPostForm(prev=>({...prev, tran_date: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Narration</label>
                  <input
                    type="text"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={postForm.naration}
                    onChange={(e)=>setPostForm(prev=>({...prev, naration: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Expense GL (Debit)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === postForm.expense_gl_id) || null}
                    onChange={(val) => setPostForm(prev => ({ ...prev, expense_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Bank/Cash GL (Credit Net)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === postForm.bank_gl_id) || null}
                    onChange={(val) => setPostForm(prev => ({ ...prev, bank_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Deduction Liability GL (Credit Deduction)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === postForm.deduction_gl_id) || null}
                    onChange={(val) => setPostForm(prev => ({ ...prev, deduction_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                  <p className="text-xs text-gray-500 mt-1">Optional if total deduction is 0</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button type="button" onClick={()=>setIsPostOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAccrualOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Accrue Payroll (Expense → Payables)</h4>
              <button onClick={()=>setIsAccrualOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={accrueToGl}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={accrualForm.tran_date}
                    onChange={(e)=>setAccrualForm(prev=>({...prev, tran_date: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Narration</label>
                  <input
                    type="text"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={accrualForm.naration}
                    onChange={(e)=>setAccrualForm(prev=>({...prev, naration: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Expense GL (Debit)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === accrualForm.expense_gl_id) || null}
                    onChange={(val) => setAccrualForm(prev => ({ ...prev, expense_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Salary Payable GL (Credit Net)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === accrualForm.salary_payable_gl_id) || null}
                    onChange={(val) => setAccrualForm(prev => ({ ...prev, salary_payable_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Deduction Liability GL (Credit Deductions)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === accrualForm.deduction_gl_id) || null}
                    onChange={(val) => setAccrualForm(prev => ({ ...prev, deduction_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                  <p className="text-xs text-gray-500 mt-1">Required if deductions exist</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button type="button" onClick={()=>setIsAccrualOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-orange-600 text-white">Accrue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Pay Payroll (Payable → Bank)</h4>
              <button onClick={()=>setIsPaymentOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={payFromGl}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={paymentForm.tran_date}
                    onChange={(e)=>setPaymentForm(prev=>({...prev, tran_date: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Narration</label>
                  <input
                    type="text"
                    className="px-3 py-2 w-full rounded-md border border-gray-300"
                    value={paymentForm.naration}
                    onChange={(e)=>setPaymentForm(prev=>({...prev, naration: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Salary Payable GL (Debit)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === paymentForm.salary_payable_gl_id) || null}
                    onChange={(val) => setPaymentForm(prev => ({ ...prev, salary_payable_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Bank/Cash GL (Credit Net)</label>
                  <Combobox
                    value={glAccounts.find(a => a.id === paymentForm.bank_gl_id) || null}
                    onChange={(val) => setPaymentForm(prev => ({ ...prev, bank_gl_id: val?.id || '' }))}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="px-3 py-2 w-full rounded-md border border-gray-300"
                        displayValue={(val) => val ? `${val.glac_code} - ${val.glac_name}` : ''}
                        onChange={(e) => setGlQuery(e.target.value)}
                        required
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5">
                        {filteredGlAccounts.map(gl => (
                          <Combobox.Option key={gl.id} value={gl} className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-gray-100">
                            <span>{gl.glac_code} - {gl.glac_name}</span>
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button type="button" onClick={()=>setIsPaymentOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-purple-600 text-white">Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Summary</h3>
          {selectedRun && (
            <a
              href={`/api/hr/payroll-summary.csv?run_id=${selectedRun}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
            >
              Export CSV
            </a>
          )}
        </div>
        {selectedRun ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2">Department</th>
                  <th className="py-2">Headcount</th>
                  <th className="py-2">Gross</th>
                  <th className="py-2">Deduction</th>
                  <th className="py-2">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.rows.map(r => (
                  <tr key={r.department}>
                    <td className="py-2">{r.department}</td>
                    <td className="py-2">{r.headcount}</td>
                    <td className="py-2">{Number(r.gross).toFixed(2)}</td>
                    <td className="py-2">{Number(r.deduction).toFixed(2)}</td>
                    <td className="py-2 font-semibold">{Number(r.net).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-2">TOTAL</td>
                  <td className="py-2">{summary.overall.headcount}</td>
                  <td className="py-2">{Number(summary.overall.gross).toFixed(2)}</td>
                  <td className="py-2">{Number(summary.overall.deduction).toFixed(2)}</td>
                  <td className="py-2">{Number(summary.overall.net).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">Select a run to view summary.</div>
        )}
      </div>
    </div>
  );
};

export default Payroll;
