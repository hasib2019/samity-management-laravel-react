import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Save, Search, History, DollarSign } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/sweetAlert';

const MonthlyFeeCollection = () => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('');
    const [dues, setDues] = useState([]);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const handleMemberChange = async (e) => {
        const memberId = e.target.value;
        setSelectedMember(memberId);
        setDues([]);
        setHistory([]);
        setSummary(null);
        setSelectedMonths([]);

        if (memberId) {
            setLoading(true);
            try {
                const [duesRes, historyRes] = await Promise.all([
                    api.get(`/monthly-fees/dues/${memberId}`),
                    api.get(`/monthly-fees/history/${memberId}`)
                ]);
                setDues(duesRes.data.dues);
                setSummary(duesRes.data.summary);
                setHistory(historyRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
                showErrorToast('Failed to fetch member dues info');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCheckboxChange = (monthData) => {
        const key = `${monthData.month}-${monthData.year}`;
        const isSelected = selectedMonths.some(m => `${m.month}-${m.year}` === key);

        if (isSelected) {
            setSelectedMonths(selectedMonths.filter(m => `${m.month}-${m.year}` !== key));
        } else {
            setSelectedMonths([...selectedMonths, {
                month: monthData.month,
                year: monthData.year,
                amount: monthData.amount_due,
                penalty: monthData.penalty_due
            }]);
        }
    };

    const handleSelectAll = () => {
        if (selectedMonths.length === dues.length) {
            setSelectedMonths([]);
        } else {
            setSelectedMonths(dues.map(d => ({
                month: d.month,
                year: d.year,
                amount: d.amount_due,
                penalty: d.penalty_due
            })));
        }
    };

    const calculateSelectedTotal = () => {
        return selectedMonths.reduce((sum, item) => sum + item.amount + item.penalty, 0);
    };

    const handlePayment = async () => {
        if (selectedMonths.length === 0) {
            showErrorToast('Please select at least one month to pay');
            return;
        }

        if (!confirm(`Are you sure you want to collect ${calculateSelectedTotal()} BDT?`)) {
            return;
        }

        try {
            await api.post('/monthly-fees/collect', {
                member_id: selectedMember,
                payments: selectedMonths
            });
            showSuccessToast('Payment collected successfully');
            // Refresh data
            handleMemberChange({ target: { value: selectedMember } });
        } catch (error) {
            console.error('Payment failed', error);
            showErrorToast('Payment failed');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <DollarSign /> Monthly Fee Collection
            </h1>

            {/* Member Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                <select
                    value={selectedMember}
                    onChange={handleMemberChange}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- Select Member --</option>
                    {members.map(member => (
                        <option key={member.id} value={member.id}>
                            {member.member_name} ({member.member_code})
                        </option>
                    ))}
                </select>
            </div>

            {selectedMember && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dues Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                            <h2 className="font-semibold text-red-800">Unpaid Months (Dues)</h2>
                            <div className="text-sm text-red-600 font-bold">
                                Total Due: {summary?.total_payable || 0} BDT
                            </div>
                        </div>
                        
                        <div className="max-h-[500px] overflow-y-auto p-4">
                            {dues.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No dues found! All clear.</p>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedMonths.length === dues.length && dues.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th className="px-3 py-2">Month</th>
                                            <th className="px-3 py-2">Fee</th>
                                            <th className="px-3 py-2">Penalty</th>
                                            <th className="px-3 py-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dues.map((due, index) => (
                                            <tr key={index} className={due.is_late ? 'bg-red-50' : ''}>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMonths.some(m => m.month === due.month && m.year === due.year)}
                                                        onChange={() => handleCheckboxChange(due)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">{due.month_name}</td>
                                                <td className="px-3 py-2">{due.amount_due}</td>
                                                <td className="px-3 py-2 text-red-600">
                                                    {due.penalty_due > 0 ? `+${due.penalty_due}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 font-medium">{due.total_due}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        
                        {dues.length > 0 && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-medium">Selected Total:</span>
                                    <span className="text-xl font-bold text-blue-600">{calculateSelectedTotal()} BDT</span>
                                </div>
                                <button
                                    onClick={handlePayment}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    <Save size={18} /> Collect Payment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-green-50">
                            <h2 className="font-semibold text-green-800 flex items-center gap-2">
                                <History size={18} /> Payment History
                            </h2>
                        </div>
                        
                        <div className="max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Month</th>
                                        <th className="px-4 py-3">Paid Amount</th>
                                        <th className="px-4 py-3">Paid Date</th>
                                        <th className="px-4 py-3">Collected By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                No payment history found
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{item.month_name}</td>
                                                <td className="px-4 py-3 text-green-600 font-medium">
                                                    {item.total_paid} BDT
                                                    {item.penalty_collected > 0 && (
                                                        <span className="text-xs text-red-500 block">
                                                            (incl. {item.penalty_collected} penalty)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{item.collection_date}</td>
                                                <td className="px-4 py-3 text-gray-500">{item.collected_by}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthlyFeeCollection;