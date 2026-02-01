import React, { useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { Search, Lock, Calendar, User, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

const DpsClosing = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeApp, setActiveApp] = useState(null);
    const [closingInfo, setClosingInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    
    // Closing Form State
    const [formData, setFormData] = useState({
        closing_date: new Date().toISOString().split('T')[0],
        total_paid: '',
        interest_paid: '',
        naration: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setActiveApp(null);
        setClosingInfo(null);
        try {
            const response = await api.get(`/dps-closings/search?query=${searchTerm}`);
            setActiveApp(response.data.application);
            setClosingInfo(response.data.closing_info);
            
            setFormData(prev => ({
                ...prev,
                total_paid: response.data.closing_info.calculated_payable,
                interest_paid: response.data.closing_info.calculated_interest,
                naration: `Closing DPS Account #${response.data.application.account_no}`
            }));
            
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Search Failed',
                text: error.response?.data?.message || 'Could not find active DPS account'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeApp) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will permanently close the DPS account!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Close Account'
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        try {
            const response = await api.post('/dps-closings', {
                dps_application_id: activeApp.id,
                ...formData
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Account Closed',
                text: `Batch: ${response.data.batch}`,
                timer: 2000,
                showConfirmButton: false
            });

            // Reset
            setFormData({
                closing_date: new Date().toISOString().split('T')[0],
                total_paid: '',
                interest_paid: '',
                naration: ''
            });
            setActiveApp(null);
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
                        DPS Closing
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
                    {!activeApp && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Search for an active DPS account to close</p>
                        </div>
                    )}

                    {activeApp && (
                        <div className="p-4 rounded-xl border border-red-500 bg-red-50 ring-1 ring-red-500">
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
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                    {activeApp.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Closing Form */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {activeApp && closingInfo ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Account Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Account Summary</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Start: {activeApp.start_date}</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> Maturity: {activeApp.maturity_date}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Current Balance</p>
                                    <p className="text-xl font-bold text-gray-800">৳{parseFloat(activeApp.balance).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className={`p-4 rounded-xl border ${closingInfo.is_matured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                    <p className={`text-sm font-semibold mb-1 ${closingInfo.is_matured ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {closingInfo.is_matured ? 'Matured' : 'Premature'}
                                    </p>
                                    <p className="text-xs text-gray-500">Status</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">Duration Passed</p>
                                    <p className="text-lg font-bold text-gray-800">{closingInfo.duration_passed} Months</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">Expected Maturity</p>
                                    <p className="text-lg font-bold text-gray-800">৳{parseFloat(activeApp.maturity_amount).toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-sm text-blue-600 mb-1">Calculated Interest</p>
                                    <p className="text-lg font-bold text-blue-700">৳{parseFloat(closingInfo.calculated_interest).toFixed(2)}</p>
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
                                                value={formData.closing_date}
                                                onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Paid</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.interest_paid}
                                                onChange={(e) => setFormData({...formData, interest_paid: e.target.value})}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Paid Amount (Principal + Interest)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.total_paid}
                                                onChange={(e) => setFormData({...formData, total_paid: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-xl text-gray-800"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Make sure this matches the cash to be given to the member.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
                                        <input
                                            type="text"
                                            value={formData.naration}
                                            onChange={(e) => setFormData({...formData, naration: e.target.value})}
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
                                                    Confirm & Close Account
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
                        <p className="text-lg">Select an account to proceed with closing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DpsClosing;
