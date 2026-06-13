import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users/UserList';
import RoleList from './pages/Roles/RoleList';
import PermissionList from './pages/Permissions/PermissionList';
import MenuList from './pages/Menus/MenuList';
import SamityProfile from './pages/Samity/SamityProfile';
import GeneralSettings from './pages/Settings/GeneralSettings';
import MemberProfile from './pages/Member/MemberProfile';
import DepositMoney from './pages/Accounts/DepositMoney';
import WithdrawMoney from './pages/Accounts/WithdrawMoney';
import DepositRequest from './pages/Accounts/DepositRequest';
import WithdrawRequest from './pages/Accounts/WithdrawRequest';
import GlAccountSetup from './pages/Setup/GlAccountSetup';
import ProductSetup from './pages/Setup/ProductSetup';
import GlMappingType from './pages/Setup/GlMappingType';
import GlMapping from './pages/Setup/GlMapping';
import CodeMasterList from './pages/Setup/CodeMaster/CodeMasterList';
import PaymentVoucher from './pages/Vouchers/PaymentVoucher';
import ReceivedVoucher from './pages/Vouchers/ReceivedVoucher';
import ContraVoucher from './pages/Vouchers/ContraVoucher';
import JournalVoucher from './pages/Vouchers/JournalVoucher';
import LoanApplication from './pages/Loans/LoanApplication';
import LoanRepayment from './pages/Loans/LoanRepayment';
import LoanClosing from './pages/Loans/LoanClosing';
import LoanDisbursement from './pages/Loans/LoanDisbursement';
import DpsApplication from './pages/DPS/DpsApplication';
import DpsCollection from './pages/DPS/DpsCollection';
import DpsClosing from './pages/DPS/DpsClosing';
import DpsList from './pages/DPS/DpsList';
import FdrApplication from './pages/FDR/FdrApplication';
import FdrCollection from './pages/FDR/FdrCollection';
import FdrList from './pages/FDR/FdrList';
import FdrClosing from './pages/FDR/FdrClosing';
import SharePurchase from './pages/Share/SharePurchase';
import ShareSale from './pages/Share/ShareSale';
import ShareList from './pages/Share/ShareList';
import ShareTransfer from './pages/Share/ShareTransfer';
import ProjectDeclaration from './pages/Project/ProjectDeclaration';
import ProjectShareSale from './pages/Project/ProjectShareSale';
import ProjectClosing from './pages/Project/ProjectClosing';
import ProjectInvestors from './pages/Project/ProjectInvestors';
import MemberLoanApplication from './pages/MemberLoan/MemberLoanApplication';
import MemberLoanDisbursement from './pages/MemberLoan/MemberLoanDisbursement';
import MemberLoanRepayment from './pages/MemberLoan/MemberLoanRepayment';
import MemberLoanClosing from './pages/MemberLoan/MemberLoanClosing';
import MemberLoanAccounts from './pages/MemberLoan/MemberLoanAccounts';
import MemberLoanMigration from './pages/MemberLoan/MemberLoanMigration';
import CommitteeType from './pages/Committee/CommitteeType';
import CommitteeList from './pages/Committee/CommitteeList';
import CommitteeReport from './pages/Committee/CommitteeReport';

// Reports
import AccountStatement from './pages/Reports/AccountStatement';
import AccountBalance from './pages/Reports/AccountBalance';
import LoanReport from './pages/Reports/LoanReport';
import LoanDueReport from './pages/Reports/LoanDueReport';
import TransactionReport from './pages/Reports/TransactionReport';
import ExpenseReport from './pages/Reports/ExpenseReport';
import RevenueReport from './pages/Reports/RevenueReport';
import BalanceSheet from './pages/Reports/BalanceSheet';
import CashFlow from './pages/Reports/CashFlow';
import TrialBalance from './pages/Reports/TrialBalance';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

const routePermissions = {
    '/dashboard': 'dashboard.view',
    '/general-settings': 'general.settings.view',
    '/user-management-system': 'user.view',
    '/users': 'user.view',
    '/roles': 'role.view',
    '/permissions': 'permission.view',
    '/menu-management': 'menu.management.view',
    '/samity-profile': 'samity.profile.view',
    '/member-profile': 'member.view',
    '/deposit-money': 'deposit.money.view',
    '/withdraw-money': 'withdraw.money.view',
    '/deposit-request': 'deposit.request.view',
    '/withdraw-request': 'withdraw.request.view',
    '/gl-setup': 'gl.setup.view',
    '/product-setup': 'product.setup.view',
    '/gl-mapping-type': 'gl.mapping.type.view',
    '/gl-mapping': 'gl.mapping.view',
    '/code-master': 'code.master.view',
    '/loan-application': 'loan.application.view',
    '/loan-disbursement': 'loan.disbursement.view',
    '/loan-repayment': 'loan.repayment.view',
    '/loan-closing': 'loan.closing.view',
    '/payment-voucher': 'voucher.payment.create',
    '/received-voucher': 'voucher.received.create',
    '/contra-voucher': 'voucher.contra.create',
    '/journal-voucher': 'voucher.journal.create',
    '/dps-account': 'dps.account.view',
    '/dps-collection': 'dps.collection.view',
    '/dps-closing': 'dps.closing.view',
    '/dps-list': 'dps.list.view',
    '/fdr-account': ['fdr.account.view', 'fdr.application.view'],
    '/fdr-collection': 'fdr.collection.view',
    '/fdr-closing': 'fdr.closing.view',
    '/fdr-list': 'fdr.list.view',
    '/share-purchase': 'share.purchase.create',
    '/share-sale': 'share.sale.create',
    '/share-transfer': 'share.transfer.create',
    '/share-list': 'share.list.view',
    '/project-declarations': 'project.declaration.view',
    '/project-share-sales': 'project.share.sale.view',
    '/project-closings': 'project.closing.view',
    '/project-investors': 'project.investor.view',
    '/member-loan-application': 'member.loan.application.view',
    '/member-loan-disbursement': 'member.loan.disbursement.view',
    '/member-loan-repayment': 'member.loan.repayment.view',
    '/member-loan-closing': 'member.loan.closing.view',
    '/member-loan-accounts': 'member.loan.account.view',
    '/member-loan-migration': 'member.loan.migration.view',
    '/committee-types': 'committee.type.view',
    '/committees-list': 'committee.view',
    '/committee-reports': 'committee.view',
    '/account-statement': 'account-statement.view',
    '/account-balance': 'account-balance.view',
    '/loan-report': 'loan-report.view',
    '/loan-due-report': 'loan-due-report.view',
    '/transaction-report': 'transaction-report.view',
    '/expense-report': 'expense-report.view',
    '/revenue-report': 'revenue-report.view',
    '/balance-sheet': 'balance-sheet.view',
    '/cash-flow': 'cash-flow.view',
    '/trial-balance': 'trial-balance.view',
};

const AccessDenied = () => (
    <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
            <p className="mt-3 text-sm text-gray-600">
                You do not have permission to access this module.
            </p>
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { user, loading, hasAnyPermission } = useAuth();
    const location = useLocation();
    const requiredPermission = routePermissions[location.pathname];

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredPermission && !hasAnyPermission(requiredPermission)) {
        return (
            <DashboardLayout>
                <AccessDenied />
            </DashboardLayout>
        );
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
                        path="/general-settings"
                        element={
                            <ProtectedRoute>
                                <GeneralSettings />
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
                        path="/code-master" 
                        element={
                            <ProtectedRoute>
                                <CodeMasterList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/loan-application" 
                        element={
                            <ProtectedRoute>
                                <LoanApplication />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/loan-disbursement" 
                        element={
                            <ProtectedRoute>
                                <LoanDisbursement />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/loan-repayment" 
                        element={
                            <ProtectedRoute>
                                <LoanRepayment />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/loan-closing" 
                        element={
                            <ProtectedRoute>
                                <LoanClosing />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Accounting Routes */}
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

                    {/* DPS Management */}
                    <Route 
                        path="/dps-account" 
                        element={
                            <ProtectedRoute>
                                <DpsApplication />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dps-collection" 
                        element={
                            <ProtectedRoute>
                                <DpsCollection />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dps-closing" 
                        element={
                            <ProtectedRoute>
                                <DpsClosing />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dps-list" 
                        element={
                            <ProtectedRoute>
                                <DpsList />
                            </ProtectedRoute>
                        } 
                    />

                    {/* FDR Management */}
                    <Route 
                        path="/fdr-account" 
                        element={
                            <ProtectedRoute>
                                <FdrApplication />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/fdr-collection" 
                        element={
                            <ProtectedRoute>
                                <FdrCollection />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/fdr-closing" 
                        element={
                            <ProtectedRoute>
                                <FdrClosing />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/fdr-list" 
                        element={
                            <ProtectedRoute>
                                <FdrList />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Share Management */}
                    <Route 
                        path="/share-purchase" 
                        element={
                            <ProtectedRoute>
                                <SharePurchase />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/share-sale" 
                        element={
                            <ProtectedRoute>
                                <ShareSale />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/share-transfer" 
                        element={
                            <ProtectedRoute>
                                <ShareTransfer />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/share-list" 
                        element={
                            <ProtectedRoute>
                                <ShareList />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Project Investment */}
                    <Route 
                        path="/project-declarations" 
                        element={
                            <ProtectedRoute>
                                <ProjectDeclaration />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/project-share-sales" 
                        element={
                            <ProtectedRoute>
                                <ProjectShareSale />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/project-closings" 
                        element={
                            <ProtectedRoute>
                                <ProjectClosing />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/project-investors" 
                        element={
                            <ProtectedRoute>
                                <ProjectInvestors />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Member Loan Management */}
                    <Route 
                        path="/member-loan-application" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanApplication />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-loan-disbursement" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanDisbursement />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-loan-repayment" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanRepayment />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-loan-closing" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanClosing />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-loan-accounts" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanAccounts />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/member-loan-migration" 
                        element={
                            <ProtectedRoute>
                                <MemberLoanMigration />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Committee Management */}
                    <Route 
                        path="/committee-types" 
                        element={
                            <ProtectedRoute>
                                <CommitteeType />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/committees-list" 
                        element={
                            <ProtectedRoute>
                                <CommitteeList />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/committee-reports" 
                        element={
                            <ProtectedRoute>
                                <CommitteeReport />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Removed routes for Accounts & SavingsProduct */}
                    {/* Reports Routes */}
                    <Route path="/account-statement" element={<ProtectedRoute><AccountStatement /></ProtectedRoute>} />
                    <Route path="/account-balance" element={<ProtectedRoute><AccountBalance /></ProtectedRoute>} />
                    <Route path="/loan-report" element={<ProtectedRoute><LoanReport /></ProtectedRoute>} />
                    <Route path="/loan-due-report" element={<ProtectedRoute><LoanDueReport /></ProtectedRoute>} />
                    <Route path="/transaction-report" element={<ProtectedRoute><TransactionReport /></ProtectedRoute>} />
                    <Route path="/expense-report" element={<ProtectedRoute><ExpenseReport /></ProtectedRoute>} />
                    <Route path="/revenue-report" element={<ProtectedRoute><RevenueReport /></ProtectedRoute>} />
                    <Route path="/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
                    <Route path="/cash-flow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
                    <Route path="/trial-balance" element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />

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
