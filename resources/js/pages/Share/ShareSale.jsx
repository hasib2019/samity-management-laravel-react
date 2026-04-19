import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { ShoppingCart, User, Calendar, DollarSign, Search, FileText, PieChart, MinusCircle } from 'lucide-react';

const ShareSale = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeAccount, setActiveAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        tran_date: new Date().toISOString().split('T')[0],
        quantity: '',
        remarks: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setActiveAccount(null);
        try {
            const response = await api.get(`/share-accounts/search?query=${searchTerm}`);
            setActiveAccount(response.data);
            setFormData(prev => ({
                ...prev,
                remarks: `Share Sale from Account #${response.data.account_no}`
            }));
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find share account'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeAccount || !formData.quantity) return;

        setSubmitting(true);
        try {
            const response = await api.post('/share-sale', {
                share_account_id: activeAccount.id,
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
            setActiveAccount(null);
            setSearchTerm('');
            
        } catch (error) {
            console.error('Sale error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.message || 'Transaction failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = (formData.quantity && activeAccount?.face_value) ? (formData.quantity * activeAccount.face_value).toFixed(2) : '0.00';

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
            {/* Left Panel: Search */}
            <div className="w-full md:w-1/3 flex flex-col border-r bg-white">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MinusCircle className="w-6 h-6 text-red-600" />
                        Share Sale
                    </h1>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Account / Member Code"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none shadow-sm transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!activeAccount && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Search for an active share account</p>
                        </div>
                    )}

                    {activeAccount && (
                        <div className="p-4 rounded-xl border border-red-500 bg-red-50 ring-1 ring-red-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{activeAccount.product?.product_name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {activeAccount.member?.member_name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 ml-4">
                                        Acc: {activeAccount.account_no}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    activeAccount.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {activeAccount.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {activeAccount ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Account Summary</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><PieChart size={14} /> Shares: {activeAccount.total_shares}</span>
                                        <span className="flex items-center gap-1"><DollarSign size={14} /> Value: ৳{activeAccount.current_balance}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Face Value</p>
                                    <p className="text-xl font-bold text-gray-800">৳{activeAccount.face_value}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Sale Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="date"
                                                name="tran_date"
                                                value={formData.tran_date}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity to Sell</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800 shadow-sm"
                                            placeholder={`Max: ${activeAccount.total_shares}`}
                                            max={activeAccount.total_shares}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex justify-between items-center">
                                    <span className="text-red-700 font-semibold uppercase tracking-wider text-sm">Total Sale Value</span>
                                    <span className="text-2xl font-bold text-red-800">৳{totalAmount}</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none shadow-sm h-24"
                                        placeholder="Add transaction notes..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Recording Sale...' : (
                                        <>
                                            <MinusCircle size={24} />
                                            Confirm Share Sale
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <PieChart className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Select a share account to record a sale</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareSale;
