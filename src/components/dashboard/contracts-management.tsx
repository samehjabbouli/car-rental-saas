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
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  Printer,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import type { Contract } from '@/types/database'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export function ContractsManagement() {
  const { user } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [contracts, setContracts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
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
        .from('contracts')
        .select('*, customer:customers(full_name, phone), vehicle:vehicles(name, license_plate), booking:bookings(booking_number)', { count: 'exact' })
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (searchQuery) {
        query = query.or(`contract_number.ilike.%${searchQuery}%,customer:customers(full_name).ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setContracts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by_customer: true,
          signature_data: JSON.stringify({ signed_at: new Date().toISOString(), method: 'digital' }),
        })
        .eq('id', id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم توقيع العقد بنجاح' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const handlePrint = (contract: any) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>عقد إيجار - ${contract.contract_number}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; margin-bottom: 40px; }
            h1 { font-size: 28px; margin-bottom: 10px; }
            .contract-number { font-size: 18px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-box { padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .info-box h4 { margin: 0 0 10px; color: #666; }
            .info-box p { margin: 5px 0; }
            .terms { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .terms ul { margin: 0; padding-right: 20px; }
            .terms li { margin-bottom: 10px; }
            .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
            .signature-box { border-top: 1px solid #333; padding-top: 10px; text-align: center; }
            .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>عقد إيجار سيارة</h1>
            <p class="contract-number">رقم العقد: ${contract.contract_number}</p>
            <p>التاريخ: ${formatDate(contract.start_date)}</p>
          </div>

          <div class="section">
            <h3 class="section-title">معلومات الأطراف</h3>
            <div class="info-grid">
              <div class="info-box">
                <h4>الشركة المؤجرة</h4>
                <p><strong>Car Rental SaaS</strong></p>
                <p>عنوان الشركة...</p>
              </div>
              <div class="info-box">
                <h4>العميل</h4>
                <p><strong>${contract.customer?.full_name || '-'}</strong></p>
                <p>الهاتف: ${contract.customer?.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">معلومات السيارة</h3>
            <div class="info-grid">
              <div class="info-box">
                <h4>بيانات السيارة</h4>
                <p><strong>${contract.vehicle?.name || '-'}</strong></p>
                <p>رقم اللوحة: ${contract.vehicle?.license_plate || '-'}</p>
              </div>
              <div class="info-box">
                <h4>فترة الإيجار</h4>
                <p>من: ${formatDate(contract.start_date, 'long')}</p>
                <p>إلى: ${formatDate(contract.end_date, 'long')}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">الشروط والأحكام</h3>
            <div class="terms">
              <ul>
                <li>يلتزم المستأجر بإعادة السيارة في الموعد المحدد.</li>
                <li>يلتزم المستأجر بدفع قيمة الإيجار بالكامل قبل استلام السيارة.</li>
                <li>في حالة التأخير في التسليم، يتم احتساب يوم كامل لكل يوم تأخير.</li>
                <li>يلتزم المستأجر بالحفاظ على السيارة وحالتها.</li>
                <li>غير مسموح بالتدخين داخل السيارة.</li>
                <li>يلتزم المستأجر بتوفير رخصة قيادة سارية.</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">المبلغ الإجمالي</h3>
            <div class="info-grid">
              <div class="info-box">
                <h4>تفاصيل الدفع</h4>
                <p>الإجمالي: <strong>${formatCurrency(contract.total_amount)}</strong></p>
                <p>المدفوع: ${formatCurrency(contract.paid_amount)}</p>
                <p>المتبقي: ${formatCurrency(contract.remaining_amount)}</p>
              </div>
            </div>
          </div>

          <div class="signature-area">
            <div class="signature-box">
              <p>توقيع المستأجر</p>
              <p>${contract.customer?.full_name || ''}</p>
              <p>التاريخ: ___________</p>
            </div>
            <div class="signature-box">
              <p>توقيع الشركة</p>
              <p>Car Rental SaaS</p>
              <p>التاريخ: ___________</p>
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
    { key: 'contract_number', label: 'رقم العقد' },
    {
      key: 'customer',
      label: 'العميل',
      render: (v: unknown) => (v as { full_name?: string })?.full_name || '-',
    },
    {
      key: 'vehicle',
      label: 'السيارة',
      render: (v: unknown) => (v as { name?: string })?.name || '-',
    },
    {
      key: 'start_date',
      label: 'تاريخ البداية',
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: 'end_date',
      label: 'تاريخ النهاية',
      render: (v: unknown) => formatDate(v as string),
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
          <Button variant="ghost" size="sm" onClick={() => { setSelectedContract(row); setShowViewModal(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrint(row)}>
            <Printer className="h-4 w-4" />
          </Button>
          {row.status === 'draft' || row.status === 'pending_signature' ? (
            <Button variant="ghost" size="sm" onClick={() => handleSign(row.id)} className="text-green-600">
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  const totalContracts = contracts.length
  const signedContracts = contracts.filter(c => c.status === 'signed' || c.status === 'active').length
  const pendingContracts = contracts.filter(c => c.status === 'draft' || c.status === 'pending_signature').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة العقود</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع العقود</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          إنشاء عقد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatsCard title="إجمالي العقود" value={totalCount} icon={<FileText className="h-5 w-5" />} />
        <MiniStatsCard title="موقعة" value={signedContracts} icon={<CheckCircle className="h-5 w-5" />} />
        <MiniStatsCard title="معلق" value={pendingContracts} icon={<Clock className="h-5 w-5" />} />
        <MiniStatsCard title="مكتمل" value={contracts.filter(c => c.status === 'completed').length} icon={<FileText className="h-5 w-5" />} />
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
                  placeholder="بحث برقم العقد أو اسم العميل..."
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
              <option value="pending_signature">معلق التوقيع</option>
              <option value="signed">موقع</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            data={contracts}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد عقود"
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
        onClose={() => { setShowViewModal(false); setSelectedContract(null) }}
        title="تفاصيل العقد"
        size="lg"
      >
        {selectedContract && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedContract.contract_number}</h3>
                {selectedContract.booking && (
                  <p className="text-sm text-muted-foreground">الحجز: {selectedContract.booking.booking_number}</p>
                )}
              </div>
              <StatusBadge status={selectedContract.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-medium">{selectedContract.customer?.full_name}</p>
                <p className="text-sm">{selectedContract.customer?.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">السيارة</p>
                <p className="font-medium">{selectedContract.vehicle?.name}</p>
                <p className="text-sm">اللوحة: {selectedContract.vehicle?.license_plate}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                <p className="font-medium">{formatDate(selectedContract.start_date, 'long')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                <p className="font-medium">{formatDate(selectedContract.end_date, 'long')}</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium">الملخص المالي</h4>
              <div className="flex justify-between text-sm">
                <span>الإجمالي</span>
                <span>{formatCurrency(selectedContract.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>المدفوع</span>
                <span className="text-green-600">{formatCurrency(selectedContract.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>المتبقي</span>
                <span className="text-primary">{formatCurrency(selectedContract.remaining_amount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => handlePrint(selectedContract)}>
                <Printer className="h-4 w-4" />
                طباعة العقد
              </Button>
              {(selectedContract.status === 'draft' || selectedContract.status === 'pending_signature') && (
                <Button onClick={() => { handleSign(selectedContract.id); setShowViewModal(false) }}>
                  <CheckCircle className="h-4 w-4" />
                  توقيع العقد
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}