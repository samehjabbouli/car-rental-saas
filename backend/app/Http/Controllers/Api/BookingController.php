<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * Display a listing of bookings
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with(['customer', 'vehicle', 'pickupBranch', 'returnBranch', 'driver'])
            ->where('tenant_id', $this->getTenantId());

        // Apply filters
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->vehicle_id) {
            $query->where('vehicle_id', $request->vehicle_id);
        }
        if ($request->pickup_branch_id) {
            $query->where('pickup_branch_id', $request->pickup_branch_id);
        }
        if ($request->start_date_from) {
            $query->where('start_date', '>=', $request->start_date_from);
        }
        if ($request->start_date_to) {
            $query->where('start_date', '<=', $request->start_date_to);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('booking_number', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', function ($cq) use ($request) {
                      $cq->where('first_name', 'ilike', "%{$request->search}%")
                         ->orWhere('last_name', 'ilike', "%{$request->search}%")
                         ->orWhere('phone', 'ilike', "%{$request->search}%");
                  });
            });
        }

        $bookings = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Store a newly created booking
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|uuid|exists:customers,id',
            'vehicle_id' => 'required|uuid|exists:vehicles,id',
            'pickup_branch_id' => 'required|uuid|exists:branches,id',
            'return_branch_id' => 'required|uuid|exists:branches,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'daily_rate' => 'nullable|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_insurance_included' => 'nullable|boolean',
            'is_gps_included' => 'nullable|boolean',
            'is_baby_seat_included' => 'nullable|boolean',
            'addons' => 'nullable|array',
            'addons.*.addon_id' => 'nullable|uuid|exists:addons,id',
            'addons.*.quantity' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $vehicle = Vehicle::findOrFail($request->vehicle_id);
        $customer = Customer::findOrFail($request->customer_id);

        if ($customer->isBlacklisted()) {
            return response()->json([
                'success' => false,
                'message' => 'Customer is blacklisted',
                'errors' => ['customer_id' => 'Customer is blacklisted'],
            ], 400);
        }

        $startDate = \Carbon\Carbon::parse($request->start_date);
        $endDate = \Carbon\Carbon::parse($request->end_date);

        if (!$vehicle->checkAvailability($startDate, $endDate)) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle is not available for selected dates',
                'errors' => ['vehicle_id' => 'Vehicle has conflicting bookings'],
            ], 400);
        }

        $booking = DB::transaction(function () use ($request, $vehicle, $startDate, $endDate) {
            $days = $startDate->diffInDays($endDate) + 1;
            $baseAmount = $vehicle->getRentalPrice($days);
            $vatRate = 0.15;
            $vatAmount = $baseAmount * $vatRate;
            $totalAmount = $baseAmount + $vatAmount;

            $booking = Booking::create([
                'tenant_id' => $this->getTenantId(),
                'customer_id' => $request->customer_id,
                'vehicle_id' => $request->vehicle_id,
                'pickup_branch_id' => $request->pickup_branch_id,
                'return_branch_id' => $request->return_branch_id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'duration_days' => $days,
                'daily_rate' => $request->daily_rate ?? $vehicle->daily_rate,
                'base_amount' => $baseAmount,
                'subtotal' => $baseAmount,
                'vat_rate' => $vatRate,
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount,
                'deposit_amount' => $request->deposit_amount ?? 0,
                'remaining_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $request->notes,
                'is_insurance_included' => $request->is_insurance_included ?? true,
                'is_gps_included' => $request->is_gps_included ?? false,
                'is_baby_seat_included' => $request->is_baby_seat_included ?? false,
                'created_by' => auth()->id(),
            ]);

            if ($request->addons) {
                foreach ($request->addons as $addon) {
                    $booking->addons()->create([
                        'addon_id' => $addon['addon_id'],
                        'quantity' => $addon['quantity'] ?? 1,
                        'unit_price' => 0,
                        'total_price' => 0,
                    ]);
                }
            }

            return $booking;
        });

        ActivityLog::log('create', 'booking', $booking->id, "Created booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'data' => $booking->load(['customer', 'vehicle', 'pickupBranch', 'returnBranch', 'addons']),
        ], 201);
    }

    /**
     * Display the specified booking
     */
    public function show(string $id): JsonResponse
    {
        $booking = Booking::with([
            'customer', 'vehicle', 'pickupBranch', 'returnBranch', 'driver',
            'createdBy', 'confirmedBy', 'checkedOutBy', 'checkedInBy',
            'addons.addon', 'contract', 'invoice', 'payments'
        ])->where('tenant_id', $this->getTenantId())->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Update the specified booking
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if (!$booking->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Can only update pending bookings',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'sometimes|uuid|exists:vehicles,id',
            'start_date' => 'sometimes|date|after_or_equal:today',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking->update($request->all());
        $booking->calculateAmounts();

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'data' => $booking->load(['customer', 'vehicle', 'pickupBranch', 'returnBranch']),
        ]);
    }

    /**
     * Confirm booking
     */
    public function confirm(string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if (!$booking->confirm(auth()->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot confirm this booking',
            ], 400);
        }

        ActivityLog::log('confirm', 'booking', $booking->id, "Confirmed booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Booking confirmed successfully',
            'data' => $booking->load(['customer', 'vehicle']),
        ]);
    }

    /**
     * Check out vehicle
     */
    public function checkOut(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'mileage_out' => 'nullable|integer|min:0',
            'fuel_level_out' => 'nullable|integer|min:0|max:100',
            'initial_condition' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!$booking->checkOut(auth()->user(), $request->only(['mileage_out', 'fuel_level_out', 'initial_condition']))) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot check out this booking',
            ], 400);
        }

        ActivityLog::log('checkout', 'booking', $booking->id, "Checked out booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Vehicle checked out successfully',
            'data' => $booking->load(['customer', 'vehicle']),
        ]);
    }

    /**
     * Check in vehicle
     */
    public function checkIn(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'mileage_in' => 'nullable|integer|min:0',
            'fuel_level_in' => 'nullable|integer|min:0|max:100',
            'return_condition' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->only(['mileage_in', 'fuel_level_in', 'return_condition']);
        
        if ($request->mileage_in && $booking->mileage_out) {
            $extraKm = max(0, $request->mileage_in - $booking->mileage_out - ($booking->duration_days * $booking->vehicle->max_daily_km));
            if ($extraKm > 0) {
                $data['extra_km'] = $extraKm;
                $data['overage_amount'] = $extraKm * $booking->vehicle->overage_rate;
            }
        }

        if (!$booking->checkIn(auth()->user(), $data)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot check in this booking',
            ], 400);
        }

        $booking->refresh();
        $booking->calculateAmounts();
        $booking->save();

        ActivityLog::log('checkin', 'booking', $booking->id, "Checked in booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Vehicle checked in successfully',
            'data' => $booking->load(['customer', 'vehicle']),
        ]);
    }

    /**
     * Complete booking
     */
    public function complete(string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if (!$booking->complete(auth()->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot complete this booking',
            ], 400);
        }

        // Generate invoice
        $invoice = Invoice::create([
            'tenant_id' => $this->getTenantId(),
            'booking_id' => $booking->id,
            'customer_id' => $booking->customer_id,
            'invoice_type' => 'rental',
            'status' => 'pending',
            'issue_date' => now(),
            'due_date' => now()->addDays(7),
            'subtotal' => $booking->subtotal,
            'vat_rate' => $booking->vat_rate,
            'vat_amount' => $booking->vat_amount,
            'total_amount' => $booking->total_amount + ($booking->overage_amount ?? 0),
            'paid_amount' => $booking->paid_amount,
            'remaining_amount' => $booking->remaining_amount,
            'currency' => $booking->currency,
            'created_by' => auth()->id(),
        ]);

        // Generate contract
        $contract = Contract::create([
            'tenant_id' => $this->getTenantId(),
            'booking_id' => $booking->id,
            'customer_id' => $booking->customer_id,
            'vehicle_id' => $booking->vehicle_id,
            'status' => 'draft',
            'start_date' => $booking->start_date,
            'end_date' => $booking->end_date,
            'total_amount' => $booking->base_amount,
            'vat_amount' => $booking->vat_amount,
            'grand_total' => $booking->total_amount,
            'created_by' => auth()->id(),
        ]);

        // Update customer stats
        $booking->customer->recordBookingComplete($booking->total_amount);

        ActivityLog::log('complete', 'booking', $booking->id, "Completed booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Booking completed successfully',
            'data' => [
                'booking' => $booking->load(['customer', 'vehicle']),
                'invoice' => $invoice,
                'contract' => $contract,
            ],
        ]);
    }

    /**
     * Cancel booking
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!$booking->cancel($request->reason)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel this booking',
            ], 400);
        }

        ActivityLog::log('cancel', 'booking', $booking->id, "Cancelled booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully',
        ]);
    }

    /**
     * Extend booking
     */
    public function extend(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'new_end_date' => 'required|date|after:end_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $newEndDate = \Carbon\Carbon::parse($request->new_end_date);
        $booking->extend($newEndDate);

        ActivityLog::log('extend', 'booking', $booking->id, "Extended booking {$booking->booking_number} until {$newEndDate}");

        return response()->json([
            'success' => true,
            'message' => 'Booking extended successfully',
            'data' => $booking->load(['customer', 'vehicle']),
        ]);
    }

    /**
     * Apply discount
     */
    public function applyDiscount(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'discount_code' => 'required|string|max:50',
        ]);

        if($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $coupon = \App\Models\Coupon::where('tenant_id', $this->getTenantId())
            ->where('code', $request->discount_code)
            ->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired discount code',
            ], 400);
        }

        $discount = $coupon->calculateDiscount($booking->subtotal);
        
        $booking->update([
            'discount_amount' => $discount,
            'discount_code' => $coupon->code,
            'discount_type' => $coupon->discount_type,
            'subtotal' => $booking->base_amount - $discount,
            'vat_amount' => ($booking->base_amount - $discount) * $booking->vat_rate,
            'total_amount' => $booking->base_amount - $discount + (($booking->base_amount - $discount) * $booking->vat_rate),
            'remaining_amount' => ($booking->base_amount - $discount + (($booking->base_amount - $discount) * $booking->vat_rate)) - $booking->paid_amount,
        ]);

        $coupon->use();

        return response()->json([
            'success' => true,
            'message' => 'Discount applied successfully',
            'data' => $booking,
        ]);
    }

    /**
     * Record payment
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $booking = Booking::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bank_transfer,naqd',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = Payment::create([
            'tenant_id' => $this->getTenantId(),
            'booking_id' => $booking->id,
            'customer_id' => $booking->customer_id,
            'amount' => $request->amount,
            'currency' => $booking->currency,
            'payment_method' => $request->payment_method,
            'status' => 'completed',
            'payment_date' => now(),
            'created_by' => auth()->id(),
        ]);

        $booking->update([
            'paid_amount' => $booking->paid_amount + $request->amount,
            'remaining_amount' => $booking->remaining_amount - $request->amount,
        ]);

        if ($booking->remaining_amount <= 0) {
            $booking->update(['remaining_amount' => 0]);
        }

        ActivityLog::log('payment', 'booking', $booking->id, "Recorded payment of {$request->amount} for booking {$booking->booking_number}");

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'payment' => $payment,
                'booking' => $booking,
            ],
        ]);
    }

    /**
     * Get booking statistics
     */
    public function statistics(): JsonResponse
    {
        $tenantId = $this->getTenantId();

        $stats = [
            'total' => Booking::where('tenant_id', $tenantId)->count(),
            'pending' => Booking::where('tenant_id', $tenantId)->where('status', 'pending')->count(),
            'confirmed' => Booking::where('tenant_id', $tenantId)->where('status', 'confirmed')->count(),
            'checked_out' => Booking::where('tenant_id', $tenantId)->where('status', 'checked_out')->count(),
            'completed' => Booking::where('tenant_id', $tenantId)->where('status', 'completed')->count(),
            'cancelled' => Booking::where('tenant_id', $tenantId)->where('status', 'cancelled')->count(),
            'overdue' => Booking::where('tenant_id', $tenantId)->where('status', 'checked_out')->where('end_date', '<', now())->count(),
            'total_revenue' => Booking::where('tenant_id', $tenantId)->whereIn('status', ['completed', 'checked_in'])->sum('total_amount'),
            'pending_revenue' => Booking::where('tenant_id', $tenantId)->whereIn('status', ['pending', 'confirmed', 'checked_out'])->sum('remaining_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    protected function getTenantId(): ?string
    {
        return auth()->user()?->tenant_id;
    }
}