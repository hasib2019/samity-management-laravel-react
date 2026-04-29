<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\SamityProfileController;
use App\Http\Controllers\Api\MemberInfoController;
use App\Http\Controllers\Api\GlobalController;
use App\Http\Controllers\Api\DepositRequestController;
use App\Http\Controllers\Api\WithdrawRequestController;
use App\Http\Controllers\Api\GlMappingTypeController;
use App\Http\Controllers\Api\LoanApplicationController;
use App\Http\Controllers\Api\MemberLoanAccountController;
use App\Http\Controllers\Api\MemberLoanApplicationController;
use App\Http\Controllers\Api\MemberLoanClosingController;
use App\Http\Controllers\Api\MemberLoanDisbursementController;
use App\Http\Controllers\Api\MemberLoanMigrationController;
use App\Http\Controllers\Api\MemberLoanRepaymentController;
use App\Http\Controllers\Api\ProjectClosingController;
use App\Http\Controllers\Api\ProjectDeclarationController;
use App\Http\Controllers\Api\ProjectShareSaleController;
use App\Http\Controllers\Api\ShareManagementController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Loan Application
    Route::apiResource('loan-applications', LoanApplicationController::class);
    Route::post('loan-applications/{id}/approve', [LoanApplicationController::class, 'approve']);
    Route::get('loan-applications/{id}/preview-schedule', [LoanApplicationController::class, 'previewSchedule']);

    // Loan Disbursement
    Route::get('loan-disbursements', [App\Http\Controllers\Api\LoanDisbursementController::class, 'index'])->middleware('permission:loan.disbursement.view');
    Route::post('loan-disbursements', [App\Http\Controllers\Api\LoanDisbursementController::class, 'store'])->middleware('permission:loan.disbursement.create');

    // Loan Repayment
    Route::get('loan-repayments', [App\Http\Controllers\Api\LoanRepaymentController::class, 'index'])->middleware('permission:loan.repayment.view');
    Route::post('loan-repayments', [App\Http\Controllers\Api\LoanRepaymentController::class, 'store'])->middleware('permission:loan.repayment.create');
    Route::get('loan-repayments/search', [App\Http\Controllers\Api\LoanRepaymentController::class, 'search'])->middleware('permission:loan.repayment.create');

    // Loan Closing
    Route::get('loan-closings/search', [App\Http\Controllers\Api\LoanClosingController::class, 'search'])->middleware('permission:loan.closing.view');
    Route::post('loan-closings', [App\Http\Controllers\Api\LoanClosingController::class, 'store'])->middleware('permission:loan.closing.create');

    // Member Loan Module
    Route::get('member-loan-applications', [MemberLoanApplicationController::class, 'index'])->middleware('permission:member.loan.application.view');
    Route::post('member-loan-applications', [MemberLoanApplicationController::class, 'store'])->middleware('permission:member.loan.application.create');
    Route::get('member-loan-applications/{id}', [MemberLoanApplicationController::class, 'show'])->middleware('permission:member.loan.application.view');
    Route::post('member-loan-applications/{id}/approve', [MemberLoanApplicationController::class, 'approve'])->middleware('permission:member.loan.application.approve');
    Route::post('member-loan-applications/{id}/reject', [MemberLoanApplicationController::class, 'reject'])->middleware('permission:member.loan.application.reject');

    Route::get('member-loan-disbursements', [MemberLoanDisbursementController::class, 'index'])->middleware('permission:member.loan.disbursement.view');
    Route::post('member-loan-disbursements', [MemberLoanDisbursementController::class, 'store'])->middleware('permission:member.loan.disbursement.create');

    Route::get('member-loan-repayments', [MemberLoanRepaymentController::class, 'index'])->middleware('permission:member.loan.repayment.view');
    Route::post('member-loan-repayments', [MemberLoanRepaymentController::class, 'store'])->middleware('permission:member.loan.repayment.create');

    Route::get('member-loan-closings', [MemberLoanClosingController::class, 'index'])->middleware('permission:member.loan.closing.view');
    Route::post('member-loan-closings', [MemberLoanClosingController::class, 'store'])->middleware('permission:member.loan.closing.create');

    Route::get('member-loan-accounts', [MemberLoanAccountController::class, 'index'])->middleware('permission:member.loan.account.view');
    Route::get('member-loan-accounts/{id}', [MemberLoanAccountController::class, 'show'])->middleware('permission:member.loan.account.view');
    Route::get('member-loan-accounts/{id}/balance', [MemberLoanAccountController::class, 'balance'])->middleware('permission:member.loan.balance.view');
    Route::get('member-loan-accounts/{id}/history', [MemberLoanAccountController::class, 'history'])->middleware('permission:member.loan.transaction.view');
    Route::get('member-loan-accounts/{id}/statement', [MemberLoanAccountController::class, 'statement'])->middleware('permission:member.loan.statement.view');
    Route::post('member-loan-accounts/{id}/accrue', [MemberLoanAccountController::class, 'accrue'])->middleware('permission:member.loan.accrual.run');
    Route::get('member-loan-migrations/template', [MemberLoanMigrationController::class, 'template'])->middleware('permission:member.loan.migration.view');
    Route::get('member-loan-migrations/meta', [MemberLoanMigrationController::class, 'meta'])->middleware('permission:member.loan.migration.view');
    Route::post('member-loan-migrations', [MemberLoanMigrationController::class, 'store'])->middleware('permission:member.loan.migration.create');

    // Global Routes (No specific permission required, just valid token)
    Route::get('/dashboard/user', [GlobalController::class, 'userDashboard']);
    Route::get('/global/samities', [GlobalController::class, 'samities']);
    Route::get('/global/members', [GlobalController::class, 'members']);
    Route::get('/global/members/{id}/accounts', [GlobalController::class, 'accounts']);

    // User Management
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:user.view');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:user.create');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:user.view');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:user.edit');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:user.delete');

    // Role Management
    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:role.view');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:role.create');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:role.view');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:role.edit');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:role.delete');

    // Permission Management
    Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:permission.view');
    Route::post('/permissions', [PermissionController::class, 'store'])->middleware('permission:permission.create');
    Route::get('/permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:permission.view');
    Route::put('/permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:permission.edit');
    Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:permission.delete');

    // Menu Management
    Route::get('/menus', [MenuController::class, 'index'])->middleware('permission:menu.management.view');
    Route::post('/menus', [MenuController::class, 'store'])->middleware('permission:menu.management.create');
    Route::get('/menus/{menu}', [MenuController::class, 'show'])->middleware('permission:menu.management.view');
    Route::put('/menus/{menu}', [MenuController::class, 'update'])->middleware('permission:menu.management.edit');
    Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->middleware('permission:menu.management.delete');

    // Samity Profile
    Route::get('/samity-profiles', [SamityProfileController::class, 'index'])->middleware('permission:samity-profile.view');
    Route::post('/samity-profiles', [SamityProfileController::class, 'store'])->middleware('permission:samity.profile.add');
    Route::get('/samity-profiles/{id}', [SamityProfileController::class, 'show'])->middleware('permission:samity-profile.view');
    Route::put('/samity-profiles/{id}', [SamityProfileController::class, 'update'])->middleware('permission:samity.profile.add');

    // Member Info
    Route::get('/members', [MemberInfoController::class, 'index'])->middleware('permission:member.view');
    Route::post('/members', [MemberInfoController::class, 'store'])->middleware('permission:member.create');
    Route::get('/members/{id}', [MemberInfoController::class, 'show'])->middleware('permission:member.view');
    Route::put('/members/{id}', [MemberInfoController::class, 'update'])->middleware('permission:member.edit');
    Route::post('/members/{id}/accounts', [MemberInfoController::class, 'storeAccount'])->middleware('permission:member.edit');
    Route::delete('/members/{id}', [MemberInfoController::class, 'destroy'])->middleware('permission:member.delete');

    // GL Account Management
    Route::post('/gl-accounts/sync', [App\Http\Controllers\Api\GlAccountController::class, 'sync'])->middleware('permission:gl.setup.sync');
    Route::get('/gl-accounts', [App\Http\Controllers\Api\GlAccountController::class, 'index'])->middleware('permission:gl.setup.view');
    Route::get('/gl-accounts/tree', [App\Http\Controllers\Api\GlAccountController::class, 'getTree'])->middleware('permission:gl.setup.view');
    Route::post('/gl-accounts', [App\Http\Controllers\Api\GlAccountController::class, 'store'])->middleware('permission:gl.setup.create');
    Route::get('/gl-accounts/{id}', [App\Http\Controllers\Api\GlAccountController::class, 'show'])->middleware('permission:gl.setup.view');
    Route::put('/gl-accounts/{id}', [App\Http\Controllers\Api\GlAccountController::class, 'update'])->middleware('permission:gl.setup.edit');
    Route::delete('/gl-accounts/{id}', [App\Http\Controllers\Api\GlAccountController::class, 'destroy'])->middleware('permission:gl.setup.delete');

    // Product Setup
    Route::get('/products', [App\Http\Controllers\Api\ProductController::class, 'index'])->middleware('permission:product.setup.view');
    Route::post('/products', [App\Http\Controllers\Api\ProductController::class, 'store'])->middleware('permission:product.setup.create');
    Route::get('/products/{id}', [App\Http\Controllers\Api\ProductController::class, 'show'])->middleware('permission:product.setup.view');
    Route::put('/products/{id}', [App\Http\Controllers\Api\ProductController::class, 'update'])->middleware('permission:product.setup.edit');
    Route::delete('/products/{id}', [App\Http\Controllers\Api\ProductController::class, 'destroy'])->middleware('permission:product.setup.delete');

    // Deposit Requests
    Route::get('/deposit-requests', [DepositRequestController::class, 'index']);
    Route::post('/deposit-requests', [DepositRequestController::class, 'store']);
    Route::get('/deposit-requests/{id}', [DepositRequestController::class, 'show']);
    Route::put('/deposit-requests/{id}', [DepositRequestController::class, 'update']);
    Route::delete('/deposit-requests/{id}', [DepositRequestController::class, 'destroy']);
    // Withdraw Requests
    Route::get('/withdraw-requests', [WithdrawRequestController::class, 'index']);
    Route::post('/withdraw-requests', [WithdrawRequestController::class, 'store']);
    Route::get('/withdraw-requests/{id}', [WithdrawRequestController::class, 'show']);
    Route::put('/withdraw-requests/{id}', [WithdrawRequestController::class, 'update']);
    Route::delete('/withdraw-requests/{id}', [WithdrawRequestController::class, 'destroy']);
    
    Route::get('/gl-mapping-types', [GlMappingTypeController::class, 'index']);
    Route::post('/gl-mapping-types', [GlMappingTypeController::class, 'store']);
    Route::get('/gl-mapping-types/{id}', [GlMappingTypeController::class, 'show']);
    Route::put('/gl-mapping-types/{id}', [GlMappingTypeController::class, 'update']);
    Route::delete('/gl-mapping-types/{id}', [GlMappingTypeController::class, 'destroy']);

    Route::get('/gl-mappings', [App\Http\Controllers\Api\GlMappingController::class, 'index']);
    Route::post('/gl-mappings', [App\Http\Controllers\Api\GlMappingController::class, 'store']);
    Route::get('/gl-mappings/{id}', [App\Http\Controllers\Api\GlMappingController::class, 'show']);
    Route::put('/gl-mappings/{id}', [App\Http\Controllers\Api\GlMappingController::class, 'update']);
    Route::delete('/gl-mappings/{id}', [App\Http\Controllers\Api\GlMappingController::class, 'destroy']);

    // Code Master Routes
    Route::post('/code-masters/sync', [App\Http\Controllers\Api\CodeMasterController::class, 'sync'])->middleware('permission:code.master.sync');
    Route::get('/code-masters', [App\Http\Controllers\Api\CodeMasterController::class, 'index']);
    Route::post('/code-masters', [App\Http\Controllers\Api\CodeMasterController::class, 'store'])->middleware('permission:code.master.create');
    Route::get('/code-masters/{codeMaster}', [App\Http\Controllers\Api\CodeMasterController::class, 'show'])->middleware('permission:code.master.view');
    Route::put('/code-masters/{codeMaster}', [App\Http\Controllers\Api\CodeMasterController::class, 'update'])->middleware('permission:code.master.edit');
    Route::delete('/code-masters/{codeMaster}', [App\Http\Controllers\Api\CodeMasterController::class, 'destroy'])->middleware('permission:code.master.delete');

    Route::get('/payment-voucher', [App\Http\Controllers\Api\PaymentVoucherController::class, 'index']);
    Route::post('/payment-voucher', [App\Http\Controllers\Api\PaymentVoucherController::class, 'store']);
    Route::get('/received-voucher', [App\Http\Controllers\Api\ReceivedVoucherController::class, 'index']);
    Route::post('/received-voucher', [App\Http\Controllers\Api\ReceivedVoucherController::class, 'store']);
    Route::get('/contra-voucher', [App\Http\Controllers\Api\ContraVoucherController::class, 'index']);
    Route::post('/contra-voucher', [App\Http\Controllers\Api\ContraVoucherController::class, 'store']);
    Route::get('/journal-voucher', [App\Http\Controllers\Api\JournalVoucherController::class, 'index']);
    Route::post('/journal-voucher', [App\Http\Controllers\Api\JournalVoucherController::class, 'store']);
    
    // Reports
    Route::get('/reports/trial-balance', [App\Http\Controllers\Api\ReportController::class, 'trialBalance']);
    Route::get('/reports/balance-sheet', [App\Http\Controllers\Api\ReportController::class, 'balanceSheet']);
    Route::get('/reports/cash-flow', [App\Http\Controllers\Api\ReportController::class, 'cashFlow']);
    Route::get('/reports/account-statement', [App\Http\Controllers\Api\ReportController::class, 'accountStatement']);
    Route::get('/reports/account-balance', [App\Http\Controllers\Api\ReportController::class, 'accountBalance']);
    Route::get('/reports/loan-report', [App\Http\Controllers\Api\ReportController::class, 'loanReport']);
    Route::get('/reports/loan-due-report', [App\Http\Controllers\Api\ReportController::class, 'loanDueReport']);
    Route::get('/reports/transaction-report', [App\Http\Controllers\Api\ReportController::class, 'transactionReport']);
    Route::get('/reports/expense-report', [App\Http\Controllers\Api\ReportController::class, 'expenseReport']);
    Route::get('/reports/revenue-report', [App\Http\Controllers\Api\ReportController::class, 'revenueReport']);

    // DPS Management
    Route::apiResource('dps-applications', App\Http\Controllers\Api\DpsApplicationController::class);
    Route::get('dps-collections/search', [App\Http\Controllers\Api\DpsCollectionController::class, 'search'])->middleware('permission:dps.collection.view');
    Route::post('dps-collections', [App\Http\Controllers\Api\DpsCollectionController::class, 'store'])->middleware('permission:dps.collection.create');
    
    // DPS Closing
    Route::get('dps-closings/search', [App\Http\Controllers\Api\DpsClosingController::class, 'search'])->middleware('permission:dps.closing.view');
    Route::post('dps-closings', [App\Http\Controllers\Api\DpsClosingController::class, 'store'])->middleware('permission:dps.closing.create');

    // FDR Management
    Route::apiResource('fdr-applications', App\Http\Controllers\Api\FdrApplicationController::class);
    
    // FDR Collections
    Route::get('fdr-collections/search', [App\Http\Controllers\Api\FdrCollectionController::class, 'search'])->middleware('permission:fdr.collection.view');
    Route::post('fdr-collections', [App\Http\Controllers\Api\FdrCollectionController::class, 'store'])->middleware('permission:fdr.collection.create');
    Route::get('fdr-collections', [App\Http\Controllers\Api\FdrCollectionController::class, 'index'])->middleware('permission:fdr.collection.view');
    Route::get('fdr-collections/{id}', [App\Http\Controllers\Api\FdrCollectionController::class, 'show'])->middleware('permission:fdr.collection.view');
    Route::put('fdr-collections/{id}', [App\Http\Controllers\Api\FdrCollectionController::class, 'update'])->middleware('permission:fdr.collection.edit');
    Route::delete('fdr-collections/{id}', [App\Http\Controllers\Api\FdrCollectionController::class, 'destroy'])->middleware('permission:fdr.collection.delete');
    Route::post('fdr-collections/generate-pending', [App\Http\Controllers\Api\FdrCollectionController::class, 'generatePendingCollections'])->middleware('permission:fdr.collection.create');
    
    // FDR Closing
    Route::get('fdr-closings/search', [App\Http\Controllers\Api\FdrClosingController::class, 'search'])->middleware('permission:fdr.closing.view');
    Route::get('fdr-closings', [App\Http\Controllers\Api\FdrClosingController::class, 'index'])->middleware('permission:fdr.closing.view');
    Route::post('fdr-closings', [App\Http\Controllers\Api\FdrClosingController::class, 'store'])->middleware('permission:fdr.closing.create');
    Route::get('fdr-closings/{id}', [App\Http\Controllers\Api\FdrClosingController::class, 'show'])->middleware('permission:fdr.closing.view');
    Route::put('fdr-closings/{id}', [App\Http\Controllers\Api\FdrClosingController::class, 'update'])->middleware('permission:fdr.closing.edit');
    Route::delete('fdr-closings/{id}', [App\Http\Controllers\Api\FdrClosingController::class, 'destroy'])->middleware('permission:fdr.closing.delete');

    // Share Management
    Route::get('share-accounts', [ShareManagementController::class, 'index'])->middleware('permission:share.list.view');
    Route::get('share-accounts/search', [ShareManagementController::class, 'search'])->middleware('permission:share.list.view');
    Route::post('share-purchase', [ShareManagementController::class, 'purchase'])->middleware('permission:share.purchase.create');
    Route::post('share-sale', [ShareManagementController::class, 'sale'])->middleware('permission:share.sale.create');
    Route::post('share-transfer', [ShareManagementController::class, 'transfer'])->middleware('permission:share.transfer.create');

    // Project Investment
    Route::get('project-declarations', [ProjectDeclarationController::class, 'index'])->middleware('permission:project.declaration.view');
    Route::post('project-declarations', [ProjectDeclarationController::class, 'store'])->middleware('permission:project.declaration.create');
    Route::get('project-declarations/{id}', [ProjectDeclarationController::class, 'show'])->middleware('permission:project.declaration.view');
    Route::put('project-declarations/{id}', [ProjectDeclarationController::class, 'update'])->middleware('permission:project.declaration.edit');
    Route::get('project-declarations/{id}/investors', [ProjectDeclarationController::class, 'investors'])->middleware('permission:project.investor.view');

    Route::get('project-share-sales', [ProjectShareSaleController::class, 'index'])->middleware('permission:project.share.sale.view');
    Route::post('project-share-sales', [ProjectShareSaleController::class, 'store'])->middleware('permission:project.share.sale.create');

    Route::get('project-closings', [ProjectClosingController::class, 'index'])->middleware('permission:project.closing.view');
    Route::post('project-closings', [ProjectClosingController::class, 'store'])->middleware('permission:project.closing.create');

    // Committee Management
    Route::apiResource('committee-types', App\Http\Controllers\Api\CommitteeTypeController::class);
    Route::get('committee-types-active', [App\Http\Controllers\Api\CommitteeTypeController::class, 'getActive'])->middleware('permission:committee.view');
    
    Route::apiResource('committees', App\Http\Controllers\Api\CommitteeController::class);
    Route::post('committees/{id}/submit', [App\Http\Controllers\Api\CommitteeController::class, 'submit'])->middleware('permission:committee.create');
    Route::post('committees/{id}/approve', [App\Http\Controllers\Api\CommitteeController::class, 'approve'])->middleware('permission:committee.approve');
    Route::post('committees/{id}/reject', [App\Http\Controllers\Api\CommitteeController::class, 'reject'])->middleware('permission:committee.approve');
    Route::get('committees-available-members', [App\Http\Controllers\Api\CommitteeController::class, 'getAvailableMembers'])->middleware('permission:committee.view');
});
