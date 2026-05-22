<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'category_id',
        'name',
        'make',
        'model',
        'year',
        'color',
        'color_ar',
        'license_plate',
        'vin',
        'chassis_number',
        'engine_number',
        'fuel_type',
        'transmission',
        'passenger_capacity',
        'door_count',
        'trunk_capacity',
        'daily_rate',
        'weekly_rate',
        'monthly_rate',
        'hourly_rate',
        'current_km',
        'max_daily_km',
        'overage_rate',
        'status',
        'features',
        'specs',
        'insurance_policy',
        'insurance_company',
        'insurance_start_date',
        'insurance_end_date',
        'insurance_documents',
        'inspection_number',
        'inspection_start_date',
        'inspection_end_date',
        'inspection_documents',
        'gps_device_id',
        'last_service_date',
        'next_service_date',
        'purchase_date',
        'purchase_price',
        'current_value',
        'depreciation_rate',
        'is_active',
        'is_available_for_rent',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'features' => 'array',
        'specs' => 'array',
        'insurance_documents' => 'array',
        'inspection_documents' => 'array',
        'metadata' => 'array',
        'insurance_start_date' => 'date',
        'insurance_end_date' => 'date',
        'inspection_start_date' => 'date',
        'inspection_end_date' => 'date',
        'last_service_date' => 'date',
        'next_service_date' => 'date',
        'purchase_date' => 'date',
        'daily_rate' => 'decimal:2',
        'weekly_rate' => 'decimal:2',
        'monthly_rate' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'current_km' => 'decimal:2',
        'max_daily_km' => 'decimal:2',
        'overage_rate' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'depreciation_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'is_available_for_rent' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(VehicleCategory::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(VehicleImage::class)->orderBy('is_primary', 'desc');
    }

    public function primaryImage(): BelongsTo
    {
        return $this->belongsTo(VehicleImage::class)->where('is_primary', true);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBookings(): HasMany
    {
        return $this->hasMany(Booking::class)->whereIn('status', ['confirmed', 'checked_out']);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class);
    }

    public function accidents(): HasMany
    {
        return $this->hasMany(Accident::class);
    }

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    // Attributes
    public function getDisplayNameAttribute(): string
    {
        return "{$this->make} {$this->model} {$this->year}";
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->images()->where('is_primary', true)->first()?->url 
            ?? $this->images()->first()?->url;
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available' && $this->is_available_for_rent && $this->is_active;
    }

    public function isRented(): bool
    {
        return $this->status === 'rented';
    }

    public function needsMaintenance(): bool
    {
        return $this->status === 'maintenance' || $this->next_service_date?->isPast();
    }

    public function insuranceExpired(): bool
    {
        return $this->insurance_end_date && $this->insurance_end_date->isPast();
    }

    public function inspectionExpired(): bool
    {
        return $this->inspection_end_date && $this->inspection_end_date->isPast();
    }

    public function checkAvailability(\DateTime $startDate, \DateTime $endDate): bool
    {
        return !$this->activeBookings()
            ->where(function ($query) use ($startDate, $endDate) {
                $query->where(function ($q) use ($startDate, $endDate) {
                    $q->where('start_date', '<=', $endDate)
                      ->where('end_date', '>=', $startDate);
                });
            })
            ->exists();
    }

    public function getRentalPrice(int $days): float
    {
        if ($days >= 30 && $this->monthly_rate) {
            return $this->monthly_rate * ($days / 30);
        }
        if ($days >= 7 && $this->weekly_rate) {
            return $this->weekly_rate * ($days / 7);
        }
        return $this->daily_rate * $days;
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
                     ->where('is_available_for_rent', true)
                     ->where('is_active', true);
    }

    public function scopeFilterByCategory($query, ?string $categoryId)
    {
        if ($categoryId) {
            return $query->where('category_id', $categoryId);
        }
        return $query;
    }

    public function scopeFilterByStatus($query, ?string $status)
    {
        if ($status) {
            return $query->where('status', $status);
        }
        return $query;
    }

    public function scopeFilterByBranch($query, ?string $branchId)
    {
        if ($branchId) {
            return $query->where('branch_id', $branchId);
        }
        return $query;
    }

    public function scopeFilterByPriceRange($query, ?float $minPrice, ?float $maxPrice)
    {
        if ($minPrice) {
            $query->where('daily_rate', '>=', $minPrice);
        }
        if ($maxPrice) {
            $query->where('daily_rate', '<=', $maxPrice);
        }
        return $query;
    }
}