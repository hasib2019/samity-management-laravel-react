import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const MemberLoanDisbursement = () => {
    const { hasPermission } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-disbursements');
            setApplications(response.data || []);
        } catch (error) {
            Swal.fire('Error', 'Failed to load approved applications', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDisburse = async (application) => {
        try {
            await api.post('/member-loan-disbursements', {
                application_id: application.id,
                disbursed_date: new Date().toISOString().split('T')[0],
                remarks: 'Member loan disbursement',
            });
            Swal.fire('Success', 'Loan disbursed successfully', 'success');
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Disbursement failed', 'error');
        }
    };

    if (!hasPermission('member.loan.disbursement.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Member Loan Disbursement</h1>
                <p className="text-sm text-gray-500">Disburse approved member loans and generate accounts.</p>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Application</th>
                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Approved</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">EMI</th>
                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-4 py-6 text-center">Loading...</td></tr>
                        ) : applications.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No approved member loan application found.</td></tr>
                        ) : applications.map((application) => (
                            <tr key={application.id}>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div>{application.application_no}</div>
                                    <div className="text-xs text-gray-400">{application.approved_date}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{application.member?.member_name}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{application.approved_amount}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{application.scheduled_emi}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    {hasPermission('member.loan.disbursement.create') && (
                                        <button onClick={() => handleDisburse(application)} className="text-blue-600 hover:text-blue-800">Disburse</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MemberLoanDisbursement;
