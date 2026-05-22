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
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Wrench,
  Calendar,
  X,
  Image,
  Upload,
  DollarSign,
} from 'lucide-react'
import type { Vehicle } from '@/types/database'
import { cn, formatCurrency } from '@/lib/utils'
import { fuelTypeOptions, transmissionOptions, vehicleFormSchema, type VehicleFormData } from '@/components/forms/form-fields'

export function FleetManagement() {
  const { user } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const pageSize = 10

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
  })

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, categoryFilter, searchQuery])

  const fetchData = async () => {
    if (!user?.company_id) return

    setIsLoading(true)
    try {
      // Fetch vehicles
      let query = supabase
        .from('vehicles')
        .select('*, category:vehicle_categories(name_ar), branch:branches(name)', { count: 'exact' })
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (categoryFilter) query = query.eq('category_id', categoryFilter)
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,license_plate.ilike.%${searchQuery}%,make.ilike.%${searchQuery}%`)
      }

      const { data: vehiclesData, count } = await query
      setVehicles(vehiclesData || [])
      setTotalCount(count || 0)

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('vehicle_categories')
        .select('*')
        .or(`company_id.eq.${user.company_id},company_id.is.null`)
      setCategories(categoriesData || [])

      // Fetch branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', user.company_id)
      setBranches(branchesData || [])
    } catch (error) {
      console.error('Error:', error)
      addToast({ type: 'error', title: 'خطأ في تحميل البيانات' })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: VehicleFormData) => {
    if (!user?.company_id) return

    setIsSaving(true)
    try {
      const vehicleData = {
        company_id: user.company_id,
        name: data.name,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        color: data.color,
        license_plate: data.license_plate,
        vin: data.vin || null,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        passenger_capacity: parseInt(data.passenger_capacity),
        door_count: parseInt(data.door_count),
        daily_rate: parseFloat(data.daily_rate),
        weekly_rate: data.weekly_rate ? parseFloat(data.weekly_rate) : null,
        monthly_rate: data.monthly_rate ? parseFloat(data.monthly_rate) : null,
        branch_id: data.branch_id || null,
        category_id: data.category_id || null,
        features: data.features ? data.features.split(',').map(f => f.trim()) : [],
        status: 'available',
      }

      const { error } = await supabase.from('vehicles').insert(vehicleData)

      if (error) throw error

      addToast({ type: 'success', title: 'تم إضافة السيارة بنجاح' })
      setShowAddModal(false)
      reset()
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحفظ' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVehicle) return

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', selectedVehicle.id)
      if (error) throw error

      addToast({ type: 'success', title: 'تم حذف السيارة بنجاح' })
      setShowDeleteModal(false)
      setSelectedVehicle(null)
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحذف' })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('vehicles').update({ status: newStatus }).eq('id', id)
      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث الحالة بنجاح' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  // Stats
  const totalVehicles = vehicles.length
  const availableVehicles = vehicles.filter(v => v.status === 'available').length
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length

  const columns: any[] = [
    {
      key: 'name',
      label: 'السيارة',
      render: (v: unknown, row: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted overflow-hidden">
            {row.images && row.images[0] ? (
              <img src={row.images[0]} alt={String(v)} className="h-full w-full object-cover" />
            ) : (
              <Car className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{String(v || '-')}</p>
            <p className="text-xs text-muted-foreground">{row.make} {row.model} {row.year}</p>
          </div>
        </div>
      ),
    },
    { key: 'license_plate', label: 'اللوحة' },
    {
      key: 'category',
      label: 'التصنيف',
      render: (v: unknown) => (v as { name_ar?: string })?.name_ar || '-',
    },
    {
      key: 'daily_rate',
      label: 'السعر اليومي',
      render: (v: unknown) => formatCurrency(v as number),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (v: unknown) => <StatusBadge status={v as string} />,
    },
    {
      key: 'current_km',
      label: 'الكيلومترات',
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center',
      render: (_: unknown, row: Vehicle) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedVehicle(row); setShowViewModal(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Link href={`/fleet/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedVehicle(row); setShowDeleteModal(true) }}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأسطول</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع السيارات</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          إضافة سيارة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatsCard title="إجمالي السيارات" value={totalVehicles} icon={<Car className="h-5 w-5" />} />
        <MiniStatsCard title="متاح" value={availableVehicles} icon={<Car className="h-5 w-5" />} />
        <MiniStatsCard title="مؤجر" value={rentedVehicles} icon={<Car className="h-5 w-5" />} />
        <MiniStatsCard title="صيانة" value={maintenanceVehicles} icon={<Wrench className="h-5 w-5" />} />
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
                  placeholder="بحث بالاسم أو اللوحة..."
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
              <option value="available">متاح</option>
              <option value="rented">مؤجر</option>
              <option value="maintenance">صيانة</option>
              <option value="reserved">محجوز</option>
              <option value="out_of_service">خارج الخدمة</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            data={vehicles}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد سيارات"
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
        title="إضافة سيارة جديدة"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اسم السيارة</label>
              <input {...register('name')} placeholder="مثال: كامري 2024" className="input" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الماركة</label>
              <input {...register('make')} placeholder="مثال: تويوتا" className="input" />
              {errors.make && <p className="text-xs text-red-500">{errors.make.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموديل</label>
              <input {...register('model')} placeholder="مثال: كامري" className="input" />
              {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السنة</label>
              <input {...register('year')} type="number" placeholder="2024" className="input" />
              {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اللون</label>
              <input {...register('color')} placeholder="أبيض" className="input" />
              {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم اللوحة</label>
              <input {...register('license_plate')} placeholder="1234 أ ب" className="input" />
              {errors.license_plate && <p className="text-xs text-red-500">{errors.license_plate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الوقود</label>
              <select {...register('fuel_type')} className="input">
                <option value="">اختر...</option>
                {fuelTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.fuel_type && <p className="text-xs text-red-500">{errors.fuel_type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع القير</label>
              <select {...register('transmission')} className="input">
                <option value="">اختر...</option>
                {transmissionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.transmission && <p className="text-xs text-red-500">{errors.transmission.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">عدد الركاب</label>
              <input {...register('passenger_capacity')} type="number" placeholder="5" className="input" />
              {errors.passenger_capacity && <p className="text-xs text-red-500">{errors.passenger_capacity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">عدد الأبواب</label>
              <input {...register('door_count')} type="number" placeholder="4" className="input" />
              {errors.door_count && <p className="text-xs text-red-500">{errors.door_count.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السعر اليومي (SAR)</label>
              <input {...register('daily_rate')} type="number" placeholder="300" className="input" />
              {errors.daily_rate && <p className="text-xs text-red-500">{errors.daily_rate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السعر الأسبوعي (SAR)</label>
              <input {...register('weekly_rate')} type="number" placeholder="1800" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السعر الشهري (SAR)</label>
              <input {...register('monthly_rate')} type="number" placeholder="6000" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفرع</label>
              <select {...register('branch_id')} className="input">
                <option value="">اختر الفرع...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التصنيف</label>
              <select {...register('category_id')} className="input">
                <option value="">اختر التصنيف...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_ar}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); reset() }}>
              إلغاء
            </Button>
            <Button type="submit" isLoading={isSaving}>
              حفظ السيارة
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedVehicle(null) }}
        title="تفاصيل السيارة"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1/3 h-40 rounded-lg bg-muted overflow-hidden">
                {selectedVehicle.images && selectedVehicle.images[0] ? (
                  <img src={selectedVehicle.images[0]} alt={selectedVehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedVehicle.name}</h3>
                  <p className="text-muted-foreground">{selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedVehicle.status} />
                  <span className="text-lg font-semibold text-primary">{formatCurrency(selectedVehicle.daily_rate)}/يوم</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">رقم اللوحة</p>
                <p className="font-medium">{selectedVehicle.license_plate}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">الوقود</p>
                <p className="font-medium">{selectedVehicle.fuel_type}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">القير</p>
                <p className="font-medium">{selectedVehicle.transmission}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">عدد الركاب</p>
                <p className="font-medium">{selectedVehicle.passenger_capacity}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">الكيلومترات الحالية</p>
                <p className="font-medium">{selectedVehicle.current_km.toLocaleString()} كم</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">اللون</p>
                <p className="font-medium">{selectedVehicle.color}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedVehicle(null) }}
        onConfirm={handleDelete}
        title="حذف السيارة"
        message={`هل أنت متأكد من حذف السيارة "${selectedVehicle?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        variant="danger"
      />
    </div>
  )
}