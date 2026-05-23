'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

interface Booking {
  id?: string
  customer_id?: string
  vehicle_id?: string
  start_date: string
  end_date: string
  total_amount?: number
  status: string
  notes?: string
  created_at?: string
  customer_name?: string
  vehicle_name?: string
  license_plate?: string
}

interface Customer {
  id: string
  full_name: string
}

interface Vehicle {
  id: string
  name: string
  license_plate: string
}

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function BookingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const [formData, setFormData] = useState<Booking>({
    customer_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    total_amount: 0,
    status: 'pending',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      window.location.href = '/login-test'
      return
    }
    fetchData(token)
  }, [])

  useEffect(() => {
    const filtered = bookings.filter(b => {
      const matchesSearch = searchQuery === '' || 
        b.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.license_plate?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter

      return matchesSearch && matchesStatus
    })
    setFilteredBookings(filtered)
  }, [bookings, searchQuery, statusFilter])

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchData(token: string) {
    try {
      // Fetch bookings
      const bookingsRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const bookingsData = await bookingsRes.json()
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : []

      // Fetch customers
      const customersRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,full_name&order=full_name.asc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const customersData = await customersRes.json()
      setCustomers(Array.isArray(customersData) ? customersData : [])

      // Fetch vehicles
      const vehiclesRes = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=id,name,license_plate&order=name.asc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const vehiclesData = await vehiclesRes.json()
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])

      // Map customer and vehicle names to bookings
      const bookingsWithDetails = bookingsList.map((b: Booking) => {
        const customer = customers.find((c: Customer) => c.id === b.customer_id)
        const vehicle = vehicles.find((v: Vehicle) => v.id === b.vehicle_id)
        return {
          ...b,
          customer_name: customer?.full_name || '-',
          vehicle_name: vehicle?.name || '-',
          license_plate: vehicle?.license_plate || '-'
        }
      })

      setBookings(bookingsWithDetails)
      setFilteredBookings(bookingsWithDetails)
    } catch (err) {
      console.error('Error fetching data:', err)
      showToast('فشل في تحميل البيانات', 'error')
    }
    setIsLoading(false)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!formData.customer_id) {
      errors.customer_id = 'اختر العميل'
    }

    if (!formData.vehicle_id) {
      errors.vehicle_id = 'اختر السيارة'
    }

    if (!formData.start_date) {
      errors.start_date = 'تاريخ البداية مطلوب'
    }

    if (!formData.end_date) {
      errors.end_date = 'تاريخ النهاية مطلوب'
    } else if (formData.start_date && formData.end_date < formData.start_date) {
      errors.end_date = 'تاريخ النهاية يجب أن يكون بعد البداية'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في إضافة الحجز')
      }

      showToast('تم إضافة الحجز بنجاح', 'success')
      setShowAddModal(false)
      resetForm()
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في إضافة الحجز', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm() || !selectedBooking?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const { created_at, customer_name, vehicle_name, license_plate, ...updateData } = formData
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في تحديث الحجز')
      }

      showToast('تم تحديث الحجز بنجاح', 'success')
      setShowEditModal(false)
      setSelectedBooking(null)
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في تحديث الحجز', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleDelete() {
    if (!selectedBooking?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${selectedBooking.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في حذف الحجز')
      }

      showToast('تم حذف الحجز بنجاح', 'success')
      setShowDeleteModal(false)
      setSelectedBooking(null)
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف الحجز', 'error')
    }
    setIsSubmitting(false)
  }

  function resetForm() {
    setFormData({
      customer_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      total_amount: 0,
      status: 'pending',
      notes: ''
    })
    setFormErrors({})
  }

  function openEditModal(booking: Booking) {
    setSelectedBooking(booking)
    setFormData({ ...booking })
    setFormErrors({})
    setShowEditModal(true)
  }

  function openDeleteModal(booking: Booking) {
    setSelectedBooking(booking)
    setShowDeleteModal(true)
  }

  function handleLogout() {
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('sb_refresh_token')
    localStorage.removeItem('sb_user_id')
    window.location.href = '/login-test'
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'confirmed': return 'مؤكد'
      case 'pending': return 'معلق'
      case 'cancelled': return 'ملغي'
      case 'completed': return 'مكتمل'
      default: return status
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA')
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_amount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-pulse ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة الحجوزات</h1>
            <p className="text-slate-500">إجمالي: {bookings.length} حجز</p>
          </div>
          <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Navigation */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { href: '/company', icon: '🏠', label: 'لوحة التحكم', bg: 'bg-blue-500' },
            { href: '/fleet', icon: '🚗', label: 'الأسطول', bg: 'bg-green-500' },
            { href: '/customers', icon: '👥', label: 'العملاء', bg: 'bg-purple-500' },
            { href: '/invoices', icon: '💰', label: 'الفواتير', bg: 'bg-pink-500' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`${item.bg} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-slate-500">إجمالي الحجوزات</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-slate-500">معلق</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-slate-500">مؤكد</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">🏁</div>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-slate-500">مكتمل</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-slate-500">إجمالي الإيرادات</div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">قائمة الحجوزات</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 بحث برقم الحجز أو العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلق</option>
                <option value="confirmed">مؤكد</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
              <button
                onClick={() => {
                  resetForm()
                  setShowAddModal(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                + إضافة حجز
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-slate-500">
                {searchQuery || statusFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد حجوزات بعد'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  إضافة أول حجز
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">رقم الحجز</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">العميل</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">السيارة</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">تاريخ البداية</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">تاريخ النهاية</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">المبلغ الإجمالي</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, index) => (
                    <tr key={b.id || index} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">#{b.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-medium">{b.customer_name}</td>
                      <td className="py-3 px-4">
                        <div>{b.vehicle_name}</div>
                        <div>{b.license_plate}</div>
                      </td>
                      <td className="py-3 px-4">{formatDate(b.start_date)}</td>
                      <td className="py-3 px-4">{formatDate(b.end_date)}</td>
                      <td className="py-3 px-4 font-medium">{b.total_amount ? formatCurrency(b.total_amount) : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm border ${getStatusColor(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(b)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteModal(b)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">إضافة حجز جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العميل *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.customer_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">اختر العميل</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  {formErrors.customer_id && <p className="text-red-500 text-sm mt-1">{formErrors.customer_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">السيارة *</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.vehicle_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">اختر السيارة</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.license_plate}</option>
                    ))}
                  </select>
                  {formErrors.vehicle_id && <p className="text-red-500 text-sm mt-1">{formErrors.vehicle_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.start_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.end_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ الإجمالي</label>
                  <input
                    type="number"
                    value={formData.total_amount || ''}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الحجز'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">تعديل الحجز</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العميل *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.customer_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">اختر العميل</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  {formErrors.customer_id && <p className="text-red-500 text-sm mt-1">{formErrors.customer_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">السيارة *</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.vehicle_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">اختر السيارة</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} - {v.license_plate}</option>
                    ))}
                  </select>
                  {formErrors.vehicle_id && <p className="text-red-500 text-sm mt-1">{formErrors.vehicle_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.start_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.end_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ الإجمالي</label>
                  <input
                    type="number"
                    value={formData.total_amount || ''}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'جاري التحديث...' : 'تحديث الحجز'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">تأكيد الحذف</h3>
              <p className="text-slate-600 mb-4">
                هل أنت متأكد من حذف الحجز <strong>#{selectedBooking.id?.slice(0, 8)}</strong>؟
              </p>
              <p className="text-red-500 text-sm mb-4">لا يمكن التراجع عن هذا الإجراء</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedBooking(null)
                  }}
                  className="flex-1 px-6 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}