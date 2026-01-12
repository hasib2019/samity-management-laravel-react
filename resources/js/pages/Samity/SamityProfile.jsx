import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Building, MapPin, Tag, Calendar, User, Save, X } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/sweetAlert';

const SamityProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        samity_name: '',
        samity_code: '',
        samity_address: '',
        samity_type: 'P',
        monthly_subscription_fee: 1000,
        penalty_amount: 200,
        penalty_late_date: 15
    });
console.log({profile})
    const { hasPermission } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/samity-profiles');
            // Backend now returns a single object or empty/null
            if (response.data && response.data[0].id) {
                setProfile(response.data[0]);
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Failed to fetch samity profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setFormData({
            samity_name: '',
            samity_code: '',
            samity_address: '',
            samity_type: 'P',
            monthly_subscription_fee: 1000,
            penalty_amount: 200,
            penalty_late_date: 15
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = () => {
        if (!profile) return;
        setFormData({
            samity_name: profile.samity_name,
            samity_code: profile.samity_code,
            samity_address: profile.samity_address,
            samity_type: profile.samity_type,
            monthly_subscription_fee: profile.monthly_subscription_fee || 1000,
            penalty_amount: profile.penalty_amount || 200,
            penalty_late_date: profile.penalty_late_date || 15
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (profile && profile.id) {
                // Update existing profile
                await api.put(`/samity-profiles/${profile.id}`, formData);
                showSuccessToast('Samity Profile updated successfully');
            } else {
                // Create new profile
                await api.post('/samity-profiles', formData);
                showSuccessToast('Samity Profile created successfully');
            }
            setIsModalOpen(false);
            fetchProfile();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                const firstError = Object.values(error.response.data.errors)[0][0];
                showErrorToast(firstError);
            } else {
                showErrorToast(error.response?.data?.message || 'Something went wrong');
            }
        }
    };

    if (loading) return <div className="py-10 text-center">Loading...</div>;

    if (!hasPermission('samity-profile.view')) {
        return <div className="py-10 text-center text-red-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Samity Profile</h2>
                {/* Only show Add button if no profile exists */}
                {!profile && hasPermission('samity.profile.add') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" />
                        Setup Profile
                    </button>
                )}
            </div>

            {!profile ? (
                <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Building className="mx-auto mb-4 w-12 h-12 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900">No Profile Setup</h3>
                    <p className="mt-1 text-gray-500">Please setup the Samity Profile to get started.</p>
                </div>
            ) : (
                <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 mr-4 bg-blue-100 rounded-lg">
                                <Building className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{profile.samity_name}</h3>
                                <p className="text-sm text-gray-500">Official Samity Profile</p>
                            </div>
                        </div>
                        {hasPermission('samity.profile.add') && (
                            <button
                                onClick={handleOpenEditModal}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                            >
                                <Edit className="mr-1.5 w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <div>
                                <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Samity Code</label>
                                <div className="flex items-center">
                                    <Tag className="mr-2 w-4 h-4 text-gray-400" />
                                    <span className="px-2 py-1 text-base font-semibold text-gray-900 bg-gray-100 rounded">
                                        {profile.samity_code}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Samity Type</label>
                                <div className="flex items-center">
                                    <span className="text-base text-gray-900">
                                        {profile.samity_type === 'P' ? 'Primary (P)' : profile.samity_type}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Monthly Fee</label>
                                    <div className="flex items-center">
                                        <span className="text-base text-gray-900">{profile.monthly_subscription_fee} BDT</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Penalty Amt</label>
                                    <div className="flex items-center">
                                        <span className="text-base text-gray-900">{profile.penalty_amount} BDT</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Late Date</label>
                                    <div className="flex items-center">
                                        <span className="text-base text-gray-900">Day {profile.penalty_late_date}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Address</label>
                                <div className="flex items-start">
                                    <MapPin className="mt-1 mr-2 w-4 h-4 text-gray-400" />
                                    <span className="text-base text-gray-900">{profile.samity_address}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h4 className="pb-2 text-sm font-semibold text-gray-900 border-b border-gray-200">System Information</h4>
                            
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-gray-500">
                                    <User className="mr-2 w-4 h-4" /> Created By
                                </span>
                                <span className="font-medium text-gray-900">{profile.creator?.name || 'System'}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-gray-500">
                                    <Calendar className="mr-2 w-4 h-4" /> Created Date
                                </span>
                                <span className="font-medium text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-gray-500">
                                    <User className="mr-2 w-4 h-4" /> Last Updated By
                                </span>
                                <span className="font-medium text-gray-900">{profile.updator?.name || 'System'}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-gray-500">
                                    <Calendar className="mr-2 w-4 h-4" /> Last Updated
                                </span>
                                <span className="font-medium text-gray-900">{new Date(profile.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
                        <div 
                            className="fixed inset-0 backdrop-blur-sm transition-opacity bg-black/50" 
                            aria-hidden="true" 
                            onClick={() => setIsModalOpen(false)}
                        ></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[101]">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center pb-3 mb-5 border-b border-gray-100">
                                        <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                            {profile ? 'Edit Samity Profile' : 'Setup Samity Profile'}
                                        </h3>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Samity Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.samity_name}
                                                onChange={(e) => setFormData({...formData, samity_name: e.target.value})}
                                                placeholder="Enter Samity Name"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Samity Code <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.samity_code}
                                                    onChange={(e) => setFormData({...formData, samity_code: e.target.value})}
                                                    placeholder="e.g. SAM-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Samity Type</label>
                                                <input
                                                    type="text"
                                                    className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.samity_type}
                                                    onChange={(e) => setFormData({...formData, samity_type: e.target.value})}
                                                    placeholder="Default: P"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Monthly Fee</label>
                                                <input
                                                    type="number"
                                                    className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.monthly_subscription_fee}
                                                    onChange={(e) => setFormData({...formData, monthly_subscription_fee: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Penalty Amt</label>
                                                <input
                                                    type="number"
                                                    className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.penalty_amount}
                                                    onChange={(e) => setFormData({...formData, penalty_amount: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Cutoff Day</label>
                                                <input
                                                    type="number"
                                                    max="31"
                                                    min="1"
                                                    className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.penalty_late_date}
                                                    onChange={(e) => setFormData({...formData, penalty_late_date: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700">Samity Address <span className="text-red-500">*</span></label>
                                            <textarea
                                                required
                                                rows="3"
                                                className="block p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.samity_address}
                                                onChange={(e) => setFormData({...formData, samity_address: e.target.value})}
                                                placeholder="Enter full address"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center items-center px-4 py-2 w-full text-base font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        <Save className="mr-2 w-4 h-4" />
                                        {profile ? 'Update Profile' : 'Create Profile'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
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

export default SamityProfile;