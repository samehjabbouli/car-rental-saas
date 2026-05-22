<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'email',
        'phone',
        'phone_2',
        'date_of_birth',
        'gender',
        'nationality',
        'country',
        'city',
        'address',
        'passport_number',
        'passport_expiry',
        'passport_documents',
        'id_number',
        'id_expiry',
        'id_documents',
        'driving_license_number',
        'driving_license_expiry',
        'driving_license_documents',
        'driving_license_country',
        'is_blacklisted',
        'blacklist_reason',
        'blacklisted_at',
        'blacklisted_by',
        'loyalty_points',
        'loyalty_tier',
        'total_rentals',
        'total_spent',
        'preferred_payment_method',
        'notes',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'id_expiry' => 'date',
        'driving_license_expiry' => 'date',
        'passport_documents' => 'array',
        'id_documents' => 'array',
        'driving_license_documents' => 'array',
        'metadata' => 'array',
        'is_blacklisted' => 'boolean',
        'blacklisted_at' => 'datetime',
        'loyalty_points' => 'integer',
        'total_rentals' => 'integer',
        'total_spent' => 'decimal:2',
    ];

    protected $attributes = [
        'loyalty_tier' => 'bronze',
        'total_rentals' => 0,
        'total_spent' => 0,
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function blacklistedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blacklisted_by');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBookings(): HasMany
    {
        return $this->hasMany(Booking::class)->active();
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

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    // Attributes
    public function getFullNameAttribute(): string
    {
        $locale = app()->getLocale();
        if ($locale === 'ar' && ($this->first_name_ar || $this->last_name_ar)) {
            return trim(($this->first_name_ar ?? '') . ' ' . ($this->last_name_ar ?? ''));
        }
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->full_name;
    }

    public function isBlacklisted(): bool
    {
        return $this->is_blacklisted === true;
    }

    public function getAverageSpentAttribute(): float
    {
        return $this->total_rentals > 0 ? $this->total_spent / $this->total_rentals : 0;
    }

    public function getDocumentsCompleteAttribute(): bool
    {
        return !empty($this->passport_number) 
            && !empty($this->id_number) 
            && !empty($this->driving_license_number);
    }

    public function getValidDocumentsAttribute(): bool
    {
        $today = now()->toDateString();
        return (!$this->passport_expiry || $this->passport_expiry >= $today)
            && (!$this->id_expiry || $this->id_expiry >= $today)
            && (!$this->driving_license_expiry || $this->driving_license_expiry >= $today);
    }

    // Methods
    public function addToBlacklist(string $reason, User $user): void
    {
        $this->update([
            'is_blacklisted' => true,
            'blacklist_reason' => $reason,
            'blacklisted_at' => now(),
            'blacklisted_by' => $user->id,
        ]);
    }

    public function removeFromBlacklist(): void
    {
        $this->update([
            'is_blacklisted' => false,
            'blacklist_reason' => null,
            'blacklisted_at' => null,
            'blacklisted_by' => null,
        ]);
    }

    public function addLoyaltyPoints(int $points): void
    {
        $this->increment('loyalty_points', $points);
        $this->updateLoyaltyTier();
    }

    public function deductLoyaltyPoints(int $points): bool
    {
        if ($this->loyalty_points < $points) {
            return false;
        }
        $this->decrement('loyalty_points', $points);
        $this->updateLoyaltyTier();
        return true;
    }

    public function updateLoyaltyTier(): void
    {
        $tier = match (true) {
            $this->loyalty_points >= 10000 => 'platinum',
            $this->loyalty_points >= 5000 => 'gold',
            $this->loyalty_points >= 1000 => 'silver',
            default => 'bronze',
        };
        $this->update(['loyalty_tier' => $tier]);
    }

    public function recordBookingComplete(float $amount): void
    {
        $this->increment('total_rentals');
        $this->increment('total_spent', $amount);
        $points = (int) ($amount / 10);
        $this->addLoyaltyPoints($points);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_blacklisted', false);
    }

    public function scopeBlacklisted($query)
    {
        return $query->where('is_blacklisted', true);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (!$search) {
            return $query;
        }
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'ilike', "%{$search}%")
              ->orWhere('last_name', 'ilike', "%{$search}%")
              ->orWhere('email', 'ilike', "%{$search}%")
              ->orWhere('phone', 'ilike', "%{$search}%")
              ->orWhere('id_number', 'ilike', "%{$search}%")
              ->orWhere('passport_number', 'ilike', "%{$search}%");
        });
    }
}