import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, DollarSign, Calendar, FileText, ChevronRight, User, CreditCard, History, X, CheckCircle } from 'lucide-react';

const LoanRepayment = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLoans, setActiveLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentRepayments, setRecentRepayments] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState(null);
    
    // Payment Form State
    const [paymentData, setPaymentData] = useState({
        amount: '',
        tran_date: new Date().toISOString().split('T')[0],
        naration: ''
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRecentRepayments();
    }, []);

    const fetchRecentRepayments = async () => {
        try {
            const response = await api.get('/loan-repayments');
            setRecentRepayments(response.data.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setSelectedLoan(null);
        try {
            const response = await api.get(`/loan-repayments/search?search_term=${searchTerm}`);
            setActiveLoans(response.data);
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No active loans found',
                    text: 'No active loans found for this member/code.'
                });
            } else if (response.data.length === 1) {
                // Auto-select if only one result
                handleSelectLoan(response.data[0]);
            }
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find member info'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLoan = (loan) => {
        setSelectedLoan(loan);
        // Find next unpaid schedule amount
        const nextSchedule = loan.schedules.find(s => s.status !== 'paid');
        const dueAmount = nextSchedule ? (nextSchedule.total_amount - (nextSchedule.paid_amount || 0)).toFixed(2) : '';

        setPaymentData({
            amount: dueAmount,
            tran_date: new Date().toISOString().split('T')[0],
            naration: `Repayment for Loan #${loan.account_no || loan.id}`
        });
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLoan || !paymentData.amount) return;

        setProcessing(true);
        try {
            const response = await api.post('/loan-repayments', {
                loan_id: selectedLoan.id,
                ...paymentData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Payment Successful',
                text: `Batch: ${response.data.batch}`,
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh data
            setPaymentData({
                amount: '',
                tran_date: new Date().toISOString().split('T')[0],
                naration: ''
            });
            setSelectedLoan(null);
            handleSearch({ preventDefault: () => {} }); // Refresh loan list
            fetchRecentRepayments();

        } catch (error) {
            console.error('Payment error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: error.response?.data?.message || 'Transaction failed'
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
            {/* Left Panel: Search & List */}
            <div className="w-full md:w-1/3 flex flex-col border-r bg-white">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        Loan Repayment
                    </h1>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Member Code / Account No"
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeLoans.map(loan => (
                        <div 
                            key={loan.id} 
                            onClick={() => handleSelectLoan(loan)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                                selectedLoan?.id === loan.id 
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                    : 'border-gray-100 bg-white hover:border-blue-200'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{loan.product?.product_name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <User size={12} /> {loan.member?.member_name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 ml-4">
                                        Code: {loan.member?.member_code}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    loan.status === 'disbursed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {loan.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                                <div>
                                    <p className="text-xs text-gray-400">Due Amount</p>
                                    <p className="font-bold text-red-600">৳{parseFloat(loan.total_due).toFixed(2)}</p>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 ${selectedLoan?.id === loan.id ? 'text-blue-500' : ''}`} />
                            </div>
                        </div>
                    ))}

                    {activeLoans.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Search for a member to start</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Payment & Details */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {selectedLoan ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Loan Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedLoan.product?.product_name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><CreditCard size={14} /> Acc: {selectedLoan.account_no || 'N/A'}</span>
                                        <span className="flex items-center gap-1"><User size={14} /> {selectedLoan.member?.member_name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Principal Amount</p>
                                    <p className="text-xl font-bold text-gray-800">৳{parseFloat(selectedLoan.amount).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-sm text-red-600 mb-1">Total Outstanding</p>
                                    <p className="text-2xl font-bold text-red-700">৳{parseFloat(selectedLoan.total_due).toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <p className="text-sm text-green-600 mb-1">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-700">৳{parseFloat(selectedLoan.total_paid).toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-600 mb-1">Next Installment</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {/* Display logic for next installment */}
                                        ৳{selectedLoan.schedules.find(s => s.status !== 'paid')?.total_amount || '0.00'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Record Payment
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Repayment Amount</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration / Remarks</label>
                                        <input
                                            type="text"
                                            value={paymentData.naration}
                                            onChange={(e) => setPaymentData({...paymentData, naration: e.target.value})}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="Optional remarks..."
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

                        {/* Schedule Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Repayment Schedule</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-white border-b">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {selectedLoan.schedules.map((sch, idx) => (
                                            <tr key={idx} className={sch.status === 'paid' ? 'bg-green-50/50' : ''}>
                                                <td className="px-6 py-3 font-medium text-gray-900">{sch.installment_no}</td>
                                                <td className="px-6 py-3 text-gray-500">{sch.due_date}</td>
                                                <td className="px-6 py-3 text-right font-medium">৳{sch.total_amount}</td>
                                                <td className="px-6 py-3 text-right text-green-600">
                                                    {sch.paid_amount > 0 ? `৳${parseFloat(sch.paid_amount).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        sch.status === 'paid' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {sch.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <CreditCard className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">Select a Loan</h3>
                        <p className="text-sm mt-1 max-w-xs text-center">
                            Search for a member and select a loan from the list to view details and make a payment.
                        </p>
                        
                        {/* Recent Repayments Preview */}
                        <div className="mt-12 w-full max-w-lg">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">Recent Transactions</h4>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                                {recentRepayments.slice(0, 5).map(tran => (
                                    <div key={tran.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-800">{tran.member?.member_name}</p>
                                            <p className="text-xs text-gray-500">{tran.tran_date} • {tran.batch_num}</p>
                                        </div>
                                        <span className="font-bold text-green-600">+৳{parseFloat(tran.dr_amt).toFixed(2)}</span>
                                    </div>
                                ))}
                                {recentRepayments.length === 0 && (
                                    <div className="p-4 text-center text-xs text-gray-400">No recent transactions</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanRepayment;
