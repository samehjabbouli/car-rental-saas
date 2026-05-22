<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use App\Models\Branch;
use App\Models\VehicleCategory;
use App\Models\MaintenanceRecord;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VehicleController extends Controller
{
    /**
     * Display a listing of vehicles
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::with(['branch', 'category', 'images'])
            ->where('tenant_id', $this->getTenantId());

        // Apply filters
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->min_price) {
            $query->where('daily_rate', '>=', $request->min_price);
        }
        if ($request->max_price) {
            $query->where('daily_rate', '<=', $request->max_price);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('make', 'ilike', "%{$request->search}%")
                  ->orWhere('model', 'ilike', "%{$request->search}%")
                  ->orWhere('license_plate', 'ilike', "%{$request->search}%");
            });
        }

        $vehicles = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $vehicles,
        ]);
    }

    /**
     * Store a newly created vehicle
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'branch_id' => 'required|uuid|exists:branches,id',
            'category_id' => 'nullable|uuid|exists:vehicle_categories,id',
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:2030',
            'color' => 'required|string|max:50',
            'license_plate' => 'required|string|max:50|unique:vehicles,license_plate',
            'vin' => 'nullable|string|max:50|unique:vehicles,vin',
            'chassis_number' => 'nullable|string|max:50',
            'engine_number' => 'nullable|string|max:50',
            'fuel_type' => 'required|in:petrol,diesel,electric,hybrid,gas',
            'transmission' => 'required|in:manual,automatic,semi_auto',
            'passenger_capacity' => 'required|integer|min:1|max:50',
            'door_count' => 'required|integer|min:1|max:10',
            'daily_rate' => 'required|numeric|min:0',
            'weekly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'current_km' => 'nullable|numeric|min:0',
            'max_daily_km' => 'nullable|numeric|min:0',
            'features' => 'nullable|array',
            'insurance_policy' => 'nullable|string|max:100',
            'insurance_start_date' => 'nullable|date',
            'insurance_end_date' => 'nullable|date',
            'inspection_number' => 'nullable|string|max:50',
            'inspection_start_date' => 'nullable|date',
            'inspection_end_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $vehicle = Vehicle::create(array_merge($request->all(), [
            'tenant_id' => $this->getTenantId(),
        ]));

        ActivityLog::log('create', 'vehicle', $vehicle->id, "Created vehicle {$vehicle->name}");

        return response()->json([
            'success' => true,
            'message' => 'Vehicle created successfully',
            'data' => $vehicle->load(['branch', 'category', 'images']),
        ], 201);
    }

    /**
     * Display the specified vehicle
     */
    public function show(string $id): JsonResponse
    {
        $vehicle = Vehicle::with(['branch', 'category', 'images', 'maintenanceRecords' => function ($q) {
            $q->latest()->limit(10);
        }])->where('tenant_id', $this->getTenantId())->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $vehicle,
        ]);
    }

    /**
     * Update the specified vehicle
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'branch_id' => 'sometimes|uuid|exists:branches,id',
            'category_id' => 'nullable|uuid|exists:vehicle_categories,id',
            'make' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'year' => 'sometimes|integer|min:1900|max:2030',
            'color' => 'sometimes|string|max:50',
            'license_plate' => 'sometimes|string|max:50|unique:vehicles,license_plate,' . $id,
            'vin' => 'nullable|string|max:50|unique:vehicles,vin,' . $id,
            'daily_rate' => 'sometimes|numeric|min:0',
            'weekly_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:available,rented,maintenance,reserved,unavailable,sold',
            'is_active' => 'sometimes|boolean',
            'is_available_for_rent' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $oldValues = $vehicle->only(['name', 'status', 'daily_rate']);
        $vehicle->update($request->all());
        $newValues = $vehicle->only(['name', 'status', 'daily_rate']);

        ActivityLog::log('update', 'vehicle', $vehicle->id, "Updated vehicle {$vehicle->name}", $oldValues, $newValues);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'data' => $vehicle->load(['branch', 'category', 'images']),
        ]);
    }

    /**
     * Remove the specified vehicle
     */
    public function destroy(string $id): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if ($vehicle->activeBookings()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete vehicle with active bookings',
            ], 400);
        }

        ActivityLog::log('delete', 'vehicle', $vehicle->id, "Deleted vehicle {$vehicle->name}");
        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully',
        ]);
    }

    /**
     * Upload vehicle images
     */
    public function uploadImages(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'images.*' => 'required|file|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $images = [];
        foreach ($request->file('images') as $index => $image) {
            $path = $image->store("vehicles/{$vehicle->id}", 'public');
            $url = Storage::url($path);

            $isPrimary = $index === 0 && !$vehicle->images()->exists();

            $vehicleImage = $vehicle->images()->create([
                'url' => $url,
                'thumbnail_url' => $url,
                'type' => 'photo',
                'is_primary' => $isPrimary,
                'sort_order' => $index,
            ]);

            $images[] = $vehicleImage;
        }

        return response()->json([
            'success' => true,
            'message' => 'Images uploaded successfully',
            'data' => $images,
        ]);
    }

    /**
     * Set primary image
     */
    public function setPrimaryImage(string $vehicleId, string $imageId): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($vehicleId);
        $image = $vehicle->images()->findOrFail($imageId);

        $vehicle->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Primary image set successfully',
        ]);
    }

    /**
     * Delete vehicle image
     */
    public function deleteImage(string $vehicleId, string $imageId): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($vehicleId);
        $image = $vehicle->images()->findOrFail($imageId);

        if ($image->is_primary && $vehicle->images()->count() > 1) {
            $nextImage = $vehicle->images()->where('id', '!=', $imageId)->first();
            $nextImage->update(['is_primary' => true]);
        }

        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
        ]);
    }

    /**
     * Check vehicle availability
     */
    public function checkAvailability(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $startDate = \Carbon\Carbon::parse($request->start_date);
        $endDate = \Carbon\Carbon::parse($request->end_date);
        $isAvailable = $vehicle->checkAvailability($startDate, $endDate);
        $days = $startDate->diffInDays($endDate) + 1;
        $estimatedCost = $vehicle->getRentalPrice($days);

        return response()->json([
            'success' => true,
            'data' => [
                'available' => $isAvailable,
                'vehicle' => $vehicle->only(['id', 'name', 'daily_rate']),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'duration_days' => $days,
                'estimated_cost' => $estimatedCost,
            ],
        ]);
    }

    /**
     * Add maintenance record
     */
    public function addMaintenanceRecord(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'type' => 'required|string|max:50',
            'description' => 'required|string',
            'cost' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'next_service_date' => 'nullable|date',
            'performed_by' => 'nullable|string|max:255',
            'vendor_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $record = $vehicle->maintenanceRecords()->create(array_merge($request->all(), [
            'tenant_id' => $this->getTenantId(),
        ]));

        if ($request->status === 'maintenance') {
            $vehicle->update(['status' => 'maintenance']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record added successfully',
            'data' => $record,
        ], 201);
    }

    /**
     * Get vehicle statistics
     */
    public function statistics(): JsonResponse
    {
        $tenantId = $this->getTenantId();

        $stats = [
            'total' => Vehicle::where('tenant_id', $tenantId)->count(),
            'available' => Vehicle::where('tenant_id', $tenantId)->where('status', 'available')->count(),
            'rented' => Vehicle::where('tenant_id', $tenantId)->where('status', 'rented')->count(),
            'maintenance' => Vehicle::where('tenant_id', $tenantId)->where('status', 'maintenance')->count(),
            'reserved' => Vehicle::where('tenant_id', $tenantId)->where('status', 'reserved')->count(),
            'total_value' => Vehicle::where('tenant_id', $tenantId)->sum('current_value'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get branches for dropdown
     */
    public function branches(): JsonResponse
    {
        $branches = Branch::where('tenant_id', $this->getTenantId())
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'code']);

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    /**
     * Get categories for dropdown
     */
    public function categories(): JsonResponse
    {
        $categories = VehicleCategory::where('tenant_id', $this->getTenantId())
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'slug', 'icon']);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    protected function getTenantId(): ?string
    {
        return auth()->user()?->tenant_id;
    }
}