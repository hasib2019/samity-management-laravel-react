import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, CreditCard, Activity, DollarSign, FileText } from 'lucide-react';

const MemberViewModal = ({ isOpen, onClose, member, STORAGE_URL }) => {
    if (!isOpen || !member) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        return `${STORAGE_URL}${path}`;
    };

    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
                <div className="fixed inset-0 backdrop-blur-sm transition-opacity bg-black/50" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full z-[111]">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-800" id="modal-title">
                            Member Details
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
                        
                        {/* Profile Header Section */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8 pb-8 border-b border-gray-100">
                            <div className="flex-shrink-0 flex justify-center md:justify-start">
                                {member.member_photo ? (
                                    <img 
                                        src={getImageUrl(member.member_photo)} 
                                        alt={member.member_name} 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg">
                                        <User className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-2xl font-bold text-gray-900">{member.member_name}</h2>
                                {member.member_name_bangla && <p className="text-gray-500 font-medium">{member.member_name_bangla}</p>}
                                <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        Code: {member.member_code || 'N/A'}
                                    </span>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {member.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {member.is_samity_member && (
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                            Samity Member
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                                    <div className="flex items-center justify-center md:justify-start">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" /> {member.mobile || 'N/A'}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" /> {member.email || 'N/A'}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start">
                                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" /> NID: {member.nid || 'N/A'}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" /> Join Date: {formatDate(member.member_admission_date)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Personal Information */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <User className="w-5 h-5 mr-2 text-blue-600" /> Personal Information
                                </h4>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Father's Name</dt>
                                        <dd className="font-medium text-gray-900">{member.father_name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Mother's Name</dt>
                                        <dd className="font-medium text-gray-900">{member.mother_name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Spouse Name</dt>
                                        <dd className="font-medium text-gray-900">{member.spouse_name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Date of Birth</dt>
                                        <dd className="font-medium text-gray-900">{formatDate(member.dob)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Gender</dt>
                                        <dd className="font-medium text-gray-900">{member.gender_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Marital Status</dt>
                                        <dd className="font-medium text-gray-900">{member.marital_status_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Religion</dt>
                                        <dd className="font-medium text-gray-900">{member.religion_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Education</dt>
                                        <dd className="font-medium text-gray-900">{member.education_level_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Occupation</dt>
                                        <dd className="font-medium text-gray-900">{member.occupation_id || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Organizational & Samity Info */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <Activity className="w-5 h-5 mr-2 text-blue-600" /> Organizational Info
                                </h4>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div className="col-span-1 sm:col-span-2">
                                        <dt className="text-gray-500">Samity Name</dt>
                                        <dd className="font-medium text-gray-900">{member.samity?.samity_name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Committee Organizer</dt>
                                        <dd className="font-medium text-gray-900">{member.committee_organizer === 'Y' ? 'Yes' : 'No'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Contact Person</dt>
                                        <dd className="font-medium text-gray-900">{member.committee_contact_person === 'Y' ? 'Yes' : 'No'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Signatory Person</dt>
                                        <dd className="font-medium text-gray-900">{member.committee_signatory_person === 'Y' ? 'Yes' : 'No'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Reference Samity</dt>
                                        <dd className="font-medium text-gray-900">{member.ref_samity_id || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Financial Info */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <DollarSign className="w-5 h-5 mr-2 text-blue-600" /> Financial Overview
                                </h4>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Share Amount</dt>
                                        <dd className="font-medium text-gray-900">{member.share_price || '0'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">No of Share</dt>
                                        <dd className="font-medium text-gray-900">{member.no_of_share || '0'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* System Info */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <FileText className="w-5 h-5 mr-2 text-blue-600" /> System Info
                                </h4>
                                <dl className="grid grid-cols-1 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Created By</dt>
                                        <dd className="font-medium text-gray-900">
                                            {member.creator?.name || 'N/A'} 
                                            <span className="text-xs text-gray-500 ml-2">({formatDate(member.created_at)})</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Updated By</dt>
                                        <dd className="font-medium text-gray-900">
                                            {member.updator?.name || 'N/A'}
                                            <span className="text-xs text-gray-500 ml-2">({formatDate(member.updated_at)})</span>
                                        </dd>
                                    </div>
                                    {member.user && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <dt className="text-gray-500">Linked User Account</dt>
                                            <dd className="font-medium text-gray-900">
                                                {member.user.name} ({member.user.email})
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                        </div>

                        {/* Savings Accounts Section */}
                        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <CreditCard className="w-5 h-5 mr-2 text-blue-600" /> Savings Accounts
                            </h4>
                            
                            {member.savings_accounts && member.savings_accounts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opened Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {member.savings_accounts.map((account) => (
                                                <tr key={account.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {account.account_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {account.product?.product_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {account.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {account.principal_amount || '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {account.current_balance}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {account.profit_balance || '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        {account.tenure_month ? `${account.tenure_month} Months` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(account.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No savings accounts found.
                                </div>
                            )}
                        </div>

                        {/* Documents Section (Optional) */}
                        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <FileText className="w-5 h-5 mr-2 text-blue-600" /> Documents
                            </h4>
                            <div className="flex gap-4">
                                {member.member_sign && (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">Signature</p>
                                        <img 
                                            src={getImageUrl(member.member_sign)} 
                                            alt="Signature" 
                                            className="h-20 object-contain border border-gray-200 rounded p-1"
                                        />
                                    </div>
                                )}
                                {member.nid_photo && (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">NID Photo</p>
                                        <img 
                                            src={getImageUrl(member.nid_photo)} 
                                            alt="NID" 
                                            className="h-20 object-contain border border-gray-200 rounded p-1"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberViewModal;
