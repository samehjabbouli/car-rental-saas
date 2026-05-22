<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class Contract extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'contract_number',
        'tenant_id',
        'booking_id',
        'customer_id',
        'vehicle_id',
        'terms',
        'terms_ar',
        'start_date',
        'end_date',
        'total_amount',
        'vat_amount',
        'grand_total',
        'status',
        'signature_url',
        'signed_at',
        'signed_by',
        'ip_address',
        'user_agent',
        'pdf_url',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_SIGNATURE = 'pending_signature';
    const STATUS_SIGNED = 'signed';
    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_TERMINATED = 'terminated';

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }

    // Attributes
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isSigned(): bool
    {
        return $this->status === self::STATUS_SIGNED || $this->status === self::STATUS_ACTIVE;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED || $this->end_date->isPast();
    }

    public function getTermsAttribute(): string
    {
        $locale = app()->getLocale();
        if ($locale === 'ar' && $this->terms_ar) {
            return $this->terms_ar;
        }
        return $this->terms ?? '';
    }

    // Methods
    public function generatePdf(): string
    {
        $pdf = Pdf::loadView('contracts.template', [
            'contract' => $this,
            'tenant' => $this->tenant,
            'customer' => $this->customer,
            'vehicle' => $this->vehicle,
            'booking' => $this->booking,
        ]);

        $filename = "contracts/{$this->tenant_id}/{$this->contract_number}.pdf";
        Storage::disk('public')->put($filename, $pdf->output());

        $this->update(['pdf_url' => Storage::url($filename)]);
        
        return $this->pdf_url;
    }

    public function sign(string $signatureData, User $user): bool
    {
        $signatureFilename = "signatures/{$this->tenant_id}/{$this->contract_number}_signature.png";
        $signatureUrl = $this->saveSignature($signatureData, $signatureFilename);
        
        if (!$signatureUrl) {
            return false;
        }

        $this->update([
            'signature_url' => $signatureUrl,
            'signed_at' => now(),
            'signed_by' => $user->id,
            'status' => self::STATUS_SIGNED,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return true;
    }

    protected function saveSignature(string $data, string $filename): ?string
    {
        try {
            if (preg_match('/^data:image\/png;base64,/', $data)) {
                $data = substr($data, strpos($data, ',') + 1);
            }
            $decodedData = base64_decode($data);
            if ($decodedData === false) {
                return null;
            }
            Storage::disk('public')->put($filename, $decodedData);
            return Storage::url($filename);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function activate(): bool
    {
        if (!$this->isSigned()) {
            return false;
        }
        $this->update(['status' => self::STATUS_ACTIVE]);
        return true;
    }

    public function terminate(?string $reason = null): bool
    {
        if ($this->isExpired() || $this->status === self::STATUS_TERMINATED) {
            return false;
        }
        $this->update([
            'status' => self::STATUS_TERMINATED,
            'notes' => ($this->notes ?? '') . "\n" . "Termination: " . ($reason ?? 'Not specified'),
        ]);
        return true;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', now())
                     ->where('status', '!=', self::STATUS_TERMINATED);
    }

    public function scopePendingSignature($query)
    {
        return $query->where('status', self::STATUS_PENDING_SIGNATURE);
    }
}