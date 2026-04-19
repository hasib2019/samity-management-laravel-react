import React, { useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, Save, X, Loader, DollarSign, Calendar, User, FileText } from 'lucide-react';

const FdrClosing = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [fdrData, setFdrData] = useState(null);
    const [closingInfo, setClosingInfo] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [penalty, setPenalty] = useState(0);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setFdrData(null);
        setClosingInfo(null);

        try {
            const response = await api.get('/fdr-closings/search', {
                params: { query: searchTerm }
            });
            setFdrData(response.data.application);
            setClosingInfo(response.data.closing_info);
        } catch (error) {
            console.error('Error searching FDR:', error);
            Swal.fire('Error', error.response?.data?.message || 'FDR Account not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClosing = async () => {
        if (!fdrData || !closingInfo) return;

        const result = await Swal.fire({
            title: 'Confirm Closing',
            text: "Are you sure you want to close this FDR account?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, close it!'
        });

        if (result.isConfirmed) {
            setProcessing(true);
            try {
                const payload = {
                    fdr_application_id: fdrData.id,
                    closing_date: new Date().toISOString().split('T')[0],
                    principal_amount: parseFloat(closingInfo.principal_amount),
                    total_interest_paid: parseFloat(closingInfo.interest_collected) + parseFloat(closingInfo.interest_due),
                    penalty_amount: parseFloat(penalty)
                };

                await api.post('/fdr-closings', payload);
                Swal.fire('Success', 'FDR Account closed successfully', 'success');
                setFdrData(null);
                setClosingInfo(null);
                setSearchTerm('');
                setPenalty(0);
            } catch (error) {
                console.error('Error closing FDR:', error);
                Swal.fire('Error', error.response?.data?.message || 'Failed to close FDR account', 'error');
            } finally {
                setProcessing(false);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6 border-b">
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-red-600" />
                            FDR Account Closing
                        </h1>
                    </div>
                    
                    <div className="p-6">
                        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Enter FDR Account Number or Member Code"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                                Search
                            </button>
                        </form>

                        {fdrData && closingInfo && (
                            <div className="space-y-6">
                                {/* Account Details */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-gray-500" />
                                        Account Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Account Number</p>
                                            <p className="font-medium text-gray-900">{fdrData.account_no}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Member Name</p>
                                            <p className="font-medium text-gray-900">{fdrData.member?.member_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Product</p>
                                            <p className="font-medium text-gray-900">{fdrData.product?.product_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Status</p>
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {fdrData.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Closing Calculation */}
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Closing Calculation
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <p className="text-sm text-blue-700 mb-1">Principal Amount</p>
                                            <p className="text-xl font-bold text-blue-900">{parseFloat(closingInfo.principal_amount).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700 mb-1">Total Interest Accrued</p>
                                            <p className="text-xl font-bold text-blue-900">{parseFloat(closingInfo.total_interest_accrued).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700 mb-1">Interest Already Paid</p>
                                            <p className="text-xl font-bold text-green-700">{parseFloat(closingInfo.interest_collected).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700 mb-1">Interest Due</p>
                                            <p className="text-xl font-bold text-orange-700">{parseFloat(closingInfo.interest_due).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700 mb-1">Maturity Status</p>
                                            <p className={`font-medium ${closingInfo.is_matured ? 'text-green-600' : 'text-red-600'}`}>
                                                {closingInfo.is_matured ? 'Matured' : `Premature (${closingInfo.months_passed} months)`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-blue-900 mb-1">Penalty Amount</label>
                                            <input
                                                type="number"
                                                value={penalty}
                                                onChange={(e) => setPenalty(e.target.value)}
                                                className="w-full border-blue-200 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-blue-200">
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-medium text-blue-900">Net Payable Amount</p>
                                            <p className="text-3xl font-bold text-blue-900">
                                                {(
                                                    parseFloat(closingInfo.principal_amount) + 
                                                    parseFloat(closingInfo.interest_due) - 
                                                    parseFloat(penalty || 0)
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleClosing}
                                        disabled={processing}
                                        className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-colors font-bold flex items-center gap-2 shadow-lg shadow-red-200"
                                    >
                                        {processing ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                        Confirm Closing
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FdrClosing;
