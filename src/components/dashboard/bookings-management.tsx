'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { StatsCard, MiniStatsCard } from '@/components/ui/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CalendarDays,
  Plus,
  Search,
  Eye,
  Edit,
  X,
  Check,
  Clock,
  User,
  Car,
  Receipt,
} from 'lucide-react'
import type { Booking, Customer, Vehicle } from '@/types/database'
import { cn, formatCurrency, formatDate, calculateDays } from '@/lib/utils'

export function BookingsManagement() {
  const { user } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [bookings, setBookings] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([])
  const pageSize = 10

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customer_id: '',
      vehicle_id: '',
      pickup_date: '',
      return_date: '',
      pickup_location: '',
      return_location: '',
      notes: '',
    }
  })

  const pickupDate = watch('pickup_date')
  const returnDate = watch('return_date')

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    if (pickupDate && returnDate) {
      checkAvailability(pickupDate, returnDate)
    }
  }, [pickupDate, returnDate])

  const fetchData = async () => {
    if (!user?.company_id) return

    setIsLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select('*, customer:customers(full_name, phone), vehicle:vehicles(name, license_plate)', { count: 'exact' })
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (searchQuery) {
        query = query.or(`booking_number.ilike.%${searchQuery}%,customer:customers(full_name).ilike.%${searchQuery}%`)
      }

      const { data: bookingsData, count } = await query
      setBookings(bookingsData || [])
      setTotalCount(count || 0)

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', user.company_id)
      setCustomers(customersData || [])

      // Fetch available vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', user.company_id)
        .eq('status', 'available')
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAvailability = async (pickup: string, returnD: string) => {
    if (!user?.company_id || !pickup || !returnD) return

    try {
      const { data } = await supabase.rpc('get_available_vehicles', {
        p_pickup_date: pickup,
        p_return_date: returnD,
      })
      setAvailableVehicles(data || [])
    } catch (error) {
      // Fallback: show all available vehicles
      setAvailableVehicles(vehicles.filter(v => v.status === 'available'))
    }
  }

  const onSubmit = async (data: any) => {
    if (!user?.company_id) return

    setIsSaving(true)
    try {
      const vehicle = vehicles.find(v => v.id === data.vehicle_id)
      const days = calculateDays(data.pickup_date, data.return_date)
      const subtotal = (vehicle?.daily_rate || 0) * days
      const taxAmount = subtotal * 0.15
      const totalAmount = subtotal + taxAmount

      const bookingData = {
        company_id: user.company_id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        pickup_date: data.pickup_date,
        return_date: data.return_date,
        pickup_location: data.pickup_location,
        return_location: data.return_location,
        daily_rate: vehicle?.daily_rate || 0,
        number_of_days: days,
        subtotal,
        tax_rate: 15,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        deposit_amount: vehicle?.deposit_amount || 0,
        status: 'pending',
      }

      const { error } = await supabase.from('bookings').insert(bookingData)

      if (error) throw error

      addToast({ type: 'success', title: 'تم إنشاء الحجز بنجاح' })
      setShowAddModal(false)
      reset()
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحفظ' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث حالة الحجز' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const days = pickupDate && returnDate ? calculateDays(pickupDate, returnDate) : 0
  const selectedVehicle = vehicles.find(v => v.id === watch('vehicle_id'))
  const subtotal = (selectedVehicle?.daily_rate || 0) * days
  const taxAmount = subtotal * 0.15
  const totalAmount = subtotal + taxAmount

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
    { key: 'booking_number', label: 'رقم الحجز' },
    {
      key: 'customer',
      label: 'العميل',
      render: (v: { full_name?: string }) => v?.full_name || '-',
    },
    {
      key: 'vehicle',
      label: 'السيارة',
      render: (v: { name?: string }) => v?.name || '-',
    },
    {
      key: 'pickup_date',
      label: 'تاريخ الاستلام',
      render: (v: string) => formatDate(v),
    },
    {
      key: 'return_date',
      label: 'تاريخ التسليم',
      render: (v: string) => formatDate(v),
    },
    {
      key: 'total_amount',
      label: 'المبلغ',
      render: (v: number) => formatCurrency(v),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (_: unknown, row: { id: string; status: string }) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedBooking(row); setShowViewModal(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(row.id, 'confirmed')}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(row.id, 'cancelled')}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الحجوزات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الحجوزات</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          حجز جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatsCard title="إجمالي الحجوزات" value={totalCount} icon={<CalendarDays className="h-5 w-5" />} />
        <MiniStatsCard title="معلق" value={bookings.filter(b => b.status === 'pending').length} icon={<Clock className="h-5 w-5" />} />
        <MiniStatsCard title="مؤكد" value={bookings.filter(b => b.status === 'confirmed').length} icon={<Check className="h-5 w-5" />} />
        <MiniStatsCard title="مكتمل" value={bookings.filter(b => b.status === 'completed').length} icon={<Check className="h-5 w-5" />} />
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
                  placeholder="بحث برقم الحجز أو اسم العميل..."
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
              <option value="pending">معلق</option>
              <option value="confirmed">مؤكد</option>
              <option value="checked_out">تم التسليم</option>
              <option value="checked_in">تم الاستلام</option>
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
            data={bookings}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد حجوزات"
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

      {/* Add Booking Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); reset() }}
        title="إنشاء حجز جديد"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">العميل *</label>
              <select {...register('customer_id')} className="input">
                <option value="">اختر العميل...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} - {c.phone}</option>
                ))}
              </select>
              {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السيارة *</label>
              <select {...register('vehicle_id')} className="input">
                <option value="">اختر السيارة...</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {formatCurrency(v.daily_rate)}/يوم
                  </option>
                ))}
              </select>
              {errors.vehicle_id && <p className="text-xs text-red-500">{errors.vehicle_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ الاستلام *</label>
              <input {...register('pickup_date')} type="datetime-local" className="input" />
              {errors.pickup_date && <p className="text-xs text-red-500">{errors.pickup_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ التسليم *</label>
              <input {...register('return_date')} type="datetime-local" className="input" />
              {errors.return_date && <p className="text-xs text-red-500">{errors.return_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">مكان الاستلام</label>
              <input {...register('pickup_location')} placeholder="موقع الاستلام" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">مكان التسليم</label>
              <input {...register('return_location')} placeholder="موقع التسليم" className="input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">ملاحظات</label>
            <textarea {...register('notes')} rows={3} placeholder="ملاحظات إضافية..." className="input" />
          </div>

          {/* Price Summary */}
          {selectedVehicle && days > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium">ملخص السعر</h4>
              <div className="flex justify-between text-sm">
                <span>عدد الأيام</span>
                <span>{days} يوم</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>السعر اليومي</span>
                <span>{formatCurrency(selectedVehicle.daily_rate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>المجموع</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>الضريبة (15%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>الإجمالي</span>
<span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); reset() }}>
              إلغاء
            </Button>
            <Button type="submit" isLoading={isSaving}>
              إنشاء الحجز
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedBooking(null) }}
        title="تفاصيل الحجز"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedBooking.booking_number}</h3>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedBooking.total_amount)}</p>
                <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-medium">{selectedBooking.customer?.full_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">الهاتف</p>
                <p className="font-medium">{selectedBooking.customer?.phone}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">السيارة</p>
                <p className="font-medium">{selectedBooking.vehicle?.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">رقم اللوحة</p>
                <p className="font-medium">{selectedBooking.vehicle?.license_plate}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">تاريخ الاستلام</p>
                <p className="font-medium">{formatDate(selectedBooking.pickup_date, 'long')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">تاريخ التسليم</p>
                <p className="font-medium">{formatDate(selectedBooking.return_date, 'long')}</p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">ملاحظات</p>
                <p className="font-medium">{selectedBooking.notes}</p>
              </div>
            )}

            {/* Actions */}
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-3">
                <Button onClick={() => { handleStatusChange(selectedBooking.id, 'confirmed'); setShowViewModal(false) }}>
                  تأكيد الحجز
                </Button>
                <Button variant="danger" onClick={() => { handleStatusChange(selectedBooking.id, 'cancelled'); setShowViewModal(false) }}>
                  إلغاء الحجز
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}