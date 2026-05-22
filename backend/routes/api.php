<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/create-tenant', [AuthController::class, 'createTenantWithOwner']);
});

// Protected Routes
Route::middleware(['auth:api'])->group(function () {
    
    // Auth Routes
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    });

    // Dashboard
    Route::get('/dashboard', [ReportController::class, 'dashboard']);

    // Vehicles / Fleet Management
    Route::prefix('vehicles')->group(function () {
        Route::get('/', [VehicleController::class, 'index']);
        Route::post('/', [VehicleController::class, 'store']);
        Route::get('/statistics', [VehicleController::class, 'statistics']);
        Route::get('/branches', [VehicleController::class, 'branches']);
        Route::get('/categories', [VehicleController::class, 'categories']);
        Route::get('/{id}', [VehicleController::class, 'show']);
        Route::put('/{id}', [VehicleController::class, 'update']);
        Route::delete('/{id}', [VehicleController::class, 'destroy']);
        Route::post('/{id}/images', [VehicleController::class, 'uploadImages']);
        Route::delete('/{id}/images/{imageId}', [VehicleController::class, 'deleteImage']);
        Route::put('/{id}/images/{imageId}/primary', [VehicleController::class, 'setPrimaryImage']);
        Route::post('/{id}/availability', [VehicleController::class, 'checkAvailability']);
        Route::post('/{id}/maintenance', [VehicleController::class, 'addMaintenanceRecord']);
    });

    // Bookings
    Route::prefix('bookings')->group(function () {
        Route::get('/', [BookingController::class, 'index']);
        Route::post('/', [BookingController::class, 'store']);
        Route::get('/statistics', [BookingController::class, 'statistics']);
        Route::get('/{id}', [BookingController::class, 'show']);
        Route::put('/{id}', [BookingController::class, 'update']);
        Route::post('/{id}/confirm', [BookingController::class, 'confirm']);
        Route::post('/{id}/checkout', [BookingController::class, 'checkOut']);
        Route::post('/{id}/checkin', [BookingController::class, 'checkIn']);
        Route::post('/{id}/complete', [BookingController::class, 'complete']);
        Route::post('/{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('/{id}/extend', [BookingController::class, 'extend']);
        Route::post('/{id}/discount', [BookingController::class, 'applyDiscount']);
        Route::post('/{id}/payment', [BookingController::class, 'recordPayment']);
    });

    // Customers
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::get('/statistics', [CustomerController::class, 'statistics']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::put('/{id}', [CustomerController::class, 'update']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
        Route::post('/{id}/blacklist', [CustomerController::class, 'addToBlacklist']);
        Route::delete('/{id}/blacklist', [CustomerController::class, 'removeFromBlacklist']);
        Route::post('/{id}/documents', [CustomerController::class, 'uploadDocuments']);
        Route::get('/{id}/bookings', [CustomerController::class, 'bookingHistory']);
        Route::get('/{id}/payments', [CustomerController::class, 'paymentHistory']);
    });

    // Invoices
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::post('/', [InvoiceController::class, 'store']);
        Route::get('/statistics', [InvoiceController::class, 'statistics']);
        Route::get('/{id}', [InvoiceController::class, 'show']);
        Route::put('/{id}', [InvoiceController::class, 'update']);
        Route::post('/{id}/payment', [InvoiceController::class, 'recordPayment']);
        Route::post('/{id}/refund', [InvoiceController::class, 'refund']);
        Route::get('/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/revenue', [ReportController::class, 'revenue']);
        Route::get('/fleet', [ReportController::class, 'fleetUtilization']);
        Route::get('/bookings', [ReportController::class, 'bookings']);
        Route::get('/profit', [ReportController::class, 'profitLoss']);
        Route::get('/customers', [ReportController::class, 'customers']);
        Route::get('/maintenance', [ReportController::class, 'maintenance']);
        Route::get('/export', [ReportController::class, 'export']);
    });
});

// Super Admin Routes
Route::middleware(['auth:api', 'role:super_admin'])->prefix('admin')->group(function () {
    Route::get('/tenants', [\App\Http\Controllers\Api\TenantController::class, 'index']);
    Route::post('/tenants', [\App\Http\Controllers\Api\TenantController::class, 'store']);
    Route::get('/tenants/{id}', [\App\Http\Controllers\Api\TenantController::class, 'show']);
    Route::put('/tenants/{id}', [\App\Http\Controllers\Api\TenantController::class, 'update']);
    Route::delete('/tenants/{id}', [\App\Http\Controllers\Api\TenantController::class, 'destroy']);
    Route::post('/tenants/{id}/suspend', [\App\Http\Controllers\Api\TenantController::class, 'suspend']);
    Route::post('/tenants/{id}/activate', [\App\Http\Controllers\Api\TenantController::class, 'activate']);
    Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
    Route::get('/statistics', [\App\Http\Controllers\Api\TenantController::class, 'statistics']);
});