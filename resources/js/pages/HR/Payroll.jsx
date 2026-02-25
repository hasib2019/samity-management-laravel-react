import React from 'react';
import { Link } from 'react-router-dom';

const Payroll = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Payroll</h2>
                <div className="flex gap-2">
                    <Link to="#" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Generate Payroll</Link>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-3">Payroll Periods</h3>
                    <div className="text-gray-500">Periods list will appear here.</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-3">Recent Runs</h3>
                    <div className="text-gray-500">Recent payroll runs will appear here.</div>
                </div>
            </div>
        </div>
    );
};

export default Payroll;
