import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { DollarSign, Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const LoanDisbursement = () => {
    const [view, setView] = useState('list'); // 'list' | 'details'
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Details View State
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [loanDetails, setLoanDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Disbursement Form State
    const [disburseDate, setDisburseDate] = useState(new Date().toISOString().split('T')[0]);
    const [naration, setNaration] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const response = await api.get('/loan-disbursements');
            setLoans(response.data.data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            Swal.fire('Error', 'Failed to fetch loans', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        setSelectedLoanId(id);
        setView('details');
        setDetailsLoading(true);
        setLoanDetails(null);
        setNaration('');
        setDisburseDate(new Date().toISOString().split('T')[0]);

        try {
            const response = await api.get(`/loan-applications/${id}`);
            setLoanDetails(response.data);
        } catch (error) {
            console.error('Error fetching loan details:', error);
            Swal.fire('Error', 'Failed to fetch loan details', 'error');
            setView('list');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDisburse = async (e) => {
        e.preventDefault();
        
        const result = await Swal.fire({
            title: 'Confirm Disbursement',
            text: `Are you sure you want to disburse ${loanDetails?.amount} to ${loanDetails?.member?.member_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Disburse it!'
        });

        if (result.isConfirmed) {
            setSubmitting(true);
            try {
                const response = await api.post('/loan-disbursements', {
                    loan_id: selectedLoanId,
                    disbursed_date: disburseDate,
                    naration: naration
                });

                if (response.status === 200) {
                    Swal.fire('Success', 'Loan disbursed successfully!', 'success');
                    setView('list');
                    fetchLoans();
                }
            } catch (error) {
                console.error('Disbursement error:', error);
                const msg = error.response?.data?.message || 'Failed to disburse loan';
                Swal.fire('Error', msg, 'error');
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (view === 'details') {
        return (
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <button 
                        onClick={() => setView('list')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Loan Disbursement Details</h1>
                </div>

                {detailsLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading loan details...</p>
                    </div>
                ) : loanDetails ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Loan Info & Schedule */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Loan Info Card */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Loan Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="text-gray-500 block">Member Name</label>
                                        <span className="font-medium text-gray-900">{loanDetails.member?.member_name}</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Member Code</label>
                                        <span className="font-medium text-gray-900">{loanDetails.member?.member_code}</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Product</label>
                                        <span className="font-medium text-gray-900">{loanDetails.product?.product_name}</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Interest Rate</label>
                                        <span className="font-medium text-gray-900">{loanDetails.interest_rate}% ({loanDetails.product?.rate_type || 'Flat'})</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Duration</label>
                                        <span className="font-medium text-gray-900">{loanDetails.duration_months} Months</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Installment Type</label>
                                        <span className="capitalize font-medium text-gray-900">{loanDetails.installment_type}</span>
                                    </div>
                                    <div>
                                        <label className="text-gray-500 block">Principal Amount</label>
                                        <span className="font-bold text-lg text-blue-600">{Number(loanDetails.amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Repayment Schedule */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-800">Repayment Schedule</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                            {loanDetails.schedules && loanDetails.schedules.length > 0 ? (
                                                loanDetails.schedules.map((schedule) => (
                                                    <tr key={schedule.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 text-gray-900">{schedule.installment_no}</td>
                                                        <td className="px-6 py-3 text-gray-900">{schedule.due_date}</td>
                                                        <td className="px-6 py-3 text-right text-gray-900">{Number(schedule.principal_amount).toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-right text-gray-900">{Number(schedule.interest_amount).toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-right font-medium text-gray-900">{Number(schedule.total_amount).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                        No schedule found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {loanDetails.schedules && loanDetails.schedules.length > 0 && (
                                            <tfoot className="bg-gray-50 font-medium">
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-3 text-right">Total:</td>
                                                    <td className="px-6 py-3 text-right">
                                                        {loanDetails.schedules.reduce((sum, s) => sum + Number(s.principal_amount), 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        {loanDetails.schedules.reduce((sum, s) => sum + Number(s.interest_amount), 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        {loanDetails.schedules.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Action Panel */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Disbursement Action</h3>
                                
                                <form onSubmit={handleDisburse}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Disbursement Date</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input 
                                                type="date" 
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                value={disburseDate}
                                                onChange={e => setDisburseDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                                        <textarea 
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            rows="3"
                                            value={naration}
                                            onChange={e => setNaration(e.target.value)}
                                            placeholder="Enter optional notes..."
                                        />
                                    </div>

                                    {/* GL Info Warning */}
                                    <div className="mb-6 p-3 bg-blue-50 rounded-md border border-blue-100">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">Transaction Info</h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>Debit: Loan Outstanding GL</p>
                                                    <p>Credit: Loan Disbursement GL</p>
                                                    <p className="text-xs text-gray-500 mt-1">(Defined in Product Setup)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                                    >
                                        {submitting ? 'Processing...' : 'Approve & Disburse'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10">Loan details not found.</div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Loan Disbursement</h1>
            
            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : loans.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No approved loans ready for disbursement.</td></tr>
                            ) : (
                                loans.map(loan => (
                                    <tr key={loan.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.apply_date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{loan.member?.member_name}</div>
                                            <div className="text-gray-500 text-xs">{loan.member?.member_code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.product?.product_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button 
                                                onClick={() => handleViewDetails(loan.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                View & Disburse
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LoanDisbursement;