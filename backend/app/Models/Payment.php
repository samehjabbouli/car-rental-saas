<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payment_number',
        'tenant_id',
        'invoice_id',
        'booking_id',
        'customer_id',
        'amount',
        'currency',
        'payment_method',
        'payment_provider',
        'transaction_id',
        'reference_number',
        'status',
        'payment_date',
        'receipt_url',
        'notes',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'datetime',
        'metadata' => 'array',
    ];

    const METHOD_CASH = 'cash';
    const METHOD_CARD = 'card';
    const METHOD_BANK_TRANSFER = 'bank_transfer';
    const METHOD_NAQD = 'naqd';
    const METHOD_REFUND = 'refund';
    const METHOD_OTHER = 'other';

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Attributes
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isRefund(): bool
    {
        return $this->amount < 0 || $this->payment_method === self::METHOD_REFUND;
    }

    public function getFormattedAmountAttribute(): string
    {
        $prefix = $this->isRefund() ? '-' : '';
        return $prefix . number_format(abs($this->amount), 2) . ' ' . $this->currency;
    }

    // Methods
    public function markAsCompleted(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        $this->update(['status' => self::STATUS_COMPLETED]);

        if ($this->invoice_id) {
            $this->invoice->recordPayment($this->amount, [
                'payment_method' => $this->payment_method,
            ]);
        }

        if ($this->booking_id) {
            $this->booking->update([
                'paid_amount' => $this->booking->paid_amount + $this->amount,
            ]);
        }

        return true;
    }

    public function markAsFailed(): bool
    {
        $this->update(['status' => self::STATUS_FAILED]);
        return true;
    }

    public function refund(?float $amount = null, ?string $reason = null): Payment
    {
        $refundAmount = $amount ?? abs($this->amount);
        if ($refundAmount > abs($this->amount)) {
            $refundAmount = abs($this->amount);
        }

        return $this->tenant->payments()->create([
            'payment_number' => 'REF-' . now()->format('YmdHis'),
            'tenant_id' => $this->tenant_id,
            'invoice_id' => $this->invoice_id,
            'booking_id' => $this->booking_id,
            'customer_id' => $this->customer_id,
            'amount' => -$refundAmount,
            'currency' => $this->currency,
            'payment_method' => self::METHOD_REFUND,
            'transaction_id' => 'REF-' . $this->transaction_id,
            'status' => self::STATUS_COMPLETED,
            'payment_date' => now(),
            'notes' => $reason ?? "Refund for payment {$this->payment_number}",
        ]);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }
}