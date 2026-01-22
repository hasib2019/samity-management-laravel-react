import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, DollarSign, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const LoanRepayment = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLoans, setActiveLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentRepayments, setRecentRepayments] = useState([]);
    
    // Payment Form State
    const [paymentData, setPaymentData] = useState({
        loan_id: null,
        amount: '',
        tran_date: new Date().toISOString().split('T')[0],
        naration: ''
    });
    const [processing, setProcessing] = useState(false);
    const [expandedLoan, setExpandedLoan] = useState(null);

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
        try {
            const response = await api.get(`/loan-repayments/search?search_term=${searchTerm}`);
            setActiveLoans(response.data);
            if (response.data.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'No active loans found',
                    text: 'No active loans found for this member/code.'
                });
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

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentData.loan_id || !paymentData.amount) return;

        setProcessing(true);
        try {
            const response = await api.post('/loan-repayments', paymentData);
            
            Swal.fire({
                icon: 'success',
                title: 'Payment Successful',
                text: `Batch: ${response.data.batch}`,
                timer: 2000
            });

            // Reset and refresh
            setPaymentData({
                loan_id: null,
                amount: '',
                tran_date: new Date().toISOString().split('T')[0],
                naration: ''
            });
            handleSearch({ preventDefault: () => {} }); // Refresh loan data
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

    const selectLoanForPayment = (loan) => {
        // Find next unpaid schedule amount
        const nextSchedule = loan.schedules.find(s => s.status !== 'paid');
        const dueAmount = nextSchedule ? (nextSchedule.total_amount - (nextSchedule.paid_amount || 0)).toFixed(2) : '';

        setPaymentData({
            ...paymentData,
            loan_id: loan.id,
            amount: dueAmount,
            naration: `Repayment for Loan #${loan.id}`
        });
    };

    const toggleSchedule = (loanId) => {
        setExpandedLoan(expandedLoan === loanId ? null : loanId);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Loan Repayment</h1>

            {/* Search Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Member Code or Account No..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Loans List */}
                <div className="lg:col-span-2 space-y-6">
                    {activeLoans.map(loan => (
                        <div key={loan.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                            {/* Loan Header */}
                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg text-blue-800">{loan.product?.product_name}</h3>
                                    <p className="text-sm text-gray-600">
                                        Member: <span className="font-medium">{loan.member?.member_name} ({loan.member?.member_code})</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Loan ID: #{loan.id}</p>
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {loan.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Loan Stats */}
                            <div className="p-4 grid grid-cols-3 gap-4 bg-white">
                                <div className="text-center p-2 bg-blue-50 rounded">
                                    <p className="text-xs text-gray-500">Principal</p>
                                    <p className="font-semibold">{loan.amount}</p>
                                </div>
                                <div className="text-center p-2 bg-red-50 rounded">
                                    <p className="text-xs text-gray-500">Total Due</p>
                                    <p className="font-semibold text-red-600">{parseFloat(loan.total_due).toFixed(2)}</p>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded">
                                    <p className="text-xs text-gray-500">Paid</p>
                                    <p className="font-semibold text-green-600">{parseFloat(loan.total_paid).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Payment Form Area */}
                            <div className="p-4 border-t bg-gray-50">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <DollarSign size={16} /> Make Payment
                                </h4>
                                <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={paymentData.loan_id === loan.id ? paymentData.tran_date : ''}
                                            onChange={(e) => setPaymentData({...paymentData, tran_date: e.target.value, loan_id: loan.id})}
                                            onFocus={() => paymentData.loan_id !== loan.id && selectLoanForPayment(loan)}
                                            className="w-full p-2 border rounded text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={paymentData.loan_id === loan.id ? paymentData.amount : ''}
                                            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value, loan_id: loan.id})}
                                            onFocus={() => paymentData.loan_id !== loan.id && selectLoanForPayment(loan)}
                                            className="w-full p-2 border rounded text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Narration</label>
                                            <input
                                                type="text"
                                                value={paymentData.loan_id === loan.id ? paymentData.naration : ''}
                                                onChange={(e) => setPaymentData({...paymentData, naration: e.target.value, loan_id: loan.id})}
                                                onFocus={() => paymentData.loan_id !== loan.id && selectLoanForPayment(loan)}
                                                className="w-full p-2 border rounded text-sm"
                                                placeholder="Remarks..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing || paymentData.loan_id !== loan.id}
                                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 h-10 mt-auto"
                                        >
                                            Pay
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Schedule Toggle */}
                            <button 
                                onClick={() => toggleSchedule(loan.id)}
                                className="w-full p-2 text-center text-sm text-blue-600 hover:bg-blue-50 border-t flex justify-center items-center gap-1"
                            >
                                {expandedLoan === loan.id ? 'Hide Schedule' : 'View Schedule'}
                                {expandedLoan === loan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Schedule Table */}
                            {expandedLoan === loan.id && (
                                <div className="overflow-x-auto p-4 border-t">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="p-2 text-left">No</th>
                                                <th className="p-2 text-left">Due Date</th>
                                                <th className="p-2 text-right">Principal</th>
                                                <th className="p-2 text-right">Interest</th>
                                                <th className="p-2 text-right">Total</th>
                                                <th className="p-2 text-right">Paid</th>
                                                <th className="p-2 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loan.schedules.map((sch, idx) => (
                                                <tr key={idx} className={`border-b ${sch.status === 'paid' ? 'bg-green-50' : ''}`}>
                                                    <td className="p-2">{sch.installment_no}</td>
                                                    <td className="p-2">{sch.due_date}</td>
                                                    <td className="p-2 text-right">{sch.principal_amount}</td>
                                                    <td className="p-2 text-right">{sch.interest_amount}</td>
                                                    <td className="p-2 text-right font-medium">{sch.total_amount}</td>
                                                    <td className="p-2 text-right text-green-600 font-medium">
                                                        {sch.paid_amount > 0 ? parseFloat(sch.paid_amount).toFixed(2) : '-'}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                                            sch.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                                        }`}>
                                                            {sch.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {activeLoans.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                            Use the search box to find active loans.
                        </div>
                    )}
                </div>

                {/* Recent Transactions Sidebar */}
                <div className="bg-white rounded-lg shadow h-fit">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg">Recent Repayments</h2>
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                        {recentRepayments.map(tran => (
                            <div key={tran.id} className="p-3 hover:bg-gray-50 text-sm">
                                <div className="flex justify-between font-medium">
                                    <span>{tran.member?.member_name}</span>
                                    <span className="text-green-600">+{tran.dr_amt}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{tran.tran_date}</span>
                                    <span>{tran.batch_num}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                    {tran.naration}
                                </div>
                            </div>
                        ))}
                        {recentRepayments.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                No recent transactions.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanRepayment;
