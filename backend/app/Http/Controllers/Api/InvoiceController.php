<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['customer', 'booking'])
            ->where('tenant_id', $this->getTenantId());

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->invoice_type) {
            $query->where('invoice_type', $request->invoice_type);
        }
        if ($request->start_date) {
            $query->where('issue_date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->where('issue_date', '<=', $request->end_date);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'ilike', "%{$request->search}%");
            });
        }

        $invoices = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    /**
     * Store a newly created invoice
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|uuid|exists:customers,id',
            'invoice_type' => 'required|in:rental,deposit,maintenance,fine,refund,other',
            'booking_id' => 'nullable|uuid|exists:bookings,id',
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:1',
            'total_amount' => 'required|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $invoice = Invoice::create(array_merge($request->all(), [
            'tenant_id' => $this->getTenantId(),
            'issue_date' => now(),
            'tax_amount' => ($request->subtotal - ($request->discount_amount ?? 0)) * ($request->tax_rate ?? 0.15),
            'remaining_amount' => $request->total_amount,
            'currency' => 'SAR',
            'status' => 'pending',
            'created_by' => auth()->id(),
        ]));

        ActivityLog::log('create', 'invoice', $invoice->id, "Created invoice {$invoice->invoice_number}");

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully',
            'data' => $invoice,
        ], 201);
    }

    /**
     * Display the specified invoice
     */
    public function show(string $id): JsonResponse
    {
        $invoice = Invoice::with(['customer', 'booking', 'payments', 'createdBy'])
            ->where('tenant_id', $this->getTenantId())->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    /**
     * Update the specified invoice
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if ($invoice->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update paid invoice',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'subtotal' => 'sometimes|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'sometimes|numeric|min:0|max:1',
            'total_amount' => 'sometimes|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $invoice->update($request->all());
        $invoice->update([
            'remaining_amount' => $invoice->total_amount - $invoice->paid_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice,
        ]);
    }

    /**
     * Record payment for invoice
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bank_transfer,naqd',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = $invoice->recordPayment($request->amount, [
            'payment_method' => $request->payment_method,
            'status' => 'completed',
            'created_by' => auth()->id(),
        ]);

        ActivityLog::log('payment', 'invoice', $invoice->id, "Recorded payment of {$request->amount} for invoice {$invoice->invoice_number}");

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'invoice' => $invoice->fresh(),
                'payment' => $payment,
            ],
        ]);
    }

    /**
     * Refund invoice
     */
    public function refund(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('tenant_id', $this->getTenantId())->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = $request->amount ?? $invoice->paid_amount;
        $refund = $invoice->refund($amount, $request->reason);

        ActivityLog::log('refund', 'invoice', $invoice->id, "Refunded {$amount} for invoice {$invoice->invoice_number}");

        return response()->json([
            'success' => true,
            'message' => 'Refund processed successfully',
            'data' => [
                'invoice' => $invoice->fresh(),
                'refund' => $refund,
            ],
        ]);
    }

    /**
     * Download PDF
     */
    public function downloadPdf(string $id): JsonResponse
    {
        $invoice = Invoice::where('tenant_id', $this->getTenantId())->findOrFail($id);

        if (!$invoice->pdf_url) {
            $pdfUrl = $invoice->generatePdf();
        } else {
            $pdfUrl = $invoice->pdf_url;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pdf_url' => $pdfUrl,
            ],
        ]);
    }

    /**
     * Get invoice statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $tenantId = $this->getTenantId();
        $query = Invoice::where('tenant_id', $tenantId);

        if ($request->start_date) {
            $query->where('issue_date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->where('issue_date', '<=', $request->end_date);
        }

        $stats = [
            'total' => (clone $query)->count(),
            'total_amount' => (clone $query)->sum('total_amount'),
            'paid_amount' => (clone $query)->where('status', 'paid')->sum('paid_amount'),
            'pending_amount' => (clone $query)->whereIn('status', ['pending', 'partial'])->sum('remaining_amount'),
            'overdue_amount' => (clone $query)->where('status', 'overdue')->sum('remaining_amount'),
            'by_status' => (clone $query)
                ->selectRaw('status, count(*) as count, sum(total_amount) as amount')
                ->groupBy('status')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}