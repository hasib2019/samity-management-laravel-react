import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, DollarSign, Calendar, FileText, ChevronRight, User, CreditCard, CheckCircle } from 'lucide-react';

const DpsCollection = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeApp, setActiveApp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Payment Form State
    const [paymentData, setPaymentData] = useState({
        amount: '',
        tran_date: new Date().toISOString().split('T')[0],
        naration: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setActiveApp(null);
        try {
            const response = await api.get(`/dps-collections/search?query=${searchTerm}`);
            setActiveApp(response.data);
            
            // Auto-calculate due amount for the first unpaid installment
            handleSelectApp(response.data);
            
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find DPS account'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectApp = (app) => {
        if (!app || !app.installments) return;

        // Find next unpaid installment
        const nextInstallment = app.installments.find(s => s.status !== 'paid');
        
        let dueAmount = '';
        if (nextInstallment) {
            const amount = parseFloat(nextInstallment.amount || 0);
            const fine = parseFloat(nextInstallment.fine_amount || 0);
            const paid = parseFloat(nextInstallment.paid_amount || 0);
            // Assuming paid_amount counts towards principal + fine
            // Or usually paid_amount is just principal part in some systems, but let's assume it covers both.
            // If the controller logic splits it, we need to match.
            // For now, let's suggest the full installment amount.
            dueAmount = (amount + fine - paid).toFixed(2);
        }

        setPaymentData(prev => ({
            ...prev,
            amount: dueAmount || app.dps_amount, // Default to monthly amount if no specific due calculated
            naration: `DPS Collection for Account #${app.account_no}`
        }));
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!activeApp || !paymentData.amount) return;

        setProcessing(true);
        try {
            const response = await api.post('/dps-collections', {
                dps_application_id: activeApp.id,
                ...paymentData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Collection Successful',
                text: `New Balance: ৳${response.data.new_balance}`,
                timer: 2000,
                showConfirmButton: false
            });

            // Reset and refresh
            setPaymentData({
                amount: '',
                tran_date: new Date().toISOString().split('T')[0],
                naration: ''
            });
            setActiveApp(null);
            setSearchTerm(''); // Clear search to force re-entry or keep it? 
            // Better to clear or let user search again.
            
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
                        DPS Collection
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
                            <p>Search for a DPS account to start collection</p>
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
                                    <h2 className="text-2xl font-bold text-gray-800">DPS Details</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><CreditCard size={14} /> Monthly: ৳{activeApp.dps_amount}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Matures: {activeApp.maturity_date}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Current Balance</p>
                                    <p className="text-xl font-bold text-gray-800">৳{parseFloat(activeApp.balance).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Record Collection
                                </h3>
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                                <input
                                                    type="date"
                                                    value={paymentData.tran_date}
                                                    onChange={(e) => setPaymentData({...paymentData, tran_date: e.target.value})}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={paymentData.amount}
                                                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                                        <input
                                            type="text"
                                            value={paymentData.naration}
                                            onChange={(e) => setPaymentData({...paymentData, naration: e.target.value})}
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
                                                    Confirm Collection
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Schedule Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Installment Schedule</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-white border-b">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {activeApp.installments && activeApp.installments.map((sch, idx) => (
                                            <tr key={idx} className={sch.status === 'paid' ? 'bg-green-50/50' : ''}>
                                                <td className="px-6 py-3 font-medium text-gray-900">{sch.installment_no}</td>
                                                <td className="px-6 py-3 text-gray-500">{sch.due_date}</td>
                                                <td className="px-6 py-3 text-right font-medium">৳{sch.amount}</td>
                                                <td className="px-6 py-3 text-right text-red-500">
                                                    {parseFloat(sch.fine_amount) > 0 ? `৳${sch.fine_amount}` : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-right text-green-600">
                                                    {sch.paid_amount > 0 ? `৳${parseFloat(sch.paid_amount).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        sch.status === 'paid' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : sch.status === 'overdue' 
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {sch.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!activeApp.installments || activeApp.installments.length === 0) && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                    No pending installments found
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
                        <p className="text-lg">Select an account to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DpsCollection;
