import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const HRSettings = () => {
    const [activeTab, setActiveTab] = useState('departments');
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [holidays, setHolidays] = useState([]);

    const [depForm, setDepForm] = useState({ name: '', code: '' });
    const [desigForm, setDesigForm] = useState({ name: '', grade: '' });
    const [shiftForm, setShiftForm] = useState({ name: '', start_time: '', end_time: '', grace_minutes: 0 });
    const [holidayForm, setHolidayForm] = useState({ date: '', title: '' });

    const normalize = (res) => Array.isArray(res) ? res : (res?.data ?? []);

    const loadDepartments = async () => {
        const res = await api.get('/hr/departments');
        setDepartments(normalize(res.data));
    };
    const loadDesignations = async () => {
        const res = await api.get('/hr/designations');
        setDesignations(normalize(res.data));
    };
    const loadShifts = async () => {
        const res = await api.get('/hr/shifts');
        setShifts(normalize(res.data));
    };
    const loadHolidays = async () => {
        const res = await api.get('/hr/holidays');
        setHolidays(normalize(res.data));
    };

    useEffect(() => {
        loadDepartments();
        loadDesignations();
        loadShifts();
        loadHolidays();
    }, []);

    const createDepartment = async (e) => {
        e.preventDefault();
        await api.post('/hr/departments', depForm);
        setDepForm({ name: '', code: '' });
        loadDepartments();
    };

    const createDesignation = async (e) => {
        e.preventDefault();
        await api.post('/hr/designations', desigForm);
        setDesigForm({ name: '', grade: '' });
        loadDesignations();
    };

    const createShift = async (e) => {
        e.preventDefault();
        await api.post('/hr/shifts', shiftForm);
        setShiftForm({ name: '', start_time: '', end_time: '', grace_minutes: 0 });
        loadShifts();
    };

    const createHoliday = async (e) => {
        e.preventDefault();
        await api.post('/hr/holidays', holidayForm);
        setHolidayForm({ date: '', title: '' });
        loadHolidays();
    };

    const remove = async (type, id) => {
        await api.delete(`/hr/${type}/${id}`);
        if (type === 'departments') loadDepartments();
        if (type === 'designations') loadDesignations();
        if (type === 'shifts') loadShifts();
        if (type === 'holidays') loadHolidays();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">HR Settings</h2>

            <div className="flex gap-2">
                {['departments','designations','shifts','holidays'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-2 rounded-lg border ${activeTab===t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                    >
                        {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'departments' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={createDepartment} className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Add Department</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Name</label>
                                <input value={depForm.name} onChange={e=>setDepForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Code</label>
                                <input value={depForm.code} onChange={e=>setDepForm(v=>({...v,code:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                        </div>
                    </form>
                    <div className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Departments</h3>
                        <div className="divide-y">
                            {departments.map(item => (
                                <div key={item.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">Code: {item.code}</div>
                                    </div>
                                    <button onClick={()=>remove('departments', item.id)} className="text-red-600 hover:underline">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'designations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={createDesignation} className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Add Designation</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Name</label>
                                <input value={desigForm.name} onChange={e=>setDesigForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Grade</label>
                                <input value={desigForm.grade} onChange={e=>setDesigForm(v=>({...v,grade:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                        </div>
                    </form>
                    <div className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Designations</h3>
                        <div className="divide-y">
                            {designations.map(item => (
                                <div key={item.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">{item.grade ? `Grade: ${item.grade}` : ''}</div>
                                    </div>
                                    <button onClick={()=>remove('designations', item.id)} className="text-red-600 hover:underline">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={createShift} className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Add Shift</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Name</label>
                                <input value={shiftForm.name} onChange={e=>setShiftForm(v=>({...v,name:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Start Time</label>
                                    <input type="time" value={shiftForm.start_time} onChange={e=>setShiftForm(v=>({...v,start_time:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">End Time</label>
                                    <input type="time" value={shiftForm.end_time} onChange={e=>setShiftForm(v=>({...v,end_time:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Grace Minutes</label>
                                <input type="number" min="0" value={shiftForm.grace_minutes} onChange={e=>setShiftForm(v=>({...v,grace_minutes:Number(e.target.value)}))} className="mt-1 w-full border rounded-lg px-3 py-2" />
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                        </div>
                    </form>
                    <div className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Shifts</h3>
                        <div className="divide-y">
                            {shifts.map(item => (
                                <div key={item.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">{item.start_time} - {item.end_time}</div>
                                    </div>
                                    <button onClick={()=>remove('shifts', item.id)} className="text-red-600 hover:underline">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'holidays' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={createHoliday} className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Add Holiday</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Date</label>
                                <input type="date" value={holidayForm.date} onChange={e=>setHolidayForm(v=>({...v,date:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Title</label>
                                <input value={holidayForm.title} onChange={e=>setHolidayForm(v=>({...v,title:e.target.value}))} className="mt-1 w-full border rounded-lg px-3 py-2" required />
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                        </div>
                    </form>
                    <div className="bg-white p-6 rounded-xl border">
                        <h3 className="font-semibold text-gray-800 mb-4">Holidays</h3>
                        <div className="divide-y">
                            {holidays.map(item => (
                                <div key={item.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{item.title}</div>
                                        <div className="text-sm text-gray-500">{item.date}</div>
                                    </div>
                                    <button onClick={()=>remove('holidays', item.id)} className="text-red-600 hover:underline">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRSettings;
