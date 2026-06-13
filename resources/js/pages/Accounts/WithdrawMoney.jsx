import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

const WithdrawMoney = () => {
    const { user } = useAuth();
    const isUser = user?.roles?.some(role => role.slug === 'user');
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
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [availableToWithdraw, setAvailableToWithdraw] = useState(0);
    const [requiredMinBalance, setRequiredMinBalance] = useState(0);

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
            let samityList = [];
            if (response.data && Array.isArray(response.data)) {
                samityList = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                samityList = response.data.data;
            }
            setSamities(samityList);

            // Auto-select if only one samity
            if (samityList.length === 1) {
                setFormData(prev => ({ ...prev, samity_id: samityList[0].id }));
            }
        } catch (err) {
            console.error('Error fetching samities', err);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const response = await api.get(`/global/members?samity_id=${samityId}`);
            const memberList = response.data || [];
            setMembers(memberList);

            // Auto-select if only one member
            if (memberList.length === 1) {
                setFormData(prev => ({ ...prev, member_id: memberList[0].id }));
            }
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchAccounts = async (memberId) => {
        try {
            const response = await api.get(`/global/members/${memberId}/accounts`);
            // response.data is { savings: [...], loans: [...] }
            const savingsList = response.data.savings || [];
            setAccounts(savingsList);

            // Auto-select if only one account
            if (savingsList.length === 1) {
                const acc = savingsList[0];
                setFormData(prev => ({ ...prev, savings_account_id: acc.id }));
                
                // Also trigger account detail selection logic
                setSelectedAccount(acc);
                const minBal = acc?.product?.min_amount ? parseFloat(acc.product.min_amount) : 0;
                const currBal = acc?.current_balance ? parseFloat(acc.current_balance) : 0;
                const available = Math.max(currBal - minBal, 0);
                setRequiredMinBalance(minBal);
                setAvailableToWithdraw(available);
            }
        } catch (err) {
            console.error('Error fetching accounts', err);
            setAccounts([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...formData, [name]: value };
        setFormData(next);

        if (name === 'savings_account_id') {
            const acc = accounts.find(a => String(a.id) === String(value));
            setSelectedAccount(acc || null);
            const minBal = acc?.product?.min_amount ? parseFloat(acc.product.min_amount) : 0;
            const currBal = acc?.current_balance ? parseFloat(acc.current_balance) : 0;
            const available = Math.max(currBal - minBal, 0);
            setRequiredMinBalance(minBal);
            setAvailableToWithdraw(available);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const amount = parseFloat(formData.amount || 0);
            if (selectedAccount) {
                if (amount > availableToWithdraw) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: `Insufficient balance. Available: ${availableToWithdraw.toFixed(2)} (Min balance ${requiredMinBalance.toFixed(2)})`,
                        showConfirmButton: false,
                        timer: 2000,
                        toast: true
                    });
                    setLoading(false);
                    return;
                }
            }
            await api.post('/withdraw-requests', formData);
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Withdraw request submitted successfully!',
                showConfirmButton: false,
                timer: 1500,
                toast: true
            });
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
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: 'Failed to submit withdraw request.',
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
                            max={availableToWithdraw || undefined}
                        />
                        {selectedAccount && (
                            <p className="mt-1 text-xs text-gray-500">
                                Available: {availableToWithdraw.toFixed(2)} | Min balance required: {requiredMinBalance.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {!isUser && (
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
                    )}
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
                        {loading ? 'Processing...' : 'Submit Withdraw'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WithdrawMoney;
