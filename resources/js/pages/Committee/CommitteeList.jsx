import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, Save, X, Loader, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommitteeList = () => {
    const [view, setView] = useState('list'); // list, create, edit
    const [committees, setCommittees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState([]);
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [processing, setProcessing] = useState(false);
    
    // Form Data
    const initialFormState = {
        samity_id: '',
        committee_type_id: '',
        name: '',
        name_bn: '',
        meeting_date: '',
        election_date: '',
        effective_date: new Date().toISOString().split('T')[0],
        member_count: '',
        members: []
    };
    const [formData, setFormData] = useState(initialFormState);
    const [selectedCommittee, setSelectedCommittee] = useState(null);

    useEffect(() => {
        fetchCommittees();
        fetchTypes();
        fetchSamities();
    }, []);

    const fetchCommittees = async () => {
        setLoading(true);
        try {
            const response = await api.get('/committees');
            const data = response.data?.data || response.data;
            setCommittees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setCommittees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTypes = async () => {
        try {
            const response = await api.get('/committee-types-active');
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setTypes(Array.isArray(data) ? data : []);
        } catch (err) { 
            console.error(err);
            setTypes([]);
        }
    };

    const fetchSamities = async () => {
        try {
            const response = await api.get('/samity-profiles');
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setSamities(Array.isArray(data) ? data : []);
        } catch (err) { 
            console.error(err); 
            setSamities([]);
        }
    };

    const fetchMembers = async (samityId) => {
        if (!samityId) {
            setMembers([]);
            return;
        }
        try {
            const response = await api.get(`/committees-available-members?samity_id=${samityId}`);
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) { 
            console.error(err);
            setMembers([]);
        }
    };

    const handleSamityChange = (e) => {
        const samityId = e.target.value;
        setFormData(prev => ({ ...prev, samity_id: samityId }));
        fetchMembers(samityId);
    };

    const handleMemberCountChange = (e) => {
        const value = e.target.value;
        if (!value) {
            setFormData(prev => ({ ...prev, member_count: '', members: [] }));
            return;
        }
        const count = parseInt(value);
        if (isNaN(count)) return;

        setFormData(prev => {
            const newMembers = Array(count).fill().map((_, i) => ({
                member_info_id: '',
                designation: '',
                position: i + 1
            }));
            return { ...prev, member_count: count, members: newMembers };
        });
    };

    const handleMemberSelect = (index, field, value) => {
        const newMembers = [...formData.members];
        if (newMembers[index]) {
            newMembers[index][field] = value;
            setFormData(prev => ({ ...prev, members: newMembers }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (selectedCommittee) {
                await api.put(`/committees/${selectedCommittee.id}`, formData);
                Swal.fire('Success', 'Committee updated successfully', 'success');
            } else {
                await api.post('/committees', formData);
                Swal.fire('Success', 'Committee created successfully', 'success');
            }
            fetchCommittees();
            setView('list');
            setFormData(initialFormState);
            setSelectedCommittee(null);
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Committees</h1>
                {view === 'list' && (
                    <button
                        onClick={() => {
                            setFormData(initialFormState);
                            setSelectedCommittee(null);
                            setView('create');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> New Committee
                    </button>
                )}
                {view !== 'list' && (
                    <button
                        onClick={() => setView('list')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                    >
                        <X size={20} /> Cancel
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Samity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : (!Array.isArray(committees) || committees.length === 0) ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No committees found</td></tr>
                            ) : (
                                committees.map((committee) => (
                                    <tr key={committee.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{committee.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{committee.committee_type?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{committee.samity?.samity_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{committee.member_count}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${committee.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                  committee.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {committee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {committee.status === 'draft' && (
                                                <button onClick={() => {
                                                    setSelectedCommittee(committee);
                                                    setFormData({
                                                        ...committee,
                                                        // map other fields if needed
                                                    });
                                                    setView('edit');
                                                }} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <Edit size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Committee Type</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.committee_type_id}
                                    onChange={(e) => setFormData({ ...formData, committee_type_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {Array.isArray(types) && types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Samity</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.samity_id}
                                    onChange={handleSamityChange}
                                    required
                                >
                                    <option value="">Select Samity</option>
                                    {Array.isArray(samities) && samities.map(s => <option key={s.id} value={s.id}>{s.samity_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Committee Name</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.effective_date}
                                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Member Count</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.member_count}
                                    onChange={handleMemberCountChange}
                                    required
                                >
                                    <option value="">Select Count</option>
                                    <option value="3">3 Members</option>
                                    <option value="6">6 Members</option>
                                    <option value="9">9 Members</option>
                                    <option value="12">12 Members</option>
                                </select>
                            </div>
                        </div>

                        {formData.members.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Committee Members</h3>
                                {formData.members.map((member, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Position {index + 1}</label>
                                            <select
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                value={member.member_info_id}
                                                onChange={(e) => handleMemberSelect(index, 'member_info_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Member</option>
                                                {Array.isArray(members) && members.map(m => (
                                                    <option key={m.id} value={m.id}>{m.member_name} ({m.member_code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Designation</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                                value={member.designation}
                                                onChange={(e) => handleMemberSelect(index, 'designation', e.target.value)}
                                                required
                                                placeholder="e.g. Chairman"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                {processing ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                {selectedCommittee ? 'Update Committee' : 'Create Committee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommitteeList;
