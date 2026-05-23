'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

interface Vehicle {
  id: string
  name: string
  license_plate: string
  make: string
  model: string
  year: number
  color: string
  daily_rate: number
  status: string
  created_at: string
}

interface VehicleFormData {
  name: string
  license_plate: string
  make: string
  model: string
  year: string
  color: string
  daily_rate: string
  status: string
}

const statusOptions = [
  { value: 'available', label: 'متاحة', bg: 'bg-green-100', text: 'text-green-700' },
  { value: 'rented', label: 'مؤجرة', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { value: 'maintenance', label: 'صيانة', bg: 'bg-red-100', text: 'text-red-700' },
  { value: 'retired', label: 'مخرجة', bg: 'bg-slate-100', text: 'text-slate-700' },
]

const initialFormData: VehicleFormData = {
  name: '',
  license_plate: '',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  color: '',
  daily_rate: '',
  status: 'available',
}

export default function FleetPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<VehicleFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('sb_access_token') : null
  const userId = typeof window !== 'undefined' ? localStorage.getItem('sb_user_id') : null

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!token || !userId) {
      window.location.href = '/login-test'
      return
    }
    fetchVehicles()
  }, [token, userId])

  async function fetchVehicles() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'count=exact'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVehicles(Array.isArray(data) ? data : [])
      } else {
        const error = await response.json()
        console.error('Fetch error:', error)
        showToast('خطأ في تحميل البيانات', 'error')
      }
    } catch (err) {
      console.error('Error:', err)
      showToast('خطأ في الاتصال بالخادم', 'error')
    }
    setIsLoading(false)
  }

  function validateForm(data: VehicleFormData): boolean {
    const errors: Partial<VehicleFormData> = {}
    if (!data.name.trim()) errors.name = 'اسم السيارة مطلوب'
    if (!data.license_plate.trim()) errors.license_plate = 'رقم اللوحة مطلوب'
    if (!data.make.trim()) errors.make = 'الماركة مطلوبة'
    if (!data.model.trim()) errors.model = 'الموديل مطلوب'
    if (!data.year.trim()) errors.year = 'السنة مطلوبة'
    else if (isNaN(parseInt(data.year)) || parseInt(data.year) < 1900 || parseInt(data.year) > 2030) {
      errors.year = 'سنة غير صالحة'
    }
    if (!data.daily_rate.trim()) errors.daily_rate = 'السعر اليومي مطلوب'
    else if (isNaN(parseFloat(data.daily_rate)) || parseFloat(data.daily_rate) <= 0) {
      errors.daily_rate = 'السعر يجب أن يكون رقماً موجباً'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm(formData)) return

    setIsSaving(true)
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vehicles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: formData.name,
          license_plate: formData.license_plate,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          color: formData.color,
          daily_rate: parseFloat(formData.daily_rate),
          status: formData.status,
        })
      })

      if (response.ok) {
        const newVehicle = await response.json()
        setVehicles(prev => [newVehicle, ...prev])
        setShowAddModal(false)
        setFormData(initialFormData)
        showToast('تم إضافة السيارة بنجاح!', 'success')
      } else {
        const error = await response.json()
        showToast(error.message || 'خطأ في إضافة السيارة', 'error')
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error')
    }
    setIsSaving(false)
  }

  async function handleUpdateVehicle(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm(formData) || !selectedVehicle) return

    setIsSaving(true)
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?id=eq.${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: formData.name,
          license_plate: formData.license_plate,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          color: formData.color,
          daily_rate: parseFloat(formData.daily_rate),
          status: formData.status,
        })
      })

      if (response.ok) {
        const updatedVehicle = await response.json()
        setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? updatedVehicle[0] : v))
        setShowEditModal(false)
        setSelectedVehicle(null)
        setFormData(initialFormData)
        showToast('تم تحديث السيارة بنجاح!', 'success')
      } else {
        const error = await response.json()
        showToast(error.message || 'خطأ في تحديث السيارة', 'error')
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error')
    }
    setIsSaving(false)
  }

  async function handleDeleteVehicle() {
    if (!selectedVehicle) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?id=eq.${selectedVehicle.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id))
        setShowDeleteModal(false)
        setSelectedVehicle(null)
        showToast('تم حذف السيارة بنجاح!', 'success')
      } else {
        const error = await response.json()
        showToast(error.message || 'خطأ في حذف السيارة', 'error')
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error')
    }
    setIsDeleting(false)
  }

  function openEditModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setFormData({
      name: vehicle.name,
      license_plate: vehicle.license_plate || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      daily_rate: vehicle.daily_rate?.toString() || '',
      status: vehicle.status || 'available',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  function openDeleteModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setShowDeleteModal(true)
  }

  function handleLogout() {
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('sb_refresh_token')
    localStorage.removeItem('sb_user_id')
    window.location.href = '/login-test'
  }

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !searchQuery || 
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented: vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🚗 إدارة الأسطول</h1>
          <p className="text-slate-500">إدارة سيارات الشركة</p>
        </div>
        <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 font-medium">
          تسجيل الخروج
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-blue-500">
          <div className="text-3xl mb-2">🚗</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-slate-500">إجمالي السيارات</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-green-500">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-slate-500">متاحة</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-yellow-500">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.rented}</div>
          <div className="text-slate-500">مؤجرة</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-red-500">
          <div className="text-3xl mb-2">🔧</div>
          <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
          <div className="text-slate-500">صيانة</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { href: '/company', icon: '🏠', label: 'لوحة التحكم', bg: 'bg-blue-500' },
          { href: '/customers', icon: '👥', label: 'العملاء', bg: 'bg-green-500' },
          { href: '/bookings', icon: '📅', label: 'الحجوزات', bg: 'bg-purple-500' },
          { href: '/invoices', icon: '💰', label: 'الفواتير', bg: 'bg-pink-500' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={`${item.bg} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">قائمة السيارات</h2>
          <button 
            onClick={() => { setFormData(initialFormData); setFormErrors({}); setShowAddModal(true) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <span>+</span> إضافة سيارة
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="بحث بالاسم أو اللوحة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الحالات</option>
            <option value="available">متاحة</option>
            <option value="rented">مؤجرة</option>
            <option value="maintenance">صيانة</option>
            <option value="retired">مخرجة</option>
          </select>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-slate-500 mb-4">لا توجد سيارات</p>
            <button 
              onClick={() => { setFormData(initialFormData); setFormErrors({}); setShowAddModal(true) }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              إضافة أول سيارة
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-right py-3 px-4 font-semibold">السيارة</th>
                  <th className="text-right py-3 px-4 font-semibold">رقم اللوحة</th>
                  <th className="text-right py-3 px-4 font-semibold">الماركة</th>
                  <th className="text-right py-3 px-4 font-semibold">الموديل</th>
                  <th className="text-right py-3 px-4 font-semibold">السنة</th>
                  <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold">السعر اليومي</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const status = statusOptions.find(s => s.value === vehicle.status) || statusOptions[0]
                  return (
                    <tr key={vehicle.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-2xl">
                            🚗
                          </div>
                          <div className="font-semibold">{vehicle.name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{vehicle.license_plate || '-'}</td>
                      <td className="py-3 px-4">{vehicle.make || '-'}</td>
                      <td className="py-3 px-4">{vehicle.model || '-'}</td>
                      <td className="py-3 px-4">{vehicle.year || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">{vehicle.daily_rate ? `${vehicle.daily_rate} ر.س` : '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(vehicle)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="تعديل">✏️</button>
                          <button onClick={() => openDeleteModal(vehicle)} className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">إضافة سيارة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم السيارة *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.name && <span className="text-red-500 text-xs">{formErrors.name}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم اللوحة *</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.license_plate ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.license_plate && <span className="text-red-500 text-xs">{formErrors.license_plate}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الماركة *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.make ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.make && <span className="text-red-500 text-xs">{formErrors.make}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الموديل *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.model ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.model && <span className="text-red-500 text-xs">{formErrors.model}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السنة *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.year ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.year && <span className="text-red-500 text-xs">{formErrors.year}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">اللون</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر اليومي *</label>
                  <input
                    type="text"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.daily_rate ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.daily_rate && <span className="text-red-500 text-xs">{formErrors.daily_rate}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">إلغاء</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">تعديل السيارة</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleUpdateVehicle}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم السيارة *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.name && <span className="text-red-500 text-xs">{formErrors.name}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم اللوحة *</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.license_plate ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.license_plate && <span className="text-red-500 text-xs">{formErrors.license_plate}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الماركة *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.make ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.make && <span className="text-red-500 text-xs">{formErrors.make}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الموديل *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.model ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.model && <span className="text-red-500 text-xs">{formErrors.model}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السنة *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.year ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.year && <span className="text-red-500 text-xs">{formErrors.year}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">اللون</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر اليومي *</label>
                  <input
                    type="text"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${formErrors.daily_rate ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {formErrors.daily_rate && <span className="text-red-500 text-xs">{formErrors.daily_rate}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">إلغاء</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'جاري التحديث...' : 'تحديث'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">حذف السيارة</h3>
              <p className="text-slate-500 mb-4">
                هل أنت متأكد من حذف السيارة "{selectedVehicle.name}"؟
                <br/>
                <span className="text-red-500">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">إلغاء</button>
              <button onClick={handleDeleteVehicle} disabled={isDeleting} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}