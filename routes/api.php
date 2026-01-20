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
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

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

    Route::get('/payment-voucher', [App\Http\Controllers\Api\PaymentVoucherController::class, 'index']);
    Route::post('/payment-voucher', [App\Http\Controllers\Api\PaymentVoucherController::class, 'store']);
    Route::get('/received-voucher', [App\Http\Controllers\Api\ReceivedVoucherController::class, 'index']);
    Route::post('/received-voucher', [App\Http\Controllers\Api\ReceivedVoucherController::class, 'store']);
    Route::get('/contra-voucher', [App\Http\Controllers\Api\ContraVoucherController::class, 'index']);
    Route::post('/contra-voucher', [App\Http\Controllers\Api\ContraVoucherController::class, 'store']);
    Route::get('/journal-voucher', [App\Http\Controllers\Api\JournalVoucherController::class, 'index']);
    Route::post('/journal-voucher', [App\Http\Controllers\Api\JournalVoucherController::class, 'store']);
});
