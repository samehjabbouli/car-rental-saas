<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class Invoice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_number',
        'invoice_type',
        'tenant_id',
        'booking_id',
        'contract_id',
        'customer_id',
        'status',
        'issue_date',
        'due_date',
        'paid_date',
        'subtotal',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'currency',
        'notes',
        'qr_code',
        'qr_image_url',
        'pdf_url',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    const TYPE_RENTAL = 'rental';
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_MAINTENANCE = 'maintenance';
    const TYPE_FINE = 'fine';
    const TYPE_REFUND = 'refund';
    const TYPE_OTHER = 'other';

    const STATUS_PENDING = 'pending';
    const STATUS_PARTIAL = 'partial';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_FAILED = 'failed';

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Attributes
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPartial(): bool
    {
        return $this->status === self::STATUS_PARTIAL;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE 
            || ($this->due_date && $this->due_date->isPast() && !$this->isPaid());
    }

    public function isRefundable(): bool
    {
        return $this->isPaid() && $this->paid_amount > 0;
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->total_amount, 2) . ' ' . $this->currency;
    }

    public function getQrDataAttribute(): string
    {
        return json_encode([
            'invoice_number' => $this->invoice_number,
            'tenant' => $this->tenant?->name_ar,
            'vat' => $this->tenant?->vat_number,
            'amount' => $this->total_amount,
            'currency' => $this->currency,
            'date' => $this->issue_date->format('Y-m-d'),
        ]);
    }

    // Methods
    public function generateQrCode(): string
    {
        $qr = QrCode::size(200)->generate($this->qr_data);
        $filename = "qrcodes/{$this->tenant_id}/{$this->invoice_number}.svg";
        Storage::disk('public')->put($filename, $qr);
        
        $qrImage = QrCode::format('png')->size(200)->generate($this->qr_data);
        $pngFilename = "qrcodes/{$this->tenant_id}/{$this->invoice_number}.png";
        Storage::disk('public')->put($pngFilename, $qrImage);
        
        $this->update([
            'qr_code' => $this->qr_data,
            'qr_image_url' => Storage::url($pngFilename),
        ]);
        
        return $this->qr_image_url;
    }

    public function generatePdf(): string
    {
        $this->generateQrCode();
        
        $pdf = Pdf::loadView('invoices.template', [
            'invoice' => $this,
            'tenant' => $this->tenant,
            'customer' => $this->customer,
        ]);

        $filename = "invoices/{$this->tenant_id}/{$this->invoice_number}.pdf";
        Storage::disk('public')->put($filename, $pdf->output());

        $this->update(['pdf_url' => Storage::url($filename)]);
        
        return $this->pdf_url;
    }

    public function recordPayment(float $amount, array $data = []): Payment
    {
        $newPaidAmount = $this->paid_amount + $amount;
        $newRemainingAmount = $this->total_amount - $newPaidAmount;
        
        $status = match (true) {
            $newRemainingAmount <= 0 => self::STATUS_PAID,
            $newPaidAmount > 0 => self::STATUS_PARTIAL,
            default => $this->status,
        };

        $this->update([
            'paid_amount' => $newPaidAmount,
            'remaining_amount' => max(0, $newRemainingAmount),
            'status' => $status,
            'paid_date' => $status === self::STATUS_PAID ? now() : null,
        ]);

        return $this->payments()->create(array_merge([
            'tenant_id' => $this->tenant_id,
            'customer_id' => $this->customer_id,
            'amount' => $amount,
            'currency' => $this->currency,
            'payment_date' => now(),
        ], $data));
    }

    public function refund(float $amount, ?string $reason = null): Payment
    {
        if ($amount > $this->paid_amount) {
            $amount = $this->paid_amount;
        }

        $this->update([
            'paid_amount' => $this->paid_amount - $amount,
            'remaining_amount' => $this->remaining_amount + $amount,
            'status' => self::STATUS_REFUNDED,
        ]);

        return $this->payments()->create([
            'tenant_id' => $this->tenant_id,
            'customer_id' => $this->customer_id,
            'amount' => -$amount,
            'currency' => $this->currency,
            'payment_method' => 'refund',
            'status' => 'completed',
            'payment_date' => now(),
            'notes' => $reason ?? 'Refund for invoice ' . $this->invoice_number,
        ]);
    }

    public function markOverdue(): void
    {
        if ($this->due_date && $this->due_date->isPast() && !$this->isPaid()) {
            $this->update(['status' => self::STATUS_OVERDUE]);
        }
    }

    // Scopes
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_PARTIAL]);
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->whereNotIn('status', [self::STATUS_PAID, self::STATUS_REFUNDED]);
    }
}