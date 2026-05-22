<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'name_ar',
        'code',
        'address',
        'city',
        'country',
        'phone',
        'email',
        'latitude',
        'longitude',
        'working_hours',
        'is_main',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:11',
        'working_hours' => 'array',
        'settings' => 'array',
        'is_main' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function pickupBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'pickup_branch_id');
    }

    public function returnBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'return_branch_id');
    }

    // Attributes
    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? ($this->name_ar ?? $this->name) : $this->name;
    }

    public function getAvailableVehiclesCountAttribute(): int
    {
        return $this->vehicles()->where('status', 'available')->count();
    }

    public function getActiveBookingsCountAttribute(): int
    {
        return $this->pickupBookings()->active()->count();
    }

    // Methods
    public function isOpen(\DateTime $dateTime = null): bool
    {
        $dateTime = $dateTime ?? now();
        $dayOfWeek = strtolower($dateTime->format('l'));
        $hours = $this->working_hours ?? [];
        
        if (!isset($hours[$dayOfWeek])) {
            return false;
        }
        
        $dayHours = $hours[$dayOfWeek];
        if (!isset($dayHours['open']) || !isset($dayHours['close'])) {
            return false;
        }
        
        $currentTime = $dateTime->format('H:i');
        return $currentTime >= $dayHours['open'] && $currentTime <= $dayHours['close'];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeMain($query)
    {
        return $query->where('is_main', true);
    }
}