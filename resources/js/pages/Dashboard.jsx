import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
                <p className="text-gray-600">This is your RBAC dashboard overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Roles</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Sessions</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">System Status</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">Online</p>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Roles & Permissions</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Roles:</h4>
                        <div className="flex flex-wrap gap-2">
                            {user?.roles.map(role => (
                                <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                    {role.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
