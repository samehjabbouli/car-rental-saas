<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, HasUuids, SoftDeletes, Notifiable;

    protected $fillable = [
        'tenant_id',
        'role_id',
        'email',
        'password',
        'username',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'phone',
        'phone_verified',
        'avatar_url',
        'date_of_birth',
        'gender',
        'nationality',
        'employee_id',
        'department',
        'position',
        'hire_date',
        'salary',
        'status',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'settings',
        'preferences',
        'metadata',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'salary' => 'decimal:2',
        'phone_verified' => 'boolean',
        'settings' => 'array',
        'preferences' => 'array',
        'metadata' => 'array',
        'password' => 'hashed',
    ];

    // JWT Methods
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'tenant_id' => $this->tenant_id,
            'role_id' => $this->role_id,
            'role' => $this->role?->name,
        ];
    }

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'driver_id');
    }

    public function customerBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }

    public function createdCustomers(): HasMany
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    public function createdBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'created_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(\App\Models\Notification::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
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

    public function getInitialsAttribute(): string
    {
        $first = $this->first_name ? mb_substr($this->first_name, 0, 1) : '';
        $last = $this->last_name ? mb_substr($this->last_name, 0, 1) : '';
        return mb_strtoupper($first . $last);
    }

    public function getAvatarUrlAttribute($value): ?string
    {
        if ($value) {
            return $value;
        }
        return "https://ui-avatars.com/api/?name=" . urlencode($this->full_name) . "&background=random";
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role?->name === 'super_admin';
    }

    public function isOwner(): bool
    {
        return $this->role?->name === 'owner';
    }

    public function canAccessTenant(string $tenantId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        return $this->tenant_id === $tenantId;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        return in_array($permission, $this->role?->permissions ?? []);
    }

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    public function updateLastLogin(): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);
    }
}