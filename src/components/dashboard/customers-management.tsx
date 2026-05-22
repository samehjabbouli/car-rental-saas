'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { MiniStatsCard } from '@/components/ui/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ShieldAlert,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react'
import type { Customer } from '@/types/database'
import { cn, formatDate } from '@/lib/utils'
import { customerFormSchema, type CustomerFormData, documentTypeOptions } from '@/components/forms/form-fields'

export function CustomersManagement() {
  const { user } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [blacklistReason, setBlacklistReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const pageSize = 10

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
  })

  useEffect(() => {
    fetchData()
  }, [page, searchQuery])

  const fetchData = async () => {
    if (!user?.company_id) return

    setIsLoading(true)
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setCustomers(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CustomerFormData) => {
    if (!user?.company_id) return

    setIsSaving(true)
    try {
      const customerData = {
        company_id: user.company_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone,
        mobile: data.mobile || null,
        id_type: data.id_type || null,
        id_number: data.id_number || null,
        nationality: data.nationality || null,
        birth_date: data.birth_date || null,
        address: data.address || null,
        city: data.city || null,
      }

      const { error } = await supabase.from('customers').insert(customerData)

      if (error) throw error

      addToast({ type: 'success', title: 'تم إضافة العميل بنجاح' })
      setShowAddModal(false)
      reset()
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحفظ' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBlacklist = async () => {
    if (!selectedCustomer || !blacklistReason) return

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          is_blacklisted: true,
          blacklist_reason: blacklistReason,
        })
        .eq('id', selectedCustomer.id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم إضافة العميل للقائمة السوداء' })
      setShowBlacklistModal(false)
      setSelectedCustomer(null)
      setBlacklistReason('')
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const handleRemoveBlacklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          is_blacklisted: false,
          blacklist_reason: null,
        })
        .eq('id', id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم إرجاع العميل من القائمة السوداء' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error

      addToast({ type: 'success', title: 'تم حذف العميل بنجاح' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحذف' })
    }
  }

  const columns: any[] = [
    {
      key: 'full_name',
      label: 'العميل',
      render: (v: unknown, row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
<User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{String(v || '-')}</p>
            <p className="text-xs text-muted-foreground">{row.email || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'الهاتف' },
    { key: 'nationality', label: 'الجنسية' },
    {
      key: 'is_verified',
      label: 'التحقق',
      render: (v: unknown) => (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        )}>
          {v ? 'موثق' : 'غير موثق'}
        </span>
      ),
    },
    {
      key: 'is_blacklisted',
      label: 'الحالة',
      render: (v: unknown) => v ? (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
          محظور
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
          نشط
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'تاريخ التسجيل',
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (_: unknown, row: Customer) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(row); setShowViewModal(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(row); setShowBlacklistModal(true) }} className={cn(row.is_blacklisted && 'text-green-600')}>
            <ShieldAlert className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const totalCustomers = customers.length
  const verifiedCustomers = customers.filter(c => c.is_verified).length
  const blacklistedCustomers = customers.filter(c => c.is_blacklisted).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة العملاء</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع العملاء</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatsCard title="إجمالي العملاء" value={totalCount} icon={<Users className="h-5 w-5" />} />
        <MiniStatsCard title="موثقين" value={verifiedCustomers} icon={<Users className="h-5 w-5" />} />
        <MiniStatsCard title="نشطين" value={totalCustomers - blacklistedCustomers} icon={<Users className="h-5 w-5" />} />
        <MiniStatsCard title="محظورين" value={blacklistedCustomers} icon={<ShieldAlert className="h-5 w-5" />} />
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
                  placeholder="بحث بالاسم أو الهاتف أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            data={customers}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد عملاء"
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); reset() }}
        title="إضافة عميل جديد"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الاسم الأول *</label>
              <input {...register('first_name')} placeholder="الاسم الأول" className="input" />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اسم العائلة *</label>
              <input {...register('last_name')} placeholder="اسم العائلة" className="input" />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الهاتف *</label>
              <input {...register('phone')} type="tel" placeholder="05xxxxxxxx" className="input" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <input {...register('email')} type="email" placeholder="example@domain.com" className="input" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الجنسية</label>
              <input {...register('nationality')} placeholder="المملكة العربية السعودية" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الهوية / جواز السفر</label>
              <input {...register('id_number')} placeholder="رقم الوثيقة" className="input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">العنوان</label>
            <input {...register('address')} placeholder="العنوان الكامل" className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); reset() }}>
              إلغاء
            </Button>
            <Button type="submit" isLoading={isSaving}>
              حفظ العميل
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedCustomer(null) }}
        title="تفاصيل العميل"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedCustomer.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {selectedCustomer.is_blacklisted && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                      محظور
                    </span>
                  )}
                  {selectedCustomer.is_verified && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                      موثق
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">الهاتف</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selectedCustomer.phone}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedCustomer.email || '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">الجنسية</p>
                <p className="font-medium">{selectedCustomer.nationality || '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">رقم الوثيقة</p>
                <p className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedCustomer.id_number || '-'}
                </p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">العنوان</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedCustomer.address || '-'}
                </p>
              </div>
              {selectedCustomer.blacklist_reason && (
                <div className="col-span-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">سبب الحظر</p>
                  <p className="font-medium text-red-800">{selectedCustomer.blacklist_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Blacklist Modal */}
      <Modal
        isOpen={showBlacklistModal}
        onClose={() => { setShowBlacklistModal(false); setSelectedCustomer(null); setBlacklistReason('') }}
        title={selectedCustomer?.is_blacklisted ? 'إرجاع من القائمة السوداء' : 'إضافة للقائمة السوداء'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {selectedCustomer?.is_blacklisted
              ? `هل تريد إرجاع العميل "${selectedCustomer?.full_name}" من القائمة السوداء؟`
              : `أدخل سبب إضافة العميل "${selectedCustomer?.full_name}" للقائمة السوداء:`}
          </p>
          
          {!selectedCustomer?.is_blacklisted && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السبب *</label>
              <textarea
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={4}
                className="input"
                placeholder="أدخل سبب الحظر..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowBlacklistModal(false); setSelectedCustomer(null); setBlacklistReason('') }}>
              إلغاء
            </Button>
            {selectedCustomer?.is_blacklisted ? (
              <Button onClick={() => handleRemoveBlacklist(selectedCustomer.id)}>
                إرجاع العميل
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleBlacklist}
                disabled={!blacklistReason}
              >
                إضافة للقائمة السوداء
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}