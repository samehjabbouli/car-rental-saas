'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { MiniStatsCard } from '@/components/ui/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Download,
  Printer,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react'
import type { Invoice } from '@/types/database'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export function InvoicesManagement() {
  const { user } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 10

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, searchQuery])

  const fetchData = async () => {
    if (!user?.company_id) return

    setIsLoading(true)
    try {
      let query = supabase
        .from('invoices')
        .select('*, customer:customers(full_name, phone)', { count: 'exact' })
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,customer:customers(full_name).ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setInvoices(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث حالة الفاتورة' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const handlePrint = (invoice: any) => {
    // Create a printable version of the invoice
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>فاتورة ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; margin-bottom: 40px; }
            .invoice-number { font-size: 24px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .info-box h4 { margin: 0 0 10px; color: #666; }
            .info-box p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; border: 1px solid #ddd; text-align: right; }
            th { background: #f5f5f5; }
            .totals { text-align: left; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            .footer { text-align: center; margin-top: 40px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Car Rental SaaS</h1>
            <p class="invoice-number">فاتورة #${invoice.invoice_number}</p>
            <p>تاريخ الإصدار: ${formatDate(invoice.issue_date)}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h4>معلومات العميل</h4>
              <p><strong>الاسم:</strong> ${invoice.customer?.full_name || '-'}</p>
              <p><strong>الهاتف:</strong> ${invoice.customer?.phone || '-'}</p>
            </div>
            <div class="info-box">
              <h4>معلومات الفاتورة</h4>
              <p><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</p>
              <p><strong>تاريخ الإصدار:</strong> ${formatDate(invoice.issue_date)}</p>
              <p><strong>تاريخ الاستحقاق:</strong> ${invoice.due_date ? formatDate(invoice.due_date) : '-'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount_amount > 0 ? `
            <div class="total-row">
              <span>الخصم</span>
              <span>-${formatCurrency(invoice.discount_amount)}</span>
            </div>
            ` : ''}
            <div class="total-row">
              <span>الضريبة (${invoice.tax_rate}%)</span>
              <span>${formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div class="total-row grand-total">
              <span>الإجمالي</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          <div class="footer">
            <p>شكراً لتعاملكم معنا</p>
            <p>Car Rental SaaS - نظام إدارة تأجير السيارات</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const columns: any[] = [
    { key: 'invoice_number', label: 'رقم الفاتورة' },
    {
      key: 'customer',
      label: 'العميل',
      render: (v: unknown) => (v as { full_name?: string })?.full_name || '-',
    },
    {
      key: 'issue_date',
      label: 'تاريخ الإصدار',
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: 'due_date',
      label: 'تاريخ الاستحقاق',
      render: (v: unknown) => v ? formatDate(v as string) : '-',
    },
    {
      key: 'total_amount',
      label: 'المبلغ',
      render: (v: unknown) => formatCurrency(v as number),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (v: unknown) => <StatusBadge status={v as string} />,
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(row); setShowViewModal(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrint(row)}>
            <Printer className="h-4 w-4" />
          </Button>
          {row.status !== 'paid' && (
            <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(row.id)} className="text-green-600">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const pendingAmount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الفواتير</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الفواتير</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          إنشاء فاتورة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatsCard title="إجمالي الفواتير" value={totalCount} icon={<Receipt className="h-5 w-5" />} />
        <MiniStatsCard title="المبالغ المستحقة" value={formatCurrency(pendingAmount)} icon={<Clock className="h-5 w-5" />} />
        <MiniStatsCard title="المبالغ المحصلة" value={formatCurrency(paidAmount)} icon={<DollarSign className="h-5 w-5" />} />
        <MiniStatsCard title="إجمالي المبلغ" value={formatCurrency(totalAmount)} icon={<Receipt className="h-5 w-5" />} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو اسم العميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="issued">صادر</option>
              <option value="paid">مدفوع</option>
              <option value="partial">جزئي</option>
              <option value="overdue">متأخر</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            data={invoices}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد فواتير"
          />
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / pageSize)}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedInvoice(null) }}
        title="تفاصيل الفاتورة"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedInvoice.invoice_number}</h3>
                <p className="text-muted-foreground">تاريخ الإصدار: {formatDate(selectedInvoice.issue_date)}</p>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-medium">{selectedInvoice.customer?.full_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">{selectedInvoice.customer?.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-right text-sm">الوصف</th>
                    <th className="p-3 text-center text-sm">الكمية</th>
                    <th className="p-3 text-left text-sm">السعر</th>
                    <th className="p-3 text-left text-sm">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-left">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-left">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>الخصم</span>
                  <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>الضريبة ({selectedInvoice.tax_rate}%)</span>
                <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>الإجمالي</span>
                <span className="text-primary">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => handlePrint(selectedInvoice)}>
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              {selectedInvoice.status !== 'paid' && (
                <Button onClick={() => { handleMarkAsPaid(selectedInvoice.id); setShowViewModal(false) }}>
                  <CheckCircle className="h-4 w-4" />
                  تسجيل كمدفوع
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}