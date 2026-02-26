<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\SamityProfileController;
use App\Http\Controllers\Api\MemberInfoController;
use App\Http\Controllers\Api\GlobalController;
use App\Http\Controllers\Api\HR\DepartmentController as HrDepartmentController;
use App\Http\Controllers\Api\HR\DesignationController as HrDesignationController;
use App\Http\Controllers\Api\HR\ShiftController as HrShiftController;
use App\Http\Controllers\Api\HR\HolidayController as HrHolidayController;
use App\Http\Controllers\Api\HR\EmployeeController as HrEmployeeController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\HR\AttendanceController as HrAttendanceController;
use App\Http\Controllers\Api\HR\LeaveTypeController as HrLeaveTypeController;
use App\Http\Controllers\Api\HR\LeaveRequestController as HrLeaveRequestController;
use App\Http\Controllers\Api\HR\SalaryComponentController as HrSalaryComponentController;
use App\Http\Controllers\Api\HR\EmployeeSalaryController as HrEmployeeSalaryController;
use App\Http\Controllers\Api\HR\PayrollController as HrPayrollController;
use App\Http\Controllers\Api\DepositRequestController;
use App\Http\Controllers\Api\WithdrawRequestController;
use App\Http\Controllers\Api\GlMappingTypeController;
use App\Http\Controllers\Api\LoanApplicationController;
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

    // Global Routes (No specific permission required, just valid token)
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

    // Committee Management
    Route::apiResource('committee-types', App\Http\Controllers\Api\CommitteeTypeController::class);
    Route::get('committee-types-active', [App\Http\Controllers\Api\CommitteeTypeController::class, 'getActive'])->middleware('permission:committee.view');
    
    Route::apiResource('committees', App\Http\Controllers\Api\CommitteeController::class);
    Route::post('committees/{id}/submit', [App\Http\Controllers\Api\CommitteeController::class, 'submit'])->middleware('permission:committee.create');
    Route::post('committees/{id}/approve', [App\Http\Controllers\Api\CommitteeController::class, 'approve'])->middleware('permission:committee.approve');
    Route::post('committees/{id}/reject', [App\Http\Controllers\Api\CommitteeController::class, 'reject'])->middleware('permission:committee.approve');
    Route::get('committees-available-members', [App\Http\Controllers\Api\CommitteeController::class, 'getAvailableMembers'])->middleware('permission:committee.view');

    // HR Module (Phase 1)
    Route::prefix('hr')->group(function () {
        // Audit Logs (HR scope)
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:hr.setup.view');

        // Attendance
        Route::get('/attendances', [HrAttendanceController::class, 'index'])->middleware('permission:hr.attendance.view');
        Route::post('/attendances', [HrAttendanceController::class, 'store'])->middleware('permission:hr.attendance.create');
        Route::get('/attendances/{id}', [HrAttendanceController::class, 'show'])->middleware('permission:hr.attendance.view');
        Route::put('/attendances/{id}', [HrAttendanceController::class, 'update'])->middleware('permission:hr.attendance.edit');
        Route::delete('/attendances/{id}', [HrAttendanceController::class, 'destroy'])->middleware('permission:hr.attendance.delete');

        // Leave Types
        Route::get('/leave-types', [HrLeaveTypeController::class, 'index'])->middleware('permission:hr.leave.view');
        Route::post('/leave-types', [HrLeaveTypeController::class, 'store'])->middleware('permission:hr.leave.create');
        Route::put('/leave-types/{id}', [HrLeaveTypeController::class, 'update'])->middleware('permission:hr.leave.edit');
        Route::delete('/leave-types/{id}', [HrLeaveTypeController::class, 'destroy'])->middleware('permission:hr.leave.delete');

        // Leave Requests
        Route::get('/leave-requests', [HrLeaveRequestController::class, 'index'])->middleware('permission:hr.leave.view');
        Route::post('/leave-requests', [HrLeaveRequestController::class, 'store'])->middleware('permission:hr.leave.create');
        Route::post('/leave-requests/{id}/approve', [HrLeaveRequestController::class, 'approve'])->middleware('permission:hr.leave.approve');
        Route::post('/leave-requests/{id}/reject', [HrLeaveRequestController::class, 'reject'])->middleware('permission:hr.leave.approve');
        Route::delete('/leave-requests/{id}', [HrLeaveRequestController::class, 'destroy'])->middleware('permission:hr.leave.delete');

        // Payroll Components
        Route::get('/salary-components', [HrSalaryComponentController::class, 'index'])->middleware('permission:hr.payroll.view');
        Route::post('/salary-components', [HrSalaryComponentController::class, 'store'])->middleware('permission:hr.payroll.create');
        Route::put('/salary-components/{id}', [HrSalaryComponentController::class, 'update'])->middleware('permission:hr.payroll.edit');
        Route::delete('/salary-components/{id}', [HrSalaryComponentController::class, 'destroy'])->middleware('permission:hr.payroll.delete');

        // Employee Salaries
        Route::get('/employee-salaries', [HrEmployeeSalaryController::class, 'index'])->middleware('permission:hr.payroll.view');
        Route::post('/employee-salaries', [HrEmployeeSalaryController::class, 'store'])->middleware('permission:hr.payroll.create');
        Route::put('/employee-salaries/{id}', [HrEmployeeSalaryController::class, 'update'])->middleware('permission:hr.payroll.edit');
        Route::delete('/employee-salaries/{id}', [HrEmployeeSalaryController::class, 'destroy'])->middleware('permission:hr.payroll.delete');

        // Payroll Run
        Route::get('/payroll-runs', [HrPayrollController::class, 'runs'])->middleware('permission:hr.payroll.view');
        Route::post('/payroll-runs/run', [HrPayrollController::class, 'run'])->middleware('permission:hr.payroll.run');
        Route::get('/payslips', [HrPayrollController::class, 'payslips'])->middleware('permission:hr.payroll.view');
        Route::get('/payslips/{id}/pdf', [HrPayrollController::class, 'payslipPdf'])->middleware('permission:hr.payroll.view');
        Route::get('/payroll-summary', [HrPayrollController::class, 'summary'])->middleware('permission:hr.payroll.view');
        Route::get('/payroll-summary.csv', [HrPayrollController::class, 'summaryCsv'])->middleware('permission:hr.payroll.view');
        Route::post('/payroll-runs/{id}/post-gl', [HrPayrollController::class, 'postGl'])->middleware('permission:hr.payroll.run');
        Route::get('/payroll-bank.csv', [HrPayrollController::class, 'bankCsv'])->middleware('permission:hr.payroll.view');
        Route::post('/payroll-runs/{id}/accrue-gl', [HrPayrollController::class, 'accrueGl'])->middleware('permission:hr.payroll.run');
        Route::post('/payroll-runs/{id}/pay-gl', [HrPayrollController::class, 'payGl'])->middleware('permission:hr.payroll.run');

        // Departments
        Route::get('/departments', [HrDepartmentController::class, 'index'])->middleware('permission:hr.setup.view');
        Route::post('/departments', [HrDepartmentController::class, 'store'])->middleware('permission:hr.setup.create');
        Route::get('/departments/{id}', [HrDepartmentController::class, 'show'])->middleware('permission:hr.setup.view');
        Route::put('/departments/{id}', [HrDepartmentController::class, 'update'])->middleware('permission:hr.setup.edit');
        Route::delete('/departments/{id}', [HrDepartmentController::class, 'destroy'])->middleware('permission:hr.setup.delete');

        // Designations
        Route::get('/designations', [HrDesignationController::class, 'index'])->middleware('permission:hr.setup.view');
        Route::post('/designations', [HrDesignationController::class, 'store'])->middleware('permission:hr.setup.create');
        Route::get('/designations/{id}', [HrDesignationController::class, 'show'])->middleware('permission:hr.setup.view');
        Route::put('/designations/{id}', [HrDesignationController::class, 'update'])->middleware('permission:hr.setup.edit');
        Route::delete('/designations/{id}', [HrDesignationController::class, 'destroy'])->middleware('permission:hr.setup.delete');

        // Shifts
        Route::get('/shifts', [HrShiftController::class, 'index'])->middleware('permission:hr.setup.view');
        Route::post('/shifts', [HrShiftController::class, 'store'])->middleware('permission:hr.setup.create');
        Route::get('/shifts/{id}', [HrShiftController::class, 'show'])->middleware('permission:hr.setup.view');
        Route::put('/shifts/{id}', [HrShiftController::class, 'update'])->middleware('permission:hr.setup.edit');
        Route::delete('/shifts/{id}', [HrShiftController::class, 'destroy'])->middleware('permission:hr.setup.delete');

        // Holidays
        Route::get('/holidays', [HrHolidayController::class, 'index'])->middleware('permission:hr.setup.view');
        Route::post('/holidays', [HrHolidayController::class, 'store'])->middleware('permission:hr.setup.create');
        Route::get('/holidays/{id}', [HrHolidayController::class, 'show'])->middleware('permission:hr.setup.view');
        Route::put('/holidays/{id}', [HrHolidayController::class, 'update'])->middleware('permission:hr.setup.edit');
        Route::delete('/holidays/{id}', [HrHolidayController::class, 'destroy'])->middleware('permission:hr.setup.delete');

        // Employees
        Route::get('/employees', [HrEmployeeController::class, 'index'])->middleware('permission:hr.employee.view');
        Route::post('/employees', [HrEmployeeController::class, 'store'])->middleware('permission:hr.employee.create');
        Route::get('/employees/{id}', [HrEmployeeController::class, 'show'])->middleware('permission:hr.employee.view');
        Route::put('/employees/{id}', [HrEmployeeController::class, 'update'])->middleware('permission:hr.employee.edit');
        Route::delete('/employees/{id}', [HrEmployeeController::class, 'destroy'])->middleware('permission:hr.employee.delete');
        Route::post('/employees/{id}/documents', [HrEmployeeController::class, 'uploadDocument'])->middleware('permission:hr.employee.edit');
    });
});
