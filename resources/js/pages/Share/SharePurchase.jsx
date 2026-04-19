import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { ShoppingCart, User, Calendar, DollarSign, Search, FileText, PieChart } from 'lucide-react';

const SharePurchase = () => {
    const [samities, setSamities] = useState([]);
    const [members, setMembers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        samity_id: '',
        member_id: '',
        product_id: '',
        tran_date: new Date().toISOString().split('T')[0],
        quantity: '',
        face_value: '',
        remarks: ''
    });

    useEffect(() => {
        fetchSamities();
        fetchProducts();
    }, []);

    const fetchSamities = async () => {
        try {
            const response = await api.get('/global/samities');
            setSamities(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (err) {
            console.error('Error fetching samities', err);
        }
    };

    const fetchMembers = async (samityId) => {
        try {
            const response = await api.get(`/global/members?samity_id=${samityId}`);
            setMembers(response.data || []);
        } catch (err) {
            console.error('Error fetching members', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products?type=share');
            setProducts(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (err) {
            console.error('Error fetching products', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'samity_id') {
            fetchMembers(value);
            setFormData(prev => ({ ...prev, member_id: '' }));
        }

        if (name === 'product_id') {
            const prod = products.find(p => p.id == value);
            if (prod) {
                setFormData(prev => ({ ...prev, face_value: prod.face_value || '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await api.post('/share-purchase', formData);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: response.data.message,
                timer: 2000,
                showConfirmButton: false
            });
            setFormData({
                samity_id: '',
                member_id: '',
                product_id: '',
                tran_date: new Date().toISOString().split('T')[0],
                quantity: '',
                face_value: '',
                remarks: ''
            });
        } catch (err) {
            console.error('Error recording purchase', err);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: err.response?.data?.message || 'Transaction failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = (formData.quantity && formData.face_value) ? (formData.quantity * formData.face_value).toFixed(2) : '0.00';

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center gap-3 text-white">
                            <ShoppingCart className="w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold">Share Purchase</h1>
                                <p className="text-blue-100 text-sm">Record new share purchase for members</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Samity & Member */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Samity</label>
                                    <select
                                        name="samity_id"
                                        value={formData.samity_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Choose Samity...</option>
                                        {samities.map(s => <option key={s.id} value={s.id}>{s.samity_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Member</label>
                                    <select
                                        name="member_id"
                                        value={formData.member_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                        disabled={!formData.samity_id}
                                    >
                                        <option value="">Choose Member...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.member_name} ({m.member_code})</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Product & Date */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Share Product</label>
                                    <select
                                        name="product_id"
                                        value={formData.product_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Choose Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            name="tran_date"
                                            value={formData.tran_date}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="Enter Quantity"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Face Value</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                    <input
                                        type="number"
                                        name="face_value"
                                        value={formData.face_value}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-600"
                                        required
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-blue-600 font-bold">৳</span>
                                    <input
                                        type="text"
                                        value={totalAmount}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 font-bold outline-none"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks (Optional)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    placeholder="Add any notes here..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Recording Transaction...' : (
                                    <>
                                        <PieChart size={24} />
                                        Record Share Purchase
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SharePurchase;
