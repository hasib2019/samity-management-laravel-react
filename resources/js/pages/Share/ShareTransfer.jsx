import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Move, User, Calendar, DollarSign, Search, FileText, PieChart, ArrowRight } from 'lucide-react';

const ShareTransfer = () => {
    const [searchTermFrom, setSearchTermFrom] = useState('');
    const [searchTermTo, setSearchTermTo] = useState('');
    const [fromAccount, setFromAccount] = useState(null);
    const [toAccount, setToAccount] = useState(null);
    const [loadingFrom, setLoadingFrom] = useState(false);
    const [loadingTo, setLoadingTo] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        tran_date: new Date().toISOString().split('T')[0],
        quantity: '',
        remarks: ''
    });

    const handleSearchFrom = async (e) => {
        e.preventDefault();
        if (!searchTermFrom) return;

        setLoadingFrom(true);
        setFromAccount(null);
        try {
            const response = await api.get(`/share-accounts/search?query=${searchTermFrom}`);
            setFromAccount(response.data);
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find source share account'
            });
        } finally {
            setLoadingFrom(false);
        }
    };

    const handleSearchTo = async (e) => {
        e.preventDefault();
        if (!searchTermTo) return;

        setLoadingTo(true);
        setToAccount(null);
        try {
            const response = await api.get(`/share-accounts/search?query=${searchTermTo}`);
            if (fromAccount && response.data.id === fromAccount.id) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Selection',
                    text: 'Source and destination accounts must be different.'
                });
                return;
            }
            setToAccount(response.data);
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find destination share account'
            });
        } finally {
            setLoadingTo(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromAccount || !toAccount || !formData.quantity) return;

        setSubmitting(true);
        try {
            const response = await api.post('/share-transfer', {
                from_account_id: fromAccount.id,
                to_account_id: toAccount.id,
                ...formData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: response.data.message,
                timer: 2000,
                showConfirmButton: false
            });

            setFormData({
                tran_date: new Date().toISOString().split('T')[0],
                quantity: '',
                remarks: ''
            });
            setFromAccount(null);
            setToAccount(null);
            setSearchTermFrom('');
            setSearchTermTo('');
            
        } catch (error) {
            console.error('Transfer error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.message || 'Transaction failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = (formData.quantity && fromAccount?.face_value) ? (formData.quantity * fromAccount.face_value).toFixed(2) : '0.00';

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                        <div className="flex items-center gap-3">
                            <Move className="w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold">Share Transfer</h1>
                                <p className="text-indigo-100 text-sm">Transfer shares between member accounts</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Source Account */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
                                    Source Account
                                </h2>
                                <form onSubmit={handleSearchFrom} className="relative mb-4">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={searchTermFrom}
                                        onChange={(e) => setSearchTermFrom(e.target.value)}
                                        placeholder="Account / Member Code"
                                        className="w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loadingFrom}
                                        className="absolute right-2 top-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loadingFrom ? '...' : 'Search'}
                                    </button>
                                </form>

                                {fromAccount && (
                                    <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800">{fromAccount.member?.member_name}</h3>
                                                <p className="text-xs text-indigo-600 font-semibold">{fromAccount.account_no}</p>
                                            </div>
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500 text-xs">Available Shares</p>
                                                <p className="font-bold text-gray-800">{fromAccount.total_shares}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500 text-xs">Current Value</p>
                                                <p className="font-bold text-gray-800">৳{fromAccount.current_balance}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Destination Account */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">2</span>
                                    Destination Account
                                </h2>
                                <form onSubmit={handleSearchTo} className="relative mb-4">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={searchTermTo}
                                        onChange={(e) => setSearchTermTo(e.target.value)}
                                        placeholder="Account / Member Code"
                                        className="w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loadingTo}
                                        className="absolute right-2 top-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loadingTo ? '...' : 'Search'}
                                    </button>
                                </form>

                                {toAccount && (
                                    <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800">{toAccount.member?.member_name}</h3>
                                                <p className="text-xs text-indigo-600 font-semibold">{toAccount.account_no}</p>
                                            </div>
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500 text-xs">Current Shares</p>
                                                <p className="font-bold text-gray-800">{toAccount.total_shares}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500 text-xs">Current Value</p>
                                                <p className="font-bold text-gray-800">৳{toAccount.current_balance}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transfer Details Form */}
                    <div className="p-8 bg-white border-t border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transfer Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="tran_date"
                                            value={formData.tran_date}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity to Transfer</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder={fromAccount ? `Max: ${fromAccount.total_shares}` : "0"}
                                        max={fromAccount?.total_shares}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-800"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transfer Value</label>
                                    <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                        <span className="text-indigo-600 font-bold">৳</span>
                                        <span className="font-bold text-indigo-700 text-lg">{totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="Optional transfer notes..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !fromAccount || !toAccount}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Processing Transfer...' : (
                                    <>
                                        <Move size={24} />
                                        Confirm Share Transfer
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareTransfer;
