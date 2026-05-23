// Unified Dashboard with Sidebar
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

type Section = 'dashboard' | 'fleet' | 'customers' | 'bookings' | 'contracts' | 'invoices' | 'reports' | 'settings'

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  license_plate: string
  daily_rate: number
  status: string
}

interface Customer {
  id: string
  full_name: string
  email: string
  phone: string
}

interface Booking {
  id: string
  customer_id: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
}

interface Contract {
  id: string
  customer_id: string
  vehicle_id: string
  contract_number: string
  total_amount: number
  status: string
}

interface Invoice {
  id: string
  customer_id: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  status: string
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState<'vehicle' | 'customer' | 'booking' | 'contract' | 'invoice'>('vehicle')
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      window.location.href = '/login-test'
      return
    }
    fetchAllData(token)
  }, [])

  function showToast(message: string, type: string) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchAllData(token: string) {
    try {
      const [v, c, b, ct, i] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=*&order=created_at.desc&limit=100`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&order=created_at.desc&limit=100`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc&limit=100`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/contracts?select=*&order=created_at.desc&limit=100`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc&limit=100`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ])

      setVehicles(Array.isArray(v) ? v : [])
      setCustomers(Array.isArray(c) ? c : [])
      setBookings(Array.isArray(b) ? b : [])
      setContracts(Array.isArray(ct) ? ct : [])
      setInvoices(Array.isArray(i) ? i : [])
    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setIsLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('sb_access_token')
    localStorage.removeItem('sb_refresh_token')
    localStorage.removeItem('sb_user_id')
    window.location.href = '/login-test'
  }

  function openAddModal(type: typeof modalType) {
    setModalType(type)
    setEditingItem(null)
    setFormData({})
    setShowAddModal(true)
  }

  function openEditModal(type: typeof modalType, item: any) {
    setModalType(type)
    setEditingItem(item)
    setFormData({ ...item })
    setShowAddModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('sb_access_token')
    if (!token) return

    try {
      const tableMap: Record<string, string> = {
        vehicle: 'vehicles',
        customer: 'customers',
        booking: 'bookings',
        contract: 'contracts',
        invoice: 'invoices'
      }

      const table = tableMap[modalType]
      const method = editingItem ? 'PATCH' : 'POST'
      const url = editingItem
        ? `${SUPABASE_URL}/rest/v1/${table}?id=eq.${editingItem.id}`
        : `${SUPABASE_URL}/rest/v1/${table}`

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save')

      showToast(editingItem ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success')
      setShowAddModal(false)
      fetchAllData(token)
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ', 'error')
    }
  }

  async function handleDelete(id: string) {
    const tableMap: Record<string, string> = {
      vehicle: 'vehicles',
      customer: 'customers',
      booking: 'bookings',
      contract: 'contracts',
      invoice: 'invoices'
    }

    const token = localStorage.getItem('sb_access_token')
    if (!token) return

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableMap[modalType]}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete')

      showToast('تم الحذف بنجاح', 'success')
      fetchAllData(token)
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ', 'error')
    }
  }

  const menuItems = [
    { id: 'dashboard' as Section, icon: '🏠', label: 'الرئيسية', color: '#3b82f6' },
    { id: 'fleet' as Section, icon: '🚗', label: 'الأسطول', color: '#10b981' },
    { id: 'customers' as Section, icon: '👥', label: 'العملاء', color: '#f59e0b' },
    { id: 'bookings' as Section, icon: '📅', label: 'الحجوزات', color: '#6366f1' },
    { id: 'contracts' as Section, icon: '📄', label: 'العقود', color: '#ec4899' },
    { id: 'invoices' as Section, icon: '💰', label: 'الفواتير', color: '#8b5cf6' },
  ]

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ar-SA')
  }

  function getStatusBadge(status: string, type: 'vehicle' | 'booking' | 'contract' | 'invoice') {
    const colors: Record<string, { bg: string; text: string }> = {
      available: { bg: 'bg-green-100', text: 'text-green-700' },
      rented: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      maintenance: { bg: 'bg-red-100', text: 'text-red-700' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
      active: { bg: 'bg-green-100', text: 'text-green-700' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
      expired: { bg: 'bg-red-100', text: 'text-red-700' },
      paid: { bg: 'bg-green-100', text: 'text-green-700' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700' },
    }
    const labels: Record<string, string> = {
      available: 'متاح', rented: 'مؤجر', maintenance: 'صيانة',
      confirmed: 'مؤكد', pending: 'معلق', completed: 'مكتمل', cancelled: 'ملغي',
      active: 'نشط', draft: 'مسودة', expired: 'منتهي', paid: 'مدفوعة', overdue: 'متأخر'
    }
    const c = colors[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    return `<span class="${c.bg} ${c.text} px-2 py-1 rounded-full text-xs">${labels[status] || status}</span>`
  }

  const stats = {
    vehicles: vehicles.length,
    customers: customers.length,
    bookings: bookings.length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount_paid || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl">☰</button>
          {sidebarOpen && <span className="font-bold text-lg">Car Rental</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors ${
                activeSection === item.id ? 'bg-slate-700 border-r-4 border-blue-500' : ''
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span>خروج</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {menuItems.find(m => m.id === activeSection)?.label || 'لوحة التحكم'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">مدير النظام</span>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-4xl mb-2">🚗</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.vehicles}</div>
                  <div className="text-slate-500">إجمالي السيارات</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-4xl mb-2">👥</div>
                  <div className="text-3xl font-bold text-green-600">{stats.customers}</div>
                  <div className="text-slate-500">إجمالي العملاء</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-4xl mb-2">📅</div>
                  <div className="text-3xl font-bold text-purple-600">{stats.bookings}</div>
                  <div className="text-slate-500">إجمالي الحجوزات</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-4xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-pink-600">{formatCurrency(stats.revenue)}</div>
                  <div className="text-slate-500">إجمالي الإيرادات</div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold mb-4">إدارة النظام</h2>
                <div className="grid grid-cols-3 gap-4">
                  {menuItems.filter(m => m.id !== 'dashboard').map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 transition-colors flex items-center gap-3"
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fleet */}
          {activeSection === 'fleet' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">إدارة الأسطول</h2>
                <button
                  onClick={() => openAddModal('vehicle')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + إضافة سيارة
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right py-3 px-4">الاسم</th>
                      <th className="text-right py-3 px-4">الماركة</th>
                      <th className="text-right py-3 px-4">الموديل</th>
                      <th className="text-right py-3 px-4">اللوحة</th>
                      <th className="text-right py-3 px-4">السعر اليومي</th>
                      <th className="text-right py-3 px-4">الحالة</th>
                      <th className="text-right py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v, i) => (
                      <tr key={v.id || i} className="border-b">
                        <td className="py-3 px-4">{v.name}</td>
                        <td className="py-3 px-4">{v.make}</td>
                        <td className="py-3 px-4">{v.model}</td>
                        <td className="py-3 px-4">{v.license_plate}</td>
                        <td className="py-3 px-4">{formatCurrency(v.daily_rate)}</td>
                        <td className="py-3 px-4">
                          <span dangerouslySetInnerHTML={{ __html: getStatusBadge(v.status, 'vehicle') }} />
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => openEditModal('vehicle', v)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">✏️</button>
                          <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {vehicles.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-500">لا توجد سيارات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers */}
          {activeSection === 'customers' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">إدارة العملاء</h2>
                <button
                  onClick={() => openAddModal('customer')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + إضافة عميل
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right py-3 px-4">الاسم</th>
                      <th className="text-right py-3 px-4">البريد</th>
                      <th className="text-right py-3 px-4">الهاتف</th>
                      <th className="text-right py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.id || i} className="border-b">
                        <td className="py-3 px-4">{c.full_name}</td>
                        <td className="py-3 px-4">{c.email}</td>
                        <td className="py-3 px-4">{c.phone}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => openEditModal('customer', c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">✏️</button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">لا يوجد عملاء</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeSection === 'bookings' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">إدارة الحجوزات</h2>
                <button
                  onClick={() => openAddModal('booking')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + إضافة حجز
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right py-3 px-4">رقم الحجز</th>
                      <th className="text-right py-3 px-4">العميل</th>
                      <th className="text-right py-3 px-4">من</th>
                      <th className="text-right py-3 px-4">إلى</th>
                      <th className="text-right py-3 px-4">المبلغ</th>
                      <th className="text-right py-3 px-4">الحالة</th>
                      <th className="text-right py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => {
                      const customer = customers.find(c => c.id === b.customer_id)
                      return (
                        <tr key={b.id || i} className="border-b">
                          <td className="py-3 px-4 font-mono text-sm">#{b.id?.slice(0, 8)}</td>
                          <td className="py-3 px-4">{customer?.full_name || '-'}</td>
                          <td className="py-3 px-4">{formatDate(b.start_date)}</td>
                          <td className="py-3 px-4">{formatDate(b.end_date)}</td>
                          <td className="py-3 px-4">{formatCurrency(b.total_amount)}</td>
                          <td className="py-3 px-4">
                            <span dangerouslySetInnerHTML={{ __html: getStatusBadge(b.status, 'booking') }} />
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => openEditModal('booking', b)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">✏️</button>
                            <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">🗑️</button>
                          </td>
                        </tr>
                      )
                    })}
                    {bookings.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-slate-500">لا توجد حجوزات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contracts */}
          {activeSection === 'contracts' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">إدارة العقود</h2>
                <button
                  onClick={() => openAddModal('contract')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + إضافة عقد
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right py-3 px-4">رقم العقد</th>
                      <th className="text-right py-3 px-4">العميل</th>
                      <th className="text-right py-3 px-4">المبلغ</th>
                      <th className="text-right py-3 px-4">الحالة</th>
                      <th className="text-right py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, i) => {
                      const customer = customers.find(cu => cu.id === c.customer_id)
                      return (
                        <tr key={c.id || i} className="border-b">
                          <td className="py-3 px-4">{c.contract_number || `#${c.id?.slice(0, 8)}`}</td>
                          <td className="py-3 px-4">{customer?.full_name || '-'}</td>
                          <td className="py-3 px-4">{formatCurrency(c.total_amount)}</td>
                          <td className="py-3 px-4">
                            <span dangerouslySetInnerHTML={{ __html: getStatusBadge(c.status, 'contract') }} />
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => openEditModal('contract', c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">✏️</button>
                            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">🗑️</button>
                          </td>
                        </tr>
                      )
                    })}
                    {contracts.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا توجد عقود</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices */}
          {activeSection === 'invoices' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">إدارة الفواتير</h2>
                <button
                  onClick={() => openAddModal('invoice')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + إضافة فاتورة
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-right py-3 px-4">رقم الفاتورة</th>
                      <th className="text-right py-3 px-4">العميل</th>
                      <th className="text-right py-3 px-4">المبلغ</th>
                      <th className="text-right py-3 px-4">المدفوع</th>
                      <th className="text-right py-3 px-4">الحالة</th>
                      <th className="text-right py-3 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => {
                      const customer = customers.find(c => c.id === inv.customer_id)
                      return (
                        <tr key={inv.id || i} className="border-b">
                          <td className="py-3 px-4">{inv.invoice_number || `#${inv.id?.slice(0, 8)}`}</td>
                          <td className="py-3 px-4">{customer?.full_name || '-'}</td>
                          <td className="py-3 px-4">{formatCurrency(inv.total_amount)}</td>
                          <td className="py-3 px-4">{formatCurrency(inv.amount_paid)}</td>
                          <td className="py-3 px-4">
                            <span dangerouslySetInnerHTML={{ __html: getStatusBadge(inv.status, 'invoice') }} />
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => openEditModal('invoice', inv)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">✏️</button>
                            <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">🗑️</button>
                          </td>
                        </tr>
                      )
                    })}
                    {invoices.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-slate-500">لا توجد فواتير</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingItem ? 'تعديل' : 'إضافة'} {'vehicles' === 'vehicles' ? 'سيارة' : modalType === 'customer' ? 'عميل' : modalType === 'booking' ? 'حجز' : modalType === 'contract' ? 'عقد' : 'فاتورة'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'vehicle' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">اسم السيارة *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الماركة *</label>
                    <input
                      type="text"
                      value={formData.make || ''}
                      onChange={e => setFormData({ ...formData, make: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الموديل *</label>
                    <input
                      type="text"
                      value={formData.model || ''}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم اللوحة *</label>
                    <input
                      type="text"
                      value={formData.license_plate || ''}
                      onChange={e => setFormData({ ...formData, license_plate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">السعر اليومي *</label>
                    <input
                      type="number"
                      value={formData.daily_rate || ''}
                      onChange={e => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select
                      value={formData.status || 'available'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="available">متاح</option>
                      <option value="rented">مؤجر</option>
                      <option value="maintenance">صيانة</option>
                    </select>
</div>
                </div>
              )}

              {modalType === 'customer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={formData.full_name || ''}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">الجنسية</label>
                    <input
                      type="text"
                      value={formData.nationality || ''}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {modalType === 'booking' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">العميل *</label>
                    <select
                      value={formData.customer_id || ''}
                      onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">السيارة *</label>
                    <select
                      value={formData.vehicle_id || ''}
                      onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر السيارة</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ البداية *</label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ النهاية *</label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ</label>
                    <input
                      type="number"
                      value={formData.total_amount || ''}
                      onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="pending">معلق</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'contract' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم العقد *</label>
                    <input
                      type="text"
                      value={formData.contract_number || ''}
                      onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">العميل *</label>
                    <select
                      value={formData.customer_id || ''}
                      onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">السيارة *</label>
                    <select
                      value={formData.vehicle_id || ''}
                      onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر السيارة</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ الإجمالي</label>
                    <input
                      type="number"
                      value={formData.total_amount || ''}
                      onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="draft">مسودة</option>
                      <option value="active">نشط</option>
                      <option value="expired">منتهي</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'invoice' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">رقم الفاتورة *</label>
                    <input
                      type="text"
                      value={formData.invoice_number || ''}
                      onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">العميل *</label>
                    <select
                      value={formData.customer_id || ''}
                      onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاريخ الإصدار *</label>
                    <input
                      type="date"
                      value={formData.issue_date || ''}
                      onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المبلغ الإجمالي</label>
                    <input
                      type="number"
                      value={formData.total_amount || ''}
                      onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المدفوع</label>
                    <input
                      type="number"
                      value={formData.amount_paid || ''}
                      onChange={e => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الحالة</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="draft">مسودة</option>
                      <option value="pending">معلق</option>
                      <option value="paid">مدفوعة</option>
                      <option value="overdue">متأخرة</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'تحديث' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-slate-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}