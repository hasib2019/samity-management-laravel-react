import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import LoadingButton from '../../components/LoadingButton';

const initialForm = {
    disbursed_date: new Date().toISOString().split('T')[0],
    remarks: 'Member loan disbursement',
};

const addDays = (dateString, days) => {
    if (!dateString) return '-';
    const date = new Date(`${String(dateString).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '-';
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MemberLoanDisbursement = () => {
    const { hasPermission } = useAuth();
    const [applications, setApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const next30DayDate = useMemo(
        () => addDays(formData.disbursed_date, 30),
        [formData.disbursed_date]
    );

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

    const handleSelectApplication = (application) => {
        setSelectedApplication(application);
        setFormData({
            disbursed_date: new Date().toISOString().split('T')[0],
            remarks: `Member loan disbursement for ${application.application_no}`,
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDisburse = async (e) => {
        e.preventDefault();

        if (!selectedApplication) {
            Swal.fire('Error', 'Age ekta approved application select korun', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/member-loan-disbursements', {
                application_id: selectedApplication.id,
                disbursed_date: formData.disbursed_date,
                remarks: formData.remarks,
            });
            Swal.fire('Success', 'Loan disbursed successfully', 'success');
            setSelectedApplication(null);
            setFormData(initialForm);
            fetchApplications();
        } catch (error) {
            const errors = error.response?.data?.errors;
            Swal.fire('Error', errors ? Object.values(errors).flat().join('\n') : (error.response?.data?.message || 'Disbursement failed'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasPermission('member.loan.disbursement.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Member Loan Disbursement</h1>
                <p className="text-sm text-gray-500">Disburse approved member loans only when cash/bank balance is available.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="overflow-hidden bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Application</th>
                                <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Approved</th>
                                <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Interest Rule</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center">Loading...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">No approved member loan application found.</td></tr>
                            ) : applications.map((application) => (
                                <tr key={application.id} className={`cursor-pointer hover:bg-gray-50 ${selectedApplication?.id === application.id ? 'bg-blue-50' : ''}`} onClick={() => handleSelectApplication(application)}>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{application.application_no}</div>
                                        <div className="text-xs text-gray-400">{String(application.approved_date || '').slice(0, 10)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{application.member?.member_name}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{application.approved_amount}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{application.monthly_interest_rate}% / 30 days</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Loan Disbursement Entry</h2>
                    {selectedApplication ? (
                        <form onSubmit={handleDisburse} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Application No:</span> {selectedApplication.application_no}</div>
                                <div><span className="font-medium">Member:</span> {selectedApplication.member?.member_name || '-'}</div>
                                <div><span className="font-medium">Approved Date:</span> {String(selectedApplication.approved_date || '').slice(0, 10) || '-'}</div>
                                <div><span className="font-medium">Samity:</span> {selectedApplication.samity?.samity_name || '-'}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 text-sm border rounded-lg bg-gray-50">
                                <div><span className="font-medium">Approved Amount:</span> {selectedApplication.approved_amount}</div>
                                <div><span className="font-medium">Interest Rule:</span> {selectedApplication.monthly_interest_rate}% / 30 days</div>
                                <div><span className="font-medium">Product:</span> {selectedApplication.product?.product_name || '-'}</div>
                                <div><span className="font-medium">Purpose:</span> {selectedApplication.purpose || '-'}</div>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Disbursement Date</label>
                                <input type="date" name="disbursed_date" value={formData.disbursed_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 text-sm border rounded-lg bg-blue-50">
                                <div><span className="font-medium">Disbursement Amount:</span> {selectedApplication.approved_amount}</div>
                                <div><span className="font-medium">Next 30 Day Date:</span> {next30DayDate}</div>
                            </div>

                            <div className="p-3 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                                Disbursement date change korle account-er first 30 day accrual date automatically change hobe. Cash/bank available thaklei disbursement complete hobe.
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium">Remarks</label>
                                <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
                            </div>

                            {hasPermission('member.loan.disbursement.create') && (
                                <LoadingButton type="submit" isLoading={submitting} loadingText="Disbursing..." className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    Disburse Loan
                                </LoadingButton>
                            )}
                        </form>
                    ) : (
                        <div className="text-sm text-gray-500">Bam pas theke ekta approved application select korle full disbursement screen dekhabe.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberLoanDisbursement;
