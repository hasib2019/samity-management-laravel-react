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
import DepositMoney from './pages/Accounts/DepositMoney';
import WithdrawMoney from './pages/Accounts/WithdrawMoney';
import DepositRequest from './pages/Accounts/DepositRequest';
import WithdrawRequest from './pages/Accounts/WithdrawRequest';
import GlAccountSetup from './pages/Setup/GlAccountSetup';
import ProductSetup from './pages/Setup/ProductSetup';
import GlMappingType from './pages/Setup/GlMappingType';
import GlMapping from './pages/Setup/GlMapping';
import PaymentVoucher from './pages/Vouchers/PaymentVoucher';
import ReceivedVoucher from './pages/Vouchers/ReceivedVoucher';
import ContraVoucher from './pages/Vouchers/ContraVoucher';
import JournalVoucher from './pages/Vouchers/JournalVoucher';

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
                        path="/deposit-money" 
                        element={
                            <ProtectedRoute>
                                <DepositMoney />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/withdraw-money" 
                        element={
                            <ProtectedRoute>
                                <WithdrawMoney />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/deposit-request" 
                        element={
                            <ProtectedRoute>
                                <DepositRequest />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/withdraw-request" 
                        element={
                            <ProtectedRoute>
                                <WithdrawRequest />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/gl-setup" 
                        element={
                            <ProtectedRoute>
                                <GlAccountSetup />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/product-setup" 
                        element={
                            <ProtectedRoute>
                                <ProductSetup />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/gl-mapping-type" 
                        element={
                            <ProtectedRoute>
                                <GlMappingType />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/gl-mapping" 
                        element={
                            <ProtectedRoute>
                                <GlMapping />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/payment-voucher" 
                        element={
                            <ProtectedRoute>
                                <PaymentVoucher />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/received-voucher" 
                        element={
                            <ProtectedRoute>
                                <ReceivedVoucher />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/contra-voucher" 
                        element={
                            <ProtectedRoute>
                                <ContraVoucher />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/journal-voucher" 
                        element={
                            <ProtectedRoute>
                                <JournalVoucher />
                            </ProtectedRoute>
                        } 
                    />
                    {/* Removed routes for Accounts & SavingsProduct */}
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
