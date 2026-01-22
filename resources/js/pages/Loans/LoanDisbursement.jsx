import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { DollarSign, Calendar, CheckCircle } from 'lucide-react';

const LoanDisbursement = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [glAccounts, setGlAccounts] = useState([]);
    
    // Disbursement Form
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [formData, setFormData] = useState({
        disbursed_date: new Date().toISOString().split('T')[0],
        gl_account_id: '',
        naration: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLoans();
        fetchGlAccounts();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const response = await api.get('/loan-disbursements');
            setLoans(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlAccounts = async () => {
        try {
            const response = await api.get('/gl-accounts');
            const accounts = Array.isArray(response.data) ? response.data : response.data.data || [];
            // Filter for Child Accounts (C) and Assets (Type 1) with "Cash", "Bank", "নগদ", or "ব্যাংক" in name
            setGlAccounts(accounts.filter(a => 
                a.parent_child === 'C' && 
                a.glac_type == 1 &&
                (
                    a.glac_name.toLowerCase().includes('cash') || 
                    a.glac_name.toLowerCase().includes('bank') ||
                    a.glac_name.includes('নগদ') ||
                    a.glac_name.includes('ব্যাংক')
                )
            )); 
        } catch (err) {
            console.error(err);
        }
    };

    const handleDisburse = async (e) => {
        e.preventDefault();
        if (!selectedLoan) return;

        setSubmitting(true);
        try {
            await api.post('/loan-disbursements', {
                loan_id: selectedLoan.id,
                ...formData
            });
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Loan Disbursed Successfully'
            });
            setSelectedLoan(null);
            fetchLoans();
            // Reset form but keep date
            setFormData(prev => ({ ...prev, gl_account_id: '', naration: '' }));
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to disburse loan'
            });
        } finally {
            setSubmitting(false);
        }
    };

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
                                                onClick={() => {
                                                    setSelectedLoan(loan);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        gl_account_id: loan.product?.gl_principal_id || ''
                                                    }));
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                Disburse
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedLoan && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Confirm Disbursement</h3>
                            <button 
                                onClick={() => setSelectedLoan(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-500">Member:</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.member?.member_name}</span>
                                    
                                    <span className="text-gray-500">Loan Product:</span>
                                    <span className="font-medium text-gray-900">{selectedLoan.product?.product_name}</span>
                                    
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="font-bold text-blue-600">{selectedLoan.amount}</span>
                                </div>
                            </div>
                            
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
                                            value={formData.disbursed_date}
                                            onChange={e => setFormData({...formData, disbursed_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Account (Cash/Bank)</label>
                                    <select 
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={formData.gl_account_id}
                                        onChange={e => setFormData({...formData, gl_account_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {glAccounts.map(gl => (
                                            <option key={gl.id} value={gl.id}>{gl.glac_name} ({gl.glac_code})</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Defaulted to Product's Principal GL. Verify source account.
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                                    <textarea 
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        rows="2"
                                        value={formData.naration}
                                        onChange={e => setFormData({...formData, naration: e.target.value})}
                                        placeholder="Enter optional notes..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedLoan(null)}
                                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Disbursement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanDisbursement;
