<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'name_ar',
        'description',
        'is_system',
        'permissions',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    // Permissions Constants
    const PERMISSIONS = [
        // Tenants
        'tenants.view', 'tenants.create', 'tenants.edit', 'tenants.delete',
        
        // Users
        'users.view', 'users.create', 'users.edit', 'users.delete',
        
        // Fleet
        'fleet.view', 'fleet.create', 'fleet.edit', 'fleet.delete', 'fleet.export',
        
        // Bookings
        'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.delete', 
        'bookings.confirm', 'bookings.checkout', 'bookings.checkin', 'bookings.cancel',
        
        // Customers
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'customers.blacklist', 'customers.export',
        
        // Contracts
        'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.sign',
        'contracts.delete', 'contracts.export',
        
        // Invoices
        'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
        'invoices.pay', 'invoices.refund', 'invoices.export',
        
        // Reports
        'reports.view', 'reports.export', 'reports.financial',
        
        // Branches
        'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
        
        // Settings
        'settings.view', 'settings.edit',
    ];

    const SUPER_ADMIN_PERMISSIONS = '*';

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    // Methods
    public function hasPermission(string $permission): bool
    {
        if ($this->permissions === self::SUPER_ADMIN_PERMISSIONS || $this->is_system && $this->name === 'super_admin') {
            return true;
        }
        
        return is_array($this->permissions) && in_array($permission, $this->permissions);
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

    public function givePermission(string $permission): void
    {
        $permissions = $this->permissions ?? [];
        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            $this->update(['permissions' => $permissions]);
        }
    }

    public function revokePermission(string $permission): void
    {
        $permissions = $this->permissions ?? [];
        $permissions = array_values(array_filter($permissions, fn($p) => $p !== $permission));
        $this->update(['permissions' => $permissions]);
    }

    public function syncPermissions(array $permissions): void
    {
        $this->update(['permissions' => $permissions]);
    }

    // Static Methods
    public static function getTenantDefaultRoles(): array
    {
        return [
            'owner' => [
                'name' => 'owner',
                'name_ar' => 'مالك الشركة',
                'description' => 'Company owner with full access',
                'permissions' => [
                    'tenants.view',
                    'users.view', 'users.create', 'users.edit', 'users.delete',
                    'fleet.view', 'fleet.create', 'fleet.edit', 'fleet.delete', 'fleet.export',
                    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.delete',
                    'bookings.confirm', 'bookings.checkout', 'bookings.checkin', 'bookings.cancel',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                    'customers.blacklist', 'customers.export',
                    'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.sign',
                    'contracts.delete', 'contracts.export',
                    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
                    'invoices.pay', 'invoices.refund', 'invoices.export',
                    'reports.view', 'reports.export', 'reports.financial',
                    'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
                    'settings.view', 'settings.edit',
                ],
            ],
            'branch_manager' => [
                'name' => 'branch_manager',
                'name_ar' => 'مدير الفرع',
                'description' => 'Branch manager',
                'permissions' => [
                    'fleet.view', 'fleet.create', 'fleet.edit',
                    'bookings.view', 'bookings.create', 'bookings.edit',
                    'bookings.confirm', 'bookings.checkout', 'bookings.checkin',
                    'customers.view', 'customers.create', 'customers.edit',
                    'contracts.view', 'contracts.create', 'contracts.sign',
                    'invoices.view', 'invoices.create', 'invoices.pay',
                    'reports.view',
                    'branches.view',
                ],
            ],
            'employee' => [
                'name' => 'employee',
                'name_ar' => 'موظف',
                'description' => 'Regular employee',
                'permissions' => [
                    'fleet.view',
                    'bookings.view', 'bookings.create',
                    'customers.view', 'customers.create',
                    'contracts.view',
                    'invoices.view',
                ],
            ],
            'accountant' => [
                'name' => 'accountant',
                'name_ar' => 'محاسب',
                'description' => 'Financial operations',
                'permissions' => [
                    'fleet.view',
                    'bookings.view',
                    'customers.view',
                    'contracts.view',
                    'invoices.view', 'invoices.create', 'invoices.edit',
                    'invoices.pay', 'invoices.refund', 'invoices.export',
                    'reports.view', 'reports.export', 'reports.financial',
                ],
            ],
            'reception' => [
                'name' => 'reception',
                'name_ar' => 'استقبال',
                'description' => 'Front desk operations',
                'permissions' => [
                    'fleet.view',
                    'bookings.view', 'bookings.create', 'bookings.edit',
                    'bookings.confirm', 'bookings.checkout', 'bookings.checkin',
                    'customers.view', 'customers.create',
                    'contracts.view',
                    'invoices.view', 'invoices.pay',
                ],
            ],
            'driver' => [
                'name' => 'driver',
                'name_ar' => 'سائق',
                'description' => 'Driver access',
                'permissions' => [
                    'bookings.view',
                    'fleet.view',
                ],
            ],
            'customer' => [
                'name' => 'customer',
                'name_ar' => 'عميل',
                'description' => 'Customer portal access',
                'permissions' => [
                    'bookings.view', 'bookings.create',
                    'contracts.view',
                    'invoices.view',
                ],
            ],
        ];
    }

    // Scopes
    public function scopeSystemRoles($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeTenantRoles($query)
    {
        return $query->where('is_system', false);
    }
}