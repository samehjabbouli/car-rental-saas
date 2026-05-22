<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\MaintenanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $stats = [
            'vehicles' => [
                'total' => Vehicle::where('tenant_id', $tenantId)->count(),
                'available' => Vehicle::where('tenant_id', $tenantId)->where('status', 'available')->count(),
                'rented' => Vehicle::where('tenant_id', $tenantId)->where('status', 'rented')->count(),
                'maintenance' => Vehicle::where('tenant_id', $tenantId)->where('status', 'maintenance')->count(),
            ],
            'bookings' => [
                'total' => Booking::where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$startDate, $endDate])->count(),
                'pending' => Booking::where('tenant_id', $tenantId)->where('status', 'pending')->count(),
                'active' => Booking::where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'checked_out', 'checked_in'])->count(),
                'completed' => Booking::where('tenant_id', $tenantId)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startDate, $endDate])->count(),
            ],
            'revenue' => [
                'total' => Invoice::where('tenant_id', $tenantId)
                    ->where('status', 'paid')
                    ->whereBetween('paid_date', [$startDate, $endDate])->sum('total_amount'),
                'pending' => Invoice::where('tenant_id', $tenantId)
                    ->whereIn('status', ['pending', 'partial'])->sum('remaining_amount'),
                'overdue' => Invoice::where('tenant_id', $tenantId)
                    ->where('status', 'overdue')->sum('remaining_amount'),
            ],
            'customers' => [
                'total' => Customer::where('tenant_id', $tenantId)->count(),
                'new_this_month' => Customer::where('tenant_id', $tenantId)
                    ->whereMonth('created_at', now()->month)->count(),
                'blacklisted' => Customer::where('tenant_id', $tenantId)->where('is_blacklisted', true)->count(),
            ],
            'occupancy_rate' => $this->calculateOccupancyRate($tenantId),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Revenue report
     */
    public function revenue(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();
        $groupBy = $request->group_by ?? 'day';

        $dateFormat = match ($groupBy) {
            'year' => 'YYYY',
            'month' => 'YYYY-MM',
            'week' => 'IYYY-IW',
            default => 'YYYY-MM-DD',
        };

        $revenue = Invoice::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_date', [$startDate, $endDate])
            ->selectRaw("TO_CHAR(paid_date, '{$dateFormat}') as period")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_amount) as total')
            ->selectRaw('SUM(tax_amount) as tax')
            ->selectRaw('SUM(paid_amount) as paid')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $revenue,
        ]);
    }

    /**
     * Fleet utilization report
     */
    public function fleetUtilization(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $vehicles = Vehicle::where('tenant_id', $tenantId)
            ->withCount([
                'bookings as total_bookings' => fn($q) => $q->whereBetween('created_at', [$startDate, $endDate]),
                'bookings as completed_bookings' => fn($q) => $q->where('status', 'completed')->whereBetween('created_at', [$startDate, $endDate]),
            ])
            ->withSum([
                'bookings as total_rental_days' => fn($q) => $q->where('status', 'completed')->whereBetween('created_at', [$startDate, $endDate])
            ], 'duration_days')
            ->withSum([
                'bookings as total_revenue' => fn($q) => $q->where('status', 'completed')->whereBetween('created_at', [$startDate, $endDate])
            ], 'total_amount')
            ->get();

        $report = $vehicles->map(function ($vehicle) use ($startDate, $endDate) {
            $totalDays = \Carbon\Carbon::parse($startDate)->diffInDays($endDate) + 1;
            $rentalDays = $vehicle->total_rental_days ?? 0;
            $utilizationRate = $totalDays > 0 ? ($rentalDays / $totalDays) * 100 : 0;

            return [
                'id' => $vehicle->id,
                'name' => $vehicle->name,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'status' => $vehicle->status,
                'total_bookings' => $vehicle->total_bookings,
                'completed_bookings' => $vehicle->completed_bookings,
                'total_rental_days' => $rentalDays,
                'total_revenue' => $vehicle->total_revenue ?? 0,
                'utilization_rate' => round($utilizationRate, 2),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Booking analytics
     */
    public function bookings(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $byStatus = Booking::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $byVehicle = Booking::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('vehicle_id, COUNT(*) as count, SUM(total_amount) as revenue')
            ->groupBy('vehicle_id')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $avgDuration = Booking::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->avg('duration_days');

        return response()->json([
            'success' => true,
            'data' => [
                'by_status' => $byStatus,
                'top_vehicles' => $byVehicle,
                'avg_duration_days' => round($avgDuration ?? 0, 2),
            ],
        ]);
    }

    /**
     * Profit/Loss report
     */
    public function profitLoss(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $revenue = Invoice::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('paid_date', [$startDate, $endDate])
            ->sum('total_amount');

        $expenses = MaintenanceRecord::where('tenant_id', $tenantId)
            ->whereBetween('start_date', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('cost');

        $payroll = 0;
        
        $profit = $revenue - $expenses - $payroll;
        $profitMargin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'revenue' => $revenue,
                'expenses' => [
                    'maintenance' => $expenses,
                    'payroll' => $payroll,
                    'total' => $expenses + $payroll,
                ],
                'profit' => $profit,
                'profit_margin' => round($profitMargin, 2),
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
            ],
        ]);
    }

    /**
     * Customer analytics
     */
    public function customers(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $topCustomers = Customer::where('tenant_id', $tenantId)
            ->withSum([
                'bookings as total_spent' => fn($q) => $q->where('status', 'completed')
            ], 'total_amount')
            ->withCount([
                'bookings as total_rentals' => fn($q) => $q->whereBetween('created_at', [$startDate, $endDate])
            ])
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get();

        $loyaltyDistribution = Customer::where('tenant_id', $tenantId)
            ->selectRaw('loyalty_tier, COUNT(*) as count')
            ->groupBy('loyalty_tier')
            ->get()
            ->keyBy('loyalty_tier');

        return response()->json([
            'success' => true,
            'data' => [
                'top_customers' => $topCustomers,
                'loyalty_distribution' => $loyaltyDistribution,
            ],
        ]);
    }

    /**
     * Maintenance report
     */
    public function maintenance(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $records = MaintenanceRecord::where('tenant_id', $tenantId)
            ->whereBetween('start_date', [$startDate, $endDate])
            ->with('vehicle')
            ->orderBy('start_date', 'desc')
            ->paginate(20);

        $byType = MaintenanceRecord::where('tenant_id', $tenantId)
            ->whereBetween('start_date', [$startDate, $endDate])
            ->selectRaw('type, COUNT(*) as count, SUM(cost) as total_cost')
            ->groupBy('type')
            ->get();

        $totalCost = MaintenanceRecord::where('tenant_id', $tenantId)
            ->whereBetween('start_date', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('cost');

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $records,
                'by_type' => $byType,
                'total_cost' => $totalCost,
            ],
        ]);
    }

    /**
     * Export report to CSV
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $tenantId = $this->getTenantId();
        $reportType = $request->type ?? 'revenue';
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $data = match ($reportType) {
            'vehicles' => Vehicle::where('tenant_id', $tenantId)->get(),
            'bookings' => Booking::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$startDate, $endDate])->get(),
            'invoices' => Invoice::where('tenant_id', $tenantId)
                ->whereBetween('issue_date', [$startDate, $endDate])->get(),
            default => Invoice::where('tenant_id', $tenantId)
                ->whereBetween('paid_date', [$startDate, $endDate])->get(),
        };

        $filename = "{$reportType}_report_{$startDate}_{$endDate}.csv";
        $path = storage_path("app/exports/{$filename}");

        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $file = fopen($path, 'w');
        
        if ($data->isNotEmpty()) {
            fputcsv($file, array_keys($data->first()->toArray()));
            
            foreach ($data as $row) {
                fputcsv($file, $row->toArray());
            }
        }
        
        fclose($file);

        return response()->download($path, $filename, [
            'Content-Type' => 'text/csv',
        ])->deleteFileAfterSend(true);
    }

    protected function calculateOccupancyRate(string $tenantId): float
    {
        $totalVehicles = Vehicle::where('tenant_id', $tenantId)->count();
        if ($totalVehicles === 0) {
            return 0;
        }

        $rentedVehicles = Vehicle::where('tenant_id', $tenantId)
            ->where('status', 'rented')
            ->count();

        return round(($rentedVehicles / $totalVehicles) * 100, 2);
    }

    protected function getTenantId(): ?string
    {
        return auth()->user()?->tenant_id;
    }
}