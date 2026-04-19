import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, DollarSign, Calendar, FileText, ChevronRight, User, CreditCard, CheckCircle } from 'lucide-react';

const FdrCollection = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeApp, setActiveApp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Payment Form State
    const [paymentData, setPaymentData] = useState({
        interest_amount: '',
        collection_date: new Date().toISOString().split('T')[0],
        period_from: '',
        period_to: '',
        collection_type: 'monthly',
        remarks: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setActiveApp(null);
        try {
            const response = await api.get(`/fdr-collections/search?query=${searchTerm}`);
            setActiveApp(response.data);
            
            // Set default payment data
            setPaymentData(prev => ({
                ...prev,
                interest_amount: '',
                remarks: `FDR Interest Collection for Account #${response.data.account_no}`
            }));
            
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find FDR account'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!activeApp || !paymentData.interest_amount) return;

        setProcessing(true);
        try {
            const response = await api.post('/fdr-collections', {
                fdr_application_id: activeApp.id,
                ...paymentData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Collection Successful',
                text: response.data.message,
                timer: 2000,
                showConfirmButton: false
            });

            // Reset and refresh
            setPaymentData({
                interest_amount: '',
                collection_date: new Date().toISOString().split('T')[0],
                period_from: '',
                period_to: '',
                collection_type: 'monthly',
                remarks: ''
            });
            setActiveApp(null);
            setSearchTerm('');
            
        } catch (error) {
            console.error('Payment error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Collection Failed',
                text: error.response?.data?.message || 'Transaction failed'
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
            {/* Left Panel: Search */}
            <div className="w-full md:w-1/3 flex flex-col border-r bg-white">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        FDR Collection
                    </h1>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Account No / Member Code"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!activeApp && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Search for an active FDR account</p>
                        </div>
                    )}

                    {activeApp && (
                        <div className="p-4 rounded-xl border border-blue-500 bg-blue-50 ring-1 ring-blue-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{activeApp.product?.product_name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {activeApp.member?.member_name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 ml-4">
                                        Acc: {activeApp.account_no}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    activeApp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {activeApp.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Payment & Details */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {activeApp ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Account Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">FDR Details</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><CreditCard size={14} /> Principal: ৳{activeApp.fdr_amount}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Matures: {activeApp.maturity_date}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Interest Rate</p>
                                    <p className="text-xl font-bold text-gray-800">{activeApp.interest_rate}%</p>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Record Interest Payment
                                </h3>
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                                <input
                                                    type="date"
                                                    value={paymentData.collection_date}
                                                    onChange={(e) => setPaymentData({...paymentData, collection_date: e.target.value})}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={paymentData.interest_amount}
                                                    onChange={(e) => setPaymentData({...paymentData, interest_amount: e.target.value})}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={paymentData.collection_type}
                                                onChange={(e) => setPaymentData({...paymentData, collection_type: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="half_yearly">Half Yearly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Period From</label>
                                            <input
                                                type="date"
                                                value={paymentData.period_from}
                                                onChange={(e) => setPaymentData({...paymentData, period_from: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Period To</label>
                                            <input
                                                type="date"
                                                value={paymentData.period_to}
                                                onChange={(e) => setPaymentData({...paymentData, period_to: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            value={paymentData.remarks}
                                            onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="Remarks..."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-200 flex justify-center items-center gap-2"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <DollarSign size={20} />
                                                    Confirm Payment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Recent Collections */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Recent Collections</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-white border-b">
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeApp.collections && activeApp.collections.map((coll, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4">{coll.collection_date}</td>
                                                <td className="px-6 py-4 capitalize">{coll.collection_type}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {coll.period_from} to {coll.period_to}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">৳{parseFloat(coll.interest_amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {(!activeApp.collections || activeApp.collections.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                                                    No collections recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Select an account to start interest collection</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FdrCollection;
