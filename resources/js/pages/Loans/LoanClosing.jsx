import React, { useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, Lock, Calendar, User, CreditCard, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const LoanClosing = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLoan, setActiveLoan] = useState(null);
    const [closingInfo, setClosingInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Closing Form State
    const [formData, setFormData] = useState({
        closing_date: new Date().toISOString().split('T')[0],
        collected_amount: '',
        waiver_amount: '0',
        naration: '',
        payment_mode: 'cash'
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setActiveLoan(null);
        setClosingInfo(null);
        try {
            const response = await api.get(`/loan-closings/search?query=${searchTerm}`);
            setActiveLoan(response.data.loan);
            setClosingInfo(response.data.closing_info);
            
            setFormData(prev => ({
                ...prev,
                collected_amount: response.data.closing_info.total_due,
                waiver_amount: '0',
                naration: `Closing Loan Account #${response.data.account?.account_no || response.data.loan.id}`
            }));
            
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find active loan'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (e) => {
        const { name, value } = e.target;
        const newVal = parseFloat(value) || 0;
        
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            
            // Auto-adjust waiver/collected if needed to match total due?
            // Or just validate. Let's just update state.
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeLoan) return;

        const collected = parseFloat(formData.collected_amount) || 0;
        const waiver = parseFloat(formData.waiver_amount) || 0;
        const totalDue = parseFloat(closingInfo.total_due);

        // Client-side validation
        if (Math.abs((collected + waiver) - totalDue) > 1) {
            Swal.fire({
                icon: 'error',
                title: 'Amount Mismatch',
                text: `Collected (${collected}) + Waiver (${waiver}) must equal Total Due (${totalDue.toFixed(2)})`
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will permanently close the Loan account!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Close Loan'
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        try {
            const response = await api.post('/loan-closings', {
                loan_id: activeLoan.id,
                ...formData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Loan Closed',
                text: `Batch: ${response.data.batch}`,
                timer: 2000,
                showConfirmButton: false
            });

            // Reset
            setFormData({
                closing_date: new Date().toISOString().split('T')[0],
                collected_amount: '',
                waiver_amount: '0',
                naration: '',
                payment_mode: 'cash'
            });
            setActiveLoan(null);
            setClosingInfo(null);
            setSearchTerm('');
            
        } catch (error) {
            console.error('Closing error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Closing Failed',
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
                        <Lock className="w-6 h-6 text-red-600" />
                        Loan Closing
                    </h1>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Account No / Member Code"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all shadow-sm"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!activeLoan && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Search for an active Loan to close</p>
                        </div>
                    )}

                    {activeLoan && (
                        <div className="p-4 rounded-xl border border-red-500 bg-red-50 ring-1 ring-red-500">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{activeLoan.product?.product_name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {activeLoan.member?.member_name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 ml-4">
                                        Acc: {activeLoan.account_no || closingInfo?.account?.account_no}
                                    </p>
                                </div>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                    {activeLoan.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Closing Form */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {activeLoan && closingInfo ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Account Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Loan Summary</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Disbursed: {activeLoan.disbursed_date}</span>
                                        <span className="flex items-center gap-1"><CreditCard size={14} /> Amount: ৳{activeLoan.amount}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Total Due</p>
                                    <p className="text-2xl font-bold text-red-600">৳{parseFloat(closingInfo.total_due).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                    <p className="text-sm text-orange-600 mb-1">Outstanding Balance</p>
                                    <p className="text-lg font-bold text-orange-700">৳{parseFloat(closingInfo.outstanding_balance).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">(Principal + Interest)</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                                    <p className="text-sm text-purple-600 mb-1">Unpaid Fines</p>
                                    <p className="text-lg font-bold text-purple-700">৳{parseFloat(closingInfo.unpaid_fines).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Closing Form */}
                            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                                <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Final Settlement
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                                            <input
                                                type="date"
                                                name="closing_date"
                                                value={formData.closing_date}
                                                onChange={handleAmountChange}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                            <select
                                                name="payment_mode"
                                                value={formData.payment_mode}
                                                onChange={handleAmountChange}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank">Bank</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Waiver / Rebate</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="waiver_amount"
                                                    value={formData.waiver_amount}
                                                    onChange={handleAmountChange}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-medium text-gray-800"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Collected Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="collected_amount"
                                                    value={formData.collected_amount}
                                                    onChange={handleAmountChange}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm text-gray-600 bg-white p-3 rounded-lg border">
                                        <span>Total Settlement:</span>
                                        <span className={`font-bold ${(parseFloat(formData.collected_amount||0) + parseFloat(formData.waiver_amount||0)).toFixed(2) === parseFloat(closingInfo.total_due).toFixed(2) ? 'text-green-600' : 'text-red-600'}`}>
                                            ৳{(parseFloat(formData.collected_amount||0) + parseFloat(formData.waiver_amount||0)).toFixed(2)} / ৳{parseFloat(closingInfo.total_due).toFixed(2)}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                                        <input
                                            type="text"
                                            name="naration"
                                            value={formData.naration}
                                            onChange={handleAmountChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="Closing remarks..."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-200 flex justify-center items-center gap-2"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <Lock size={20} />
                                                    Confirm & Close Loan
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Lock className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Select a loan to proceed with closing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanClosing;
