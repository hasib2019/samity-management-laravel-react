<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\SamityProfileController;
use App\Http\Controllers\Api\MemberInfoController;
use App\Http\Controllers\Api\SavingsProductController;
use App\Http\Controllers\Api\SavingsAccountController;
use App\Http\Controllers\Api\MonthlyCollectionController;
use App\Http\Controllers\Api\FinancialReportController;
use App\Http\Controllers\Api\CollectionScheduleController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

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

    // Savings Product Management
    Route::get('/savings-products', [SavingsProductController::class, 'index']);
    Route::post('/savings-products', [SavingsProductController::class, 'store']);
    Route::get('/savings-products/{id}', [SavingsProductController::class, 'show']);
    Route::put('/savings-products/{id}', [SavingsProductController::class, 'update']);
    Route::delete('/savings-products/{id}', [SavingsProductController::class, 'destroy']);

    // Savings Account Management
    Route::get('/savings-accounts', [SavingsAccountController::class, 'index']);
    Route::post('/savings-accounts', [SavingsAccountController::class, 'store']);
    Route::get('/savings-accounts/{id}', [SavingsAccountController::class, 'show']);
    Route::put('/savings-accounts/{id}', [SavingsAccountController::class, 'update']);
    Route::delete('/savings-accounts/{id}', [SavingsAccountController::class, 'destroy']);

    // Monthly Fee Collection
    Route::get('/monthly-fees/dues/{memberId}', [MonthlyCollectionController::class, 'getDues']);
    Route::post('/monthly-fees/collect', [MonthlyCollectionController::class, 'store']);
    Route::get('/monthly-fees/history/{memberId}', [MonthlyCollectionController::class, 'history']);
    
    // Member Self Service
    Route::get('/my/dues', [MonthlyCollectionController::class, 'myDues']);
    Route::get('/my/payment-history', [MonthlyCollectionController::class, 'myHistory']);

    // Financial Reports
    Route::get('/financial-reports/dues', [FinancialReportController::class, 'dueReport']);
    Route::get('/financial-reports/collections', [FinancialReportController::class, 'collectionReport']);

    // Collection Schedule Management
    Route::get('/collection-schedules', [CollectionScheduleController::class, 'index']);
    Route::post('/collection-schedules', [CollectionScheduleController::class, 'store']);
    Route::get('/collection-schedules/review', [CollectionScheduleController::class, 'reviewData']);
});
