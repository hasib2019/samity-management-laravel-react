import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, Clock, FileText, Settings } from 'lucide-react';

const HRDashboard = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">HR Dashboard</h2>
                    <p className="text-gray-600">Overview and quick access</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link to="/hr/employees" className="group flex items-center justify-between p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition">
                    <div className="flex items-center gap-3">
                        <Users className="text-blue-600" size={20} />
                        <span className="font-medium text-gray-800">Employees</span>
                    </div>
                </Link>
                <Link to="/hr/attendance" className="group flex items-center justify-between p-4 rounded-lg border hover:border-emerald-300 hover:bg-emerald-50 transition">
                    <div className="flex items-center gap-3">
                        <Clock className="text-emerald-600" size={20} />
                        <span className="font-medium text-gray-800">Attendance</span>
                    </div>
                </Link>
                <Link to="/hr/leave" className="group flex items-center justify-between p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50 transition">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-rose-600" size={20} />
                        <span className="font-medium text-gray-800">Leave</span>
                    </div>
                </Link>
                <Link to="/hr/payroll" className="group flex items-center justify-between p-4 rounded-lg border hover:border-amber-300 hover:bg-amber-50 transition">
                    <div className="flex items-center gap-3">
                        <Briefcase className="text-amber-600" size={20} />
                        <span className="font-medium text-gray-800">Payroll</span>
                    </div>
                </Link>
                <Link to="/hr/reports" className="group flex items-center justify-between p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition">
                    <div className="flex items-center gap-3">
                        <FileText className="text-purple-600" size={20} />
                        <span className="font-medium text-gray-800">Reports</span>
                    </div>
                </Link>
                <Link to="/hr/settings" className="group flex items-center justify-between p-4 rounded-lg border hover:border-gray-300 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                        <Settings className="text-gray-600" size={20} />
                        <span className="font-medium text-gray-800">Settings</span>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default HRDashboard;
