'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

interface Customer {
  id?: string
  full_name: string
  email: string
  phone: string
  nationality: string
  passport_number?: string
  license_number?: string
  address?: string
  notes?: string
  created_at?: string
}

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const [formData, setFormData] = useState<Customer>({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    passport_number: '',
    license_number: '',
    address: '',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      window.location.href = '/login-test'
      return
    }
    fetchCustomers(token)
  }, [])

  useEffect(() => {
    const filtered = customers.filter(c => {
      const searchLower = searchQuery.toLowerCase()
      return (
        c.full_name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(searchQuery) ||
        c.nationality?.toLowerCase().includes(searchLower) ||
        c.passport_number?.includes(searchQuery)
      )
    })
    setFilteredCustomers(filtered)
  }, [customers, searchQuery])

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchCustomers(token: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setCustomers(Array.isArray(data) ? data : [])
      setFilteredCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      showToast('فشل في تحميل العملاء', 'error')
    }
    setIsLoading(false)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!formData.full_name?.trim()) {
      errors.full_name = 'الاسم مطلوب'
    } else if (formData.full_name.length < 3) {
      errors.full_name = 'الاسم يجب أن يكون 3 أحرف على الأقل'
    }

    if (!formData.email?.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صالح'
    }

    if (!formData.phone?.trim()) {
      errors.phone = 'رقم الهاتف مطلوب'
    } else if (!/^[0-9+\-\s]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'رقم الهاتف غير صالح'
    }

    if (!formData.nationality?.trim()) {
      errors.nationality = 'الجنسية مطلوبة'
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
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
        throw new Error(errorData.message || 'فشل في إضافة العميل')
      }

      showToast('تم إضافة العميل بنجاح', 'success')
      setShowAddModal(false)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        nationality: '',
        passport_number: '',
        license_number: '',
        address: '',
        notes: ''
      })
      fetchCustomers(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في إضافة العميل', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm() || !selectedCustomer?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const { created_at, ...updateData } = formData
      const response = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${selectedCustomer.id}`, {
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
        throw new Error(errorData.message || 'فشل في تحديث العميل')
      }

      showToast('تم تحديث بيانات العميل بنجاح', 'success')
      setShowEditModal(false)
      setSelectedCustomer(null)
      fetchCustomers(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في تحديث العميل', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleDelete() {
    if (!selectedCustomer?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${selectedCustomer.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في حذف العميل')
      }

      showToast('تم حذف العميل بنجاح', 'success')
      setShowDeleteModal(false)
      setSelectedCustomer(null)
      fetchCustomers(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف العميل', 'error')
    }
    setIsSubmitting(false)
  }

  function openEditModal(customer: Customer) {
    setSelectedCustomer(customer)
    setFormData({ ...customer })
    setFormErrors({})
    setShowEditModal(true)
  }

  function openDeleteModal(customer: Customer) {
    setSelectedCustomer(customer)
    setShowDeleteModal(true)
  }

  function handleLogout() {
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('sb_refresh_token')
    localStorage.removeItem('sb_user_id')
    window.location.href = '/login-test'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
            <p className="text-slate-500">إجمالي: {customers.length} عميل</p>
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
            { href: '/bookings', icon: '📅', label: 'الحجوزات', bg: 'bg-purple-500' },
            { href: '/invoices', icon: '💰', label: 'الفواتير', bg: 'bg-pink-500' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`${item.bg} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold">{customers.length}</div>
            <div className="text-slate-500">إجمالي العملاء</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">🌍</div>
            <div className="text-2xl font-bold">{new Set(customers.map(c => c.nationality)).size}</div>
            <div className="text-slate-500">جنسيات مختلفة</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📧</div>
            <div className="text-2xl font-bold">{customers.filter(c => c.email).length}</div>
            <div className="text-slate-500">بريد إلكتروني</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-2xl font-bold">{customers.filter(c => c.phone).length}</div>
            <div className="text-slate-500">رقم هاتف</div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">قائمة العملاء</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 بحث بالاسم أو الهاتف أو البريد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
              <button
                onClick={() => {
                  setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    nationality: '',
                    passport_number: '',
                    license_number: '',
                    address: '',
                    notes: ''
                  })
                  setFormErrors({})
                  setShowAddModal(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                + إضافة عميل
              </button>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-slate-500">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء بعد'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  إضافة أول عميل
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الاسم</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الهاتف</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">البريد</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الجنسية</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">رقم الجواز</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">العنوان</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, index) => (
                    <tr key={c.id || index} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium">{c.full_name}</td>
                      <td className="py-3 px-4">{c.phone || '-'}</td>
                      <td className="py-3 px-4">{c.email || '-'}</td>
                      <td className="py-3 px-4">{c.nationality || '-'}</td>
                      <td className="py-3 px-4">{c.passport_number || '-'}</td>
                      <td className="py-3 px-4 truncate max-w-32">{c.address || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
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
              <h3 className="text-xl font-semibold">إضافة عميل جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.full_name ? 'border-red-500' : ''}`}
                    placeholder="أدخل الاسم الكامل"
                  />
                  {formErrors.full_name && <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : ''}`}
                    placeholder="example@email.com"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="+966XXXXXXXXX"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الجنسية *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.nationality ? 'border-red-500' : ''}`}
                    placeholder="أدخل الجنسية"
                  />
                  {formErrors.nationality && <p className="text-red-500 text-sm mt-1">{formErrors.nationality}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الجواز</label>
                  <input
                    type="text"
                    value={formData.passport_number}
                    onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم الجواز"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الرخصة</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم رخصة القيادة"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="عنوان السكن"
                  />
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
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ العميل'}
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
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">تعديل بيانات العميل</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.full_name ? 'border-red-500' : ''}`}
                    placeholder="أدخل الاسم الكامل"
                  />
                  {formErrors.full_name && <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : ''}`}
                    placeholder="example@email.com"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="+966XXXXXXXXX"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الجنسية *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.nationality ? 'border-red-500' : ''}`}
                    placeholder="أدخل الجنسية"
                  />
                  {formErrors.nationality && <p className="text-red-500 text-sm mt-1">{formErrors.nationality}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الجواز</label>
                  <input
                    type="text"
                    value={formData.passport_number}
                    onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم الجواز"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الرخصة</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم رخصة القيادة"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="عنوان السكن"
                  />
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
                  {isSubmitting ? 'جاري التحديث...' : 'تحديث البيانات'}
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
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">تأكيد الحذف</h3>
              <p className="text-slate-600 mb-4">
                هل أنت متأكد من حذف العميل <strong>{selectedCustomer.full_name}</strong>؟
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
                    setSelectedCustomer(null)
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