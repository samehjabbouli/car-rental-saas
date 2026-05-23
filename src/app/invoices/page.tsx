'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

interface Invoice {
  id?: string
  booking_id?: string
  contract_id?: string
  customer_id?: string
  invoice_number?: string
  issue_date: string
  due_date?: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  amount_paid?: number
  status: string
  notes?: string
  created_at?: string
  customer_name?: string
}

interface Customer {
  id: string
  full_name: string
}

interface Booking {
  id: string
}

interface Contract {
  id: string
}

interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function InvoicesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const [formData, setFormData] = useState<Invoice>({
    booking_id: '',
    contract_id: '',
    customer_id: '',
    invoice_number: '',
    issue_date: '',
    due_date: '',
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    amount_paid: 0,
    status: 'draft',
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
    const filtered = invoices.filter(inv => {
      const matchesSearch = searchQuery === '' ||
        inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter

      return matchesSearch && matchesStatus
    })
    setFilteredInvoices(filtered)
  }, [invoices, searchQuery, statusFilter])

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchData(token: string) {
    try {
      // Fetch invoices
      const invoicesRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const invoicesData = await invoicesRes.json()
      const invoicesList = Array.isArray(invoicesData) ? invoicesData : []

      // Fetch customers
      const customersRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id,full_name&order=full_name.asc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const customersData = await customersRes.json()
      setCustomers(Array.isArray(customersData) ? customersData : [])

      // Fetch bookings
      const bookingsRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const bookingsData = await bookingsRes.json()
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])

      // Fetch contracts
      const contractsRes = await fetch(`${SUPABASE_URL}/rest/v1/contracts?select=id&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const contractsData = await contractsRes.json()
      setContracts(Array.isArray(contractsData) ? contractsData : [])

      // Map customer names to invoices
      const invoicesWithDetails = invoicesList.map((inv: Invoice) => {
        const customer = customers.find((c: Customer) => c.id === inv.customer_id)
        return {
          ...inv,
          customer_name: customer?.full_name || '-'
        }
      })

      setInvoices(invoicesWithDetails)
      setFilteredInvoices(invoicesWithDetails)
    } catch (err) {
      console.error('Error fetching data:', err)
      showToast('فشل في تحميل البيانات', 'error')
    }
    setIsLoading(false)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!formData.invoice_number?.trim()) {
      errors.invoice_number = 'رقم الفاتورة مطلوب'
    }

    if (!formData.customer_id) {
      errors.customer_id = 'اختر العميل'
    }

    if (!formData.issue_date) {
      errors.issue_date = 'تاريخ الإصدار مطلوب'
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
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
        throw new Error(errorData.message || 'فشل في إضافة الفاتورة')
      }

      showToast('تم إضافة الفاتورة بنجاح', 'success')
      setShowAddModal(false)
      resetForm()
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في إضافة الفاتورة', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm() || !selectedInvoice?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const { created_at, customer_name, ...updateData } = formData
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${selectedInvoice.id}`, {
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
        throw new Error(errorData.message || 'فشل في تحديث الفاتورة')
      }

      showToast('تم تحديث الفاتورة بنجاح', 'success')
      setShowEditModal(false)
      setSelectedInvoice(null)
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في تحديث الفاتورة', 'error')
    }
    setIsSubmitting(false)
  }

  async function handleDelete() {
    if (!selectedInvoice?.id) return

    setIsSubmitting(true)
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      showToast('انتهت صلاحية الجلسة', 'error')
      window.location.href = '/login-test'
      return
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${selectedInvoice.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في حذف الفاتورة')
      }

      showToast('تم حذف الفاتورة بنجاح', 'success')
      setShowDeleteModal(false)
      setSelectedInvoice(null)
      fetchData(token)
    } catch (err: any) {
      showToast(err.message || 'فشل في حذف الفاتورة', 'error')
    }
    setIsSubmitting(false)
  }

  function resetForm() {
    setFormData({
      booking_id: '',
      contract_id: '',
      customer_id: '',
      invoice_number: '',
      issue_date: '',
      due_date: '',
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      amount_paid: 0,
      status: 'draft',
      notes: ''
    })
    setFormErrors({})
  }

  function openEditModal(invoice: Invoice) {
    setSelectedInvoice(invoice)
    setFormData({ ...invoice })
    setFormErrors({})
    setShowEditModal(true)
  }

  function openDeleteModal(invoice: Invoice) {
    setSelectedInvoice(invoice)
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
      case 'paid': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'paid': return 'مدفوعة'
      case 'pending': return 'معلقة'
      case 'overdue': return 'متأخرة'
      case 'draft': return 'مسودة'
      case 'cancelled': return 'ملغية'
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
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalRevenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    totalPending: invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
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
            <h1 className="text-2xl font-bold text-slate-900">الفواتير</h1>
            <p className="text-slate-500">إجمالي: {invoices.length} فاتورة</p>
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
            { href: '/bookings', icon: '📅', label: 'الحجوزات', bg: 'bg-pink-500' },
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
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-slate-500">إجمالي الفواتير</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <div className="text-slate-500">مدفوعة</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-slate-500">معلقة</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">💵</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-slate-500">المدفوع</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
            <div className="text-slate-500">المعلق</div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">قائمة الفواتير</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 بحث برقم الفاتورة أو العميل..."
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
                <option value="draft">مسودة</option>
                <option value="pending">معلق</option>
                <option value="paid">مدفوعة</option>
                <option value="overdue">متأخرة</option>
                <option value="cancelled">ملغية</option>
              </select>
              <button
                onClick={() => {
                  resetForm()
                  setShowAddModal(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                + إنشاء فاتورة
              </button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-slate-500">
                {searchQuery || statusFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد فواتير بعد'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  إنشاء أول فاتورة
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">رقم الفاتورة</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">العميل</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">تاريخ الإصدار</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">تاريخ الاستحقاق</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">المبلغ الإجمالي</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">المدفوع</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, index) => (
                    <tr key={inv.id || index} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">{inv.invoice_number || `#${inv.id?.slice(0, 8)}`}</td>
                      <td className="py-3 px-4 font-medium">{inv.customer_name}</td>
                      <td className="py-3 px-4">{formatDate(inv.issue_date)}</td>
                      <td className="py-3 px-4">{formatDate(inv.due_date || '')}</td>
                      <td className="py-3 px-4 font-medium">{inv.total_amount ? formatCurrency(inv.total_amount) : '-'}</td>
                      <td className="py-3 px-4">{inv.amount_paid ? formatCurrency(inv.amount_paid) : '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm border ${getStatusColor(inv.status)}`}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(inv)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteModal(inv)}
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
              <h3 className="text-xl font-semibold">إنشاء فاتورة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الفاتورة *</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.invoice_number ? 'border-red-500' : ''}`}
                    placeholder="مثال: INV-2024-001"
                  />
                  {formErrors.invoice_number && <p className="text-red-500 text-sm mt-1">{formErrors.invoice_number}</p>}
                </div>

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الحجز</label>
                  <select
                    value={formData.booking_id}
                    onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الحجز (اختياري)</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>#{b.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم العقد</label>
                  <select
                    value={formData.contract_id}
                    onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر العقد (اختياري)</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>#{c.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الإصدار *</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.issue_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.issue_date && <p className="text-red-500 text-sm mt-1">{formErrors.issue_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ الفرعي</label>
                  <input
                    type="number"
                    value={formData.subtotal || ''}
                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الضريبة</label>
                  <input
                    type="number"
                    value={formData.tax_amount || ''}
                    onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">المدفوع</label>
                  <input
                    type="number"
                    value={formData.amount_paid || ''}
                    onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
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
                    <option value="draft">مسودة</option>
                    <option value="pending">معلق</option>
                    <option value="paid">مدفوعة</option>
                    <option value="overdue">متأخرة</option>
                    <option value="cancelled">ملغية</option>
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
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
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
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">تعديل الفاتورة</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الفاتورة *</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.invoice_number ? 'border-red-500' : ''}`}
                    placeholder="مثال: INV-2024-001"
                  />
                  {formErrors.invoice_number && <p className="text-red-500 text-sm mt-1">{formErrors.invoice_number}</p>}
                </div>

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الحجز</label>
                  <select
                    value={formData.booking_id}
                    onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الحجز (اختياري)</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>#{b.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم العقد</label>
                  <select
                    value={formData.contract_id}
                    onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر العقد (اختياري)</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>#{c.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الإصدار *</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.issue_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.issue_date && <p className="text-red-500 text-sm mt-1">{formErrors.issue_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ الفرعي</label>
                  <input
                    type="number"
                    value={formData.subtotal || ''}
                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الضريبة</label>
                  <input
                    type="number"
                    value={formData.tax_amount || ''}
                    onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">المدفوع</label>
                  <input
                    type="number"
                    value={formData.amount_paid || ''}
                    onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
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
                    <option value="draft">مسودة</option>
                    <option value="pending">معلق</option>
                    <option value="paid">مدفوعة</option>
                    <option value="overdue">متأخرة</option>
                    <option value="cancelled">ملغية</option>
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
                  {isSubmitting ? 'جاري التحديث...' : 'تحديث الفاتورة'}
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
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">تأكيد الحذف</h3>
              <p className="text-slate-600 mb-4">
                هل أنت متأكد من حذف الفاتورة <strong>{selectedInvoice.invoice_number || `#${selectedInvoice.id?.slice(0, 8)}`}</strong>؟
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
                    setSelectedInvoice(null)
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