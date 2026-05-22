<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceRecord extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'maintenance_records';

    protected $fillable = [
        'vehicle_id',
        'tenant_id',
        'type',
        'type_ar',
        'description',
        'cost',
        'performed_by',
        'performed_by_id',
        'vendor_name',
        'vendor_id',
        'start_date',
        'end_date',
        'next_service_date',
        'parts_replaced',
        'notes',
        'invoice_url',
        'status',
    ];

    protected $casts = [
        'parts_replaced' => 'array',
        'cost' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'next_service_date' => 'date',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_id');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }
}

class Accident extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'vehicle_id',
        'tenant_id',
        'booking_id',
        'accident_date',
        'location',
        'latitude',
        'longitude',
        'description',
        'damage_severity',
        'estimated_cost',
        'actual_cost',
        'insurance_claim',
        'insurance_claim_number',
        'police_report_url',
        'photos',
        'status',
        'resolution_notes',
        'created_by',
    ];

    protected $casts = [
        'accident_date' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:11',
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'insurance_claim' => 'boolean',
        'photos' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

class Violation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'vehicle_id',
        'tenant_id',
        'customer_id',
        'booking_id',
        'violation_date',
        'violation_type',
        'violation_type_ar',
        'location',
        'fine_amount',
        'paid_amount',
        'paid_date',
        'status',
        'notes',
        'document_url',
        'receipt_url',
    ];

    protected $casts = [
        'violation_date' => 'date',
        'fine_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'paid_date' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}

class VehicleImage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'vehicle_id',
        'url',
        'thumbnail_url',
        'type',
        'is_primary',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
        'metadata' => 'array',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}

class VehicleCategory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'name_ar',
        'slug',
        'description',
        'icon',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'category_id');
    }

    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? ($this->name_ar ?? $this->name) : $this->name;
    }
}

class Subscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'plan',
        'status',
        'price',
        'currency',
        'billing_cycle',
        'starts_at',
        'ends_at',
        'trial_ends_at',
        'cancelled_at',
        'metadata',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial';
    }
}

class ActivityLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return self::create([
            'tenant_id' => auth()->user()?->tenant_id,
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}

class Notification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'type',
        'title',
        'title_ar',
        'body',
        'body_ar',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }
}

class Coupon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'description',
        'discount_type',
        'discount_value',
        'max_discount',
        'min_booking_amount',
        'max_uses',
        'used_count',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'min_booking_amount' => 'decimal:2',
        'used_count' => 'integer',
        'max_uses' => 'integer',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isValid(): bool
    {
        $now = now()->toDateString();
        return $this->is_active
            && $this->valid_from <= $now
            && (!$this->valid_until || $this->valid_until >= $now)
            && (!$this->max_uses || $this->used_count < $this->max_uses);
    }

    public function calculateDiscount(float $amount): float
    {
        if ($amount < $this->min_booking_amount) {
            return 0;
        }

        $discount = $this->discount_type === 'percentage' 
            ? $amount * ($this->discount_value / 100)
            : $this->discount_value;

        if ($this->max_discount && $discount > $this->max_discount) {
            $discount = $this->max_discount;
        }

        return min($discount, $amount);
    }

    public function use(): void
    {
        $this->increment('used_count');
    }
}

class Addon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'name_ar',
        'description',
        'price',
        'price_type',
        'is_active',
        'icon',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'ar' ? ($this->name_ar ?? $this->name) : $this->name;
    }
}

class BookingAddon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'addon_id',
        'name',
        'name_ar',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function addon(): BelongsTo
    {
        return $this->belongsTo(Addon::class);
    }
}

class Document extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'entity_type',
        'entity_id',
        'type',
        'name',
        'file_url',
        'file_size',
        'mime_type',
        'created_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

namespace App\Models\Relations;

use Illuminate\Database\Eloquent\Relations\HasMany;

trait HasManyVehicles
{
    public function vehicles(): HasMany
    {
        return $this->hasMany(\App\Models\Vehicle::class);
    }
}

trait HasManyBookings
{
    public function bookings(): HasMany
    {
        return $this->hasMany(\App\Models\Booking::class);
    }
}

trait HasManyCustomers
{
    public function customers(): HasMany
    {
        return $this->hasMany(\App\Models\Customer::class);
    }
}