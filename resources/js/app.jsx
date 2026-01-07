import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users/UserList';
import RoleList from './pages/Roles/RoleList';
import PermissionList from './pages/Permissions/PermissionList';
import MenuList from './pages/Menus/MenuList';
import SamityProfile from './pages/Samity/SamityProfile';
import MemberProfile from './pages/Member/MemberProfile';
import SavingsProduct from './pages/SavingsProduct/SavingsProduct';
import SavingsAccountList from './pages/Accounts/SavingsAccountList';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/user-management-system" 
                        element={
                            <ProtectedRoute>
                                <UserList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/users" 
                        element={
                            <ProtectedRoute>
                                <UserList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/roles" 
                        element={
                            <ProtectedRoute>
                                <RoleList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/permissions" 
                        element={
                            <ProtectedRoute>
                                <PermissionList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/menu-management" 
                        element={
                            <ProtectedRoute>
                                <MenuList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/samity-profile" 
                        element={
                            <ProtectedRoute>
                                <SamityProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-profile" 
                        element={
                            <ProtectedRoute>
                                <MemberProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/accounts-types" 
                        element={
                            <ProtectedRoute>
                                <SavingsProduct />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/all-accounts" 
                        element={
                            <ProtectedRoute>
                                <SavingsAccountList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

if (document.getElementById('app')) {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
}
