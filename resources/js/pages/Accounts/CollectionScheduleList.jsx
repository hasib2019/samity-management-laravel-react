import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { FaPlus, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const CollectionScheduleList = () => {
    const [schedules, setSchedules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [formData, setFormData] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        note: ''
    });

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/collection-schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const handleReview = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/collection-schedules/review', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviewData(response.data);
            setShowModal(true);
        } catch (error) {
            alert('Error reviewing data');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/collection-schedules', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchSchedules();
            alert('Schedule activated successfully!');
        } catch (error) {
            alert('Error activating schedule');
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Monthly Collection Management</h2>
                <button 
                    onClick={handleReview}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                    <FaPlus className="mr-2" /> Start New Month Collection
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activated By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schedules.map((schedule) => (
                                <tr key={schedule.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {months[schedule.month - 1]} {schedule.year}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {schedule.is_active ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Closed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {schedule.penalty_start_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {schedule.creator?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {schedule.note}
                                    </td>
                                </tr>
                            ))}
                            {schedules.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No schedules found. Start a new collection month to begin.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog 
                open={showModal} 
                onClose={() => setShowModal(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-xl font-bold text-gray-900">Review & Activate Schedule</Dialog.Title>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="mt-2">
                            {reviewData && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                                        1-Year Data Review ({reviewData.review_period})
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                            <p className="text-xs text-blue-600 font-medium">Active Members</p>
                                            <p className="text-lg font-bold text-blue-800">{reviewData.active_members}</p>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded border border-green-100">
                                            <p className="text-xs text-green-600 font-medium">Collections (Count)</p>
                                            <p className="text-lg font-bold text-green-800">{reviewData.last_year_collections_count}</p>
                                        </div>
                                        <div className="bg-amber-50 p-3 rounded border border-amber-100">
                                            <p className="text-xs text-amber-600 font-medium">Total Amount</p>
                                            <p className="text-lg font-bold text-amber-800">{reviewData.last_year_total_amount}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
                                        <select 
                                            value={formData.month}
                                            onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            {months.map((m, idx) => (
                                                <option key={idx} value={idx + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <input 
                                            type="number" 
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.note}
                                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                Activating this month will automatically apply penalty logic starting from the 15th (or configured date).
                                                Other schedules will be marked as inactive.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleActivate}
                                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm"
                            >
                                <FaCheckCircle className="mr-2" /> Confirm & Activate
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default CollectionScheduleList;
