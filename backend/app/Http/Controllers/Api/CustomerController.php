<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with(['createdBy'])
            ->where('tenant_id', $this->getTenantId());

        // Apply filters
        if ($request->has('is_blacklisted')) {
            $query->where('is_blacklisted', $request->boolean('is_blacklisted'));
        }
        if ($request->loyalty_tier) {
            $query->where('loyalty_tier', $request->loyalty_tier);
        }
        if ($request->search) {
            $query->search($request->search);
        }

        $customers = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Store a newly created customer
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'first_name_ar' => 'nullable|string|max:100',
            'last_name_ar' => 'nullable|string|max:100',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'required|string|max:50',
            'phone_2' => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female',
            'nationality' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'passport_number' => 'nullable|string|max:50',
            'passport_expiry' => 'nullable|date',
            'id_number' => 'nullable|string|max:50',
            'id_expiry' => 'nullable|date',
            'driving_license_number' => 'nullable|string|max:50',
            'driving_license_expiry' => 'nullable|date',
            'driving_license_country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::create(array_merge($request->all(), [
            'tenant_id' => $this->getTenantId(),
            'created_by' => auth()->id(),
        ]));

        ActivityLog::log('create', 'customer', $customer->id, "Created customer {$customer->full_name}");

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => $customer,
        ], 201);
    }

    /**
     * Display the specified customer
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::with([
            'createdBy', 'blacklistedBy',
            'bookings' => fn($q) => $q->latest()->limit(10),
            'invoices' => fn($q) => $q->latest()->limit(10),
        ])->where('tenant_id', $this->getTenantId())->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Update the specified customer
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:customers,email,' . $id,
            'phone' => 'sometimes|string|max:50',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer->update($request->all());

        ActivityLog::log('update', 'customer', $customer->id, "Updated customer {$customer->full_name}");

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Remove the specified customer
     */
    public function destroy(string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if ($customer->activeBookings()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete customer with active bookings',
            ], 400);
        }

        ActivityLog::log('delete', 'customer', $customer->id, "Deleted customer {$customer->full_name}");
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }

    /**
     * Add to blacklist
     */
    public function addToBlacklist(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer->addToBlacklist($request->reason, auth()->user());

        ActivityLog::log('blacklist', 'customer', $customer->id, "Added customer {$customer->full_name} to blacklist");

        return response()->json([
            'success' => true,
            'message' => 'Customer added to blacklist',
            'data' => $customer,
        ]);
    }

    /**
     * Remove from blacklist
     */
    public function removeFromBlacklist(string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $customer->removeFromBlacklist();

        ActivityLog::log('unblacklist', 'customer', $customer->id, "Removed customer {$customer->full_name} from blacklist");

        return response()->json([
            'success' => true,
            'message' => 'Customer removed from blacklist',
            'data' => $customer,
        ]);
    }

    /**
     * Upload customer documents
     */
    public function uploadDocuments(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'documents.*' => 'required|file|max:10240',
            'type' => 'required|in:passport,id,driving_license',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $uploadedUrls = [];
        $documentType = $request->type . '_documents';

        foreach ($request->file('documents') as $file) {
            $path = $file->store("customers/{$customer->id}/documents", 'public');
            $url = Storage::url($path);
            $uploadedUrls[] = $url;
        }

        $existingDocuments = $customer->{$documentType} ?? [];
        $customer->update([
            $documentType => array_merge($existingDocuments, $uploadedUrls),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Documents uploaded successfully',
            'data' => $uploadedUrls,
        ]);
    }

    /**
     * Get customer statistics
     */
    public function statistics(): JsonResponse
    {
        $tenantId = $this->getTenantId();

        $stats = [
            'total' => Customer::where('tenant_id', $tenantId)->count(),
            'active' => Customer::where('tenant_id', $tenantId)->where('is_blacklisted', false)->count(),
            'blacklisted' => Customer::where('tenant_id', $tenantId)->where('is_blacklisted', true)->count(),
            'new_this_month' => Customer::where('tenant_id', $tenantId)
                ->whereMonth('created_at', now()->month)->count(),
            'total_revenue' => Customer::where('tenant_id', $tenantId)->sum('total_spent'),
            'by_loyalty_tier' => Customer::where('tenant_id', $tenantId)
                ->selectRaw('loyalty_tier, count(*) as count')
                ->groupBy('loyalty_tier')
                ->pluck('count', 'loyalty_tier'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get customer booking history
     */
    public function bookingHistory(string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $bookings = $customer->bookings()
            ->with(['vehicle', 'pickupBranch', 'returnBranch'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Get customer payment history
     */
    public function paymentHistory(string $id): JsonResponse
    {
        $customer = Customer::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $payments = $customer->payments()
            ->with(['invoice', 'booking'])
            ->orderBy('payment_date', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    protected function getTenantId(): ?string
    {
        return auth()->user()?->tenant_id;
    }
}