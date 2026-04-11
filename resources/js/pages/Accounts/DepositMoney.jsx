import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';


const DepositMoney = () => {
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState({
        samity_id: '',
        date: new Date().toISOString().split('T')[0],
        member_id: '',
        savings_account_id: '',
        amount: '',
        status: 'pending',
        description: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSamities();
    }, []);

    useEffect(() => {
        if (formData.samity_id) {
            fetchMembers(formData.samity_id);
        } else {
            setMembers([]);
            setAccounts([]);
            setFormData(prev => ({ ...prev, member_id: '', savings_account_id: '' }));
        }
    }, [formData.samity_id]);

    useEffect(() => {
        if (formData.member_id) {
            fetchAccounts(formData.member_id);
        } else {
            setAccounts([]);
            setFormData(prev => ({ ...prev, savings_account_id: '' }));
        }
    }, [formData.member_id]);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            console.log('Samities API Response:', response);
            if (response.data && Array.isArray(response.data)) {
                setSamities(response.data);
            } else {
                console.error('Unexpected samities data format:', response.data);
                // Fallback if wrapped in data.data
                if (response.data?.data && Array.isArray(response.data.data)) {
                     setSamities(response.data.data);
                }
            }
        } catch (err) {
            console.error('Error fetching samities', err);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const response = await api.get(`/global/members?samity_id=${samityId}`);
            setMembers(response.data);
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchAccounts = async (memberId) => {
        try {
            const response = await api.get(`/global/members/${memberId}/accounts`);
            // response.data is { savings: [...], loans: [...] }
            setAccounts(response.data.savings || []);
        } catch (err) {
            console.error('Error fetching accounts', err);
            setAccounts([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/deposit-requests', formData);
            
            // Show Success Notification
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Deposit request submitted successfully!',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });

            // Reset Form
            setFormData({
                samity_id: '',
                date: new Date().toISOString().split('T')[0],
                member_id: '',
                savings_account_id: '',
                amount: '',
                status: 'pending',
                description: ''
            });
            setMembers([]);
            setAccounts([]);

        } catch (err) {
            console.error('Submission error', err);
            
            // Show Error Notification
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Failed to submit deposit request.',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="samity_id">
                            Samity
                        </label>
                        <select
                            name="samity_id"
                            id="samity_id"
                            value={formData.samity_id}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                        >
                            <option value="">Select Samity</option>
                            {samities.map(samity => (
                                <option key={samity.id} value={samity.id}>{samity.samity_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="date">
                            Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            id="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="member_id">
                            Member
                        </label>
                        <select
                            name="member_id"
                            id="member_id"
                            value={formData.member_id}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                            disabled={!formData.samity_id}
                        >
                            <option value="">Select Member</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.member_name} ({member.member_code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="savings_account_id">
                            Account Number
                        </label>
                        <select
                            name="savings_account_id"
                            id="savings_account_id"
                            value={formData.savings_account_id}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                            disabled={!formData.member_id}
                        >
                            <option value="">Select Account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>{account.account_number} - {account.product?.product_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="amount">
                            Amount
                        </label>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="status">
                            Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="description">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="px-3 py-2 w-full leading-tight text-gray-700 rounded border shadow focus:outline-none focus:shadow-outline"
                        rows="3"
                    ></textarea>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Submit Deposit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DepositMoney;