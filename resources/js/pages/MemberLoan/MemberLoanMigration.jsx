import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import LoadingButton from '../../components/LoadingButton';

const MemberLoanMigration = () => {
    const { hasPermission } = useAuth();
    const [products, setProducts] = useState([]);
    const [sampleUrl, setSampleUrl] = useState('');
    const [requiredHeaders, setRequiredHeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        product_id: '',
        migration_file: null,
    });

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member-loan-migrations/meta');
            setProducts(response.data?.products || []);
            setSampleUrl(response.data?.sample_url || '');
            setRequiredHeaders(response.data?.required_headers || []);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to load migration page data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            setDownloading(true);
            const response = await api.get('/member-loan-migrations/template', {
                responseType: 'blob',
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `member-loan-migration-template-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to download template', 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.product_id || !formData.migration_file) {
            Swal.fire('Error', 'Product and migration file are required.', 'error');
            return;
        }

        const payload = new FormData();
        payload.append('product_id', formData.product_id);
        payload.append('migration_file', formData.migration_file);

        setSubmitting(true);
        try {
            const response = await api.post('/member-loan-migrations', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data);
            setFormData((prev) => ({
                ...prev,
                migration_file: null,
            }));

            const fileInput = document.getElementById('member-loan-migration-file');
            if (fileInput) {
                fileInput.value = '';
            }

            Swal.fire('Success', response.data?.message || 'Legacy member loan imported successfully', 'success');
        } catch (error) {
            const errorList = error.response?.data?.errors;
            const message = Array.isArray(errorList)
                ? errorList.join('\n')
                : (error.response?.data?.message || 'Migration failed');
            Swal.fire('Error', message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasPermission('member.loan.migration.view')) {
        return <div className="p-6 text-red-500">Permission denied</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Member Loan Migration</h1>
                    <p className="text-sm text-gray-500">
                        Puraton member loan data template-e likhe upload korun. System member_id ar member_name verify kore legacy loan account create korbe.
                    </p>
                </div>
                {sampleUrl && (
                    <LoadingButton
                        onClick={handleDownloadTemplate}
                        isLoading={downloading}
                        loadingText="Downloading..."
                        className="inline-flex justify-center items-center px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                        Download Sample Excel (CSV)
                    </LoadingButton>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">Upload Legacy Member Loan File</h2>

                        <div className="p-4 mb-5 text-sm text-blue-800 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="font-medium">Step by step</div>
                            <div className="mt-2">1. Sample template download korun.</div>
                            <div>2. Excel-e data fill up korun and CSV hishebe save korun.</div>
                            <div>3. Member Loan product select korun.</div>
                            <div>4. File upload korle valid row-gula ekshathe import hobe.</div>
                            <div>5. Kon row-te problem thakle kono data save hobe na, age error dekhabe.</div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Member Loan Product</label>
                                    <select
                                        value={formData.product_id}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
                                        className="px-3 py-2 w-full rounded-lg border"
                                        disabled={loading}
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.product_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Migration File</label>
                                    <input
                                        id="member-loan-migration-file"
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(e) => setFormData((prev) => ({ ...prev, migration_file: e.target.files?.[0] || null }))}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Excel theke CSV format-e save kore upload korun.</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                {hasPermission('member.loan.migration.create') && (
                                    <LoadingButton
                                        type="submit"
                                        isLoading={submitting}
                                        loadingText="Importing..."
                                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Upload Legacy Loans
                                    </LoadingButton>
                                )}
                            </div>
                        </form>
                    </div>

                    {result && (
                        <div className="p-6 mt-6 bg-white rounded-lg shadow">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">Import Result</h2>
                            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="text-sm text-emerald-700">Imported Accounts</div>
                                    <div className="text-2xl font-bold text-emerald-900">{result.imported_count || 0}</div>
                                </div>
                                <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
                                    <div className="text-sm text-slate-600">Message</div>
                                    <div className="font-medium text-slate-900">{result.message}</div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Account</th>
                                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Member</th>
                                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Samity</th>
                                            <th className="px-4 py-3 text-xs font-medium text-right text-gray-500 uppercase">Outstanding</th>
                                            <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {(result.accounts || []).map((account) => (
                                            <tr key={account.id}>
                                                <td className="px-4 py-3 text-sm text-gray-700">{account.account_no}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{account.member?.member_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{account.samity?.samity_name}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-700">{account.total_outstanding}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{account.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-3 text-lg font-semibold text-gray-800">Required Columns</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            {requiredHeaders.map((header) => (
                                <div key={header} className="px-3 py-2 bg-gray-50 rounded-lg border">
                                    {header}
                                </div>
                            ))}
                            {!requiredHeaders.length && <div>Loading...</div>}
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-lg shadow">
                        <h2 className="mb-3 text-lg font-semibold text-gray-800">Import Rules</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div>- `member_id` must exist in current member list.</div>
                            <div>- `member_name` template-er sathe system data match korte hobe.</div>
                            <div>- `total_interest_accrued - total_interest_paid` diye current interest due dhora hobe.</div>
                            <div>- Same member, disbursed date, original principal duplicate hole import reject hobe.</div>
                            <div>- Migration sudhu opening balance account create korbe, kono old accounting voucher post korbe na.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberLoanMigration;
