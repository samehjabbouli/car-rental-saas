<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'booking_number',
        'tenant_id',
        'customer_id',
        'vehicle_id',
        'branch_id',
        'pickup_branch_id',
        'return_branch_id',
        'driver_id',
        'status',
        'booking_type',
        'purpose',
        'notes',
        'start_date',
        'end_date',
        'actual_pickup_date',
        'actual_return_date',
        'duration_days',
        'daily_rate',
        'base_amount',
        'extra_km',
        'overage_amount',
        'discount_amount',
        'discount_code',
        'discount_type',
        'subtotal',
        'vat_rate',
        'vat_amount',
        'total_amount',
        'deposit_amount',
        'deposit_paid',
        'paid_amount',
        'remaining_amount',
        'currency',
        'is_insurance_included',
        'insurance_id',
        'is_gps_included',
        'gps_fee',
        'is_baby_seat_included',
        'baby_seat_fee',
        'extras',
        'mileage_out',
        'mileage_in',
        'fuel_level_out',
        'fuel_level_in',
        'initial_condition',
        'return_condition',
        'created_by',
        'confirmed_by',
        'checked_out_by',
        'checked_in_by',
        'metadata',
    ];

    protected $casts = [
        'extras' => 'array',
        'metadata' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'actual_pickup_date' => 'datetime',
        'actual_return_date' => 'datetime',
        'duration_days' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'base_amount' => 'decimal:2',
        'extra_km' => 'decimal:2',
        'overage_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'gps_fee' => 'decimal:2',
        'baby_seat_fee' => 'decimal:2',
        'deposit_paid' => 'boolean',
        'is_insurance_included' => 'boolean',
        'is_gps_included' => 'boolean',
        'is_baby_seat_included' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function pickupBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'pickup_branch_id');
    }

    public function returnBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'return_branch_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function checkedInBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    public function addons(): HasMany
    {
        return $this->hasMany(BookingAddon::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Attributes
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isCheckedOut(): bool
    {
        return $this->status === 'checked_out';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isPaid(): bool
    {
        return $this->remaining_amount <= 0;
    }

    public function isOverdue(): bool
    {
        return $this->status === 'checked_out' && $this->end_date->isPast();
    }

    public function getRemainingDaysAttribute(): int
    {
        return max(0, now()->diffInDays($this->end_date, false));
    }

    public function getTotalExtraFeesAttribute(): float
    {
        return ($this->overage_amount ?? 0) + ($this->gps_fee ?? 0) + ($this->baby_seat_fee ?? 0);
    }

    public function getTotalPayableAttribute(): float
    {
        return $this->total_amount + $this->total_extra_fees - $this->discount_amount;
    }

    // Methods
    public function calculateAmounts(): void
    {
        $startDate = $this->start_date;
        $endDate = $this->end_date;
        $days = $startDate->diffInDays($endDate) + 1;
        
        $this->duration_days = $days;
        $this->daily_rate = $this->vehicle->daily_rate;
        $this->base_amount = $this->vehicle->getRentalPrice($days);
        
        $this->subtotal = $this->base_amount + $this->overage_amount;
        $this->vat_amount = $this->subtotal * $this->vat_rate;
        $this->total_amount = $this->subtotal + $this->vat_amount;
        $this->remaining_amount = $this->total_amount - $this->paid_amount;
    }

    public function confirm(User $user): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        $this->update([
            'status' => 'confirmed',
            'confirmed_by' => $user->id,
        ]);

        return true;
    }

    public function checkOut(User $user, array $data = []): bool
    {
        if (!$this->isConfirmed()) {
            return false;
        }

        $this->update(array_merge([
            'status' => 'checked_out',
            'actual_pickup_date' => now(),
            'checked_out_by' => $user->id,
        ], $data));

        $this->vehicle->update(['status' => 'rented']);

        return true;
    }

    public function checkIn(User $user, array $data = []): bool
    {
        if (!$this->isCheckedOut()) {
            return false;
        }

        $this->update(array_merge([
            'status' => 'checked_in',
            'actual_return_date' => now(),
            'checked_in_by' => $user->id,
        ], $data));

        $this->vehicle->update(['status' => 'available']);

        return true;
    }

    public function complete(User $user, array $data = []): bool
    {
        if (!$this->isCheckedIn()) {
            return false;
        }

        $this->update(array_merge([
            'status' => 'completed',
        ], $data));

        return true;
    }

    public function cancel(?string $reason = null): bool
    {
        if ($this->isCompleted() || $this->isCancelled()) {
            return false;
        }

        $this->update([
            'status' => 'cancelled',
            'notes' => $this->notes . "\n" . "Cancellation reason: " . ($reason ?? 'Not specified'),
        ]);

        if ($this->isCheckedOut()) {
            $this->vehicle->update(['status' => 'available']);
        }

        return true;
    }

    public function extend(\DateTime $newEndDate): void
    {
        $oldEndDate = $this->end_date;
        $oldDays = $oldEndDate->diffInDays($this->start_date) + 1;
        $newDays = $newEndDate->diffInDays($this->start_date) + 1;
        $extraDays = $newDays - $oldDays;
        
        $extraAmount = $this->vehicle->getRentalPrice($newDays) - $this->vehicle->getRentalPrice($oldDays);
        $extraVat = $extraAmount * $this->vat_rate;
        
        $this->update([
            'end_date' => $newEndDate,
            'duration_days' => $newDays,
            'total_amount' => $this->total_amount + $extraAmount + $extraVat,
            'vat_amount' => $this->vat_amount + $extraVat,
            'remaining_amount' => $this->remaining_amount + $extraAmount + $extraVat,
        ]);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed', 'checked_out', 'checked_in']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'checked_out')
                     ->where('end_date', '<', now());
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate])
                     ->orWhereBetween('end_date', [$startDate, $endDate])
                     ->orWhere(function ($q) use ($startDate, $endDate) {
                         $q->where('start_date', '<=', $startDate)
                           ->where('end_date', '>=', $endDate);
                     });
    }
}