<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name_ar',
        'name_en',
        'code',
        'logo_url',
        'cover_image_url',
        'description',
        'website',
        'phone',
        'email',
        'address',
        'city',
        'country',
        'currency',
        'timezone',
        'vat_number',
        'tax_number',
        'commercial_register',
        'status',
        'settings',
        'metadata',
        'trial_ends_at',
        'subscription_ends_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'metadata' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function role(): HasOne
    {
        return $this->hasOne(Role::class)->where('is_system', false);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' || $this->status === 'trial';
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial';
    }

    public function trialExpired(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isPast();
    }

    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : ($this->name_en ?? $this->name_ar);
    }

    public function getTotalVehiclesCountAttribute(): int
    {
        return $this->vehicles()->count();
    }

    public function getTotalBookingsCountAttribute(): int
    {
        return $this->bookings()->count();
    }

    public function getTotalCustomersCountAttribute(): int
    {
        return $this->customers()->count();
    }

    public function getMonthlyRevenueAttribute(): float
    {
        return $this->invoices()
            ->where('status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->sum('total_amount');
    }
}