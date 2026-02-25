import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const Employees = () => {
    const [items, setItems] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ code: '', full_name: '', department_id: '', designation_id: '' });
    const [docOpen, setDocOpen] = useState(false);
    const [docEmp, setDocEmp] = useState(null);
    const [docForm, setDocForm] = useState({ type: '', file: null });

    const normalize = (res) => Array.isArray(res) ? res : (res?.data ?? []);

    const load = async () => {
        const res = await api.get('/hr/employees');
        setItems(normalize(res.data));
    };
    const loadDeps = async () => {
        const res = await api.get('/hr/departments');
        setDepartments(normalize(res.data));
    };
    const loadDesigs = async () => {
        const res = await api.get('/hr/designations');
        setDesignations(normalize(res.data));
    };

    useEffect(() => {
        load();
        loadDeps();
        loadDesigs();
    }, []);

    const create = async (e) => {
        e.preventDefault();
        await api.post('/hr/employees', {
            code: form.code,
            full_name: form.full_name,
            department_id: form.department_id || null,
            designation_id: form.designation_id || null
        });
        setForm({ code: '', full_name: '', department_id: '', designation_id: '' });
        setOpen(false);
        load();
    };

    const remove = async (id) => {
        await api.delete(`/hr/employees/${id}`);
        load();
    };

    const openDocModal = (emp) => {
        setDocEmp(emp);
        setDocForm({ type: '', file: null });
        setDocOpen(true);
    };

    const uploadDoc = async (e) => {
        e.preventDefault();
        if (!docEmp) return;
        const fd = new FormData();
        fd.append('type', docForm.type);
        if (docForm.file) fd.append('file', docForm.file);
        await api.post(`/hr/employees/${docEmp.id}/documents`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDocOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
                <div className="flex gap-2">
                    <button onClick={()=>setOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Employee</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="py-2">Code</th>
                                <th className="py-2">Name</th>
                                <th className="py-2">Department</th>
                                <th className="py-2">Designation</th>
                                <th className="py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map(emp => (
                                <tr key={emp.id}>
                                    <td className="py-2">{emp.code}</td>
                                    <td className="py-2">{emp.full_name}</td>
                                    <td className="py-2">{emp.department?.name || '-'}</td>
                                    <td className="py-2">{emp.designation?.name || '-'}</td>
                                    <td className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={()=>openDocModal(emp)} className="text-blue-600 hover:underline">Upload Doc</button>
                                            <button onClick={()=>remove(emp.id)} className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add Employee</h3>
                            <button onClick={()=>setOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={create} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Code</label>
                                    <input value={form.code} onChange={e=>setForm(v=>({...v,code:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Full Name</label>
                                    <input value={form.full_name} onChange={e=>setForm(v=>({...v,full_name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Department</label>
                                    <select value={form.department_id} onChange={e=>setForm(v=>({...v,department_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2">
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Designation</label>
                                    <select value={form.designation_id} onChange={e=>setForm(v=>({...v,designation_id:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2">
                                        <option value="">Select</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {docOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Upload Document {docEmp ? `- ${docEmp.full_name}` : ''}</h3>
                            <button onClick={()=>setDocOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={uploadDoc} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Type</label>
                                <input value={docForm.type} onChange={e=>setDocForm(v=>({...v,type:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">File</label>
                                <input type="file" onChange={e=>setDocForm(v=>({...v,file:e.target.files?.[0] || null}))} className="mt-1 w-full" required />
                                <div className="text-xs text-gray-500 mt-1">Allowed: pdf, jpg, jpeg, png; Max 5MB</div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={()=>setDocOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
