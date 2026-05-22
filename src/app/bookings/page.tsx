'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

export default function BookingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      window.location.href = '/login-test'
      return
    }
    fetchBookings(token)
  }, [])

  async function fetchBookings(token: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error:', err)
    }
    setIsLoading(false)
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الحجوزات</h1>
          <p className="text-slate-500">قائمة الحجوزات</p>
        </div>
        <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200">
          تسجيل الخروج
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-2xl font-bold">{bookings.length}</div>
          <div className="text-slate-500">إجمالي الحجوزات</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { href: '/company', icon: '🏠', label: 'لوحة التحكم', bg: 'bg-blue-500' },
          { href: '/fleet', icon: '🚗', label: 'الأسطول', bg: 'bg-green-500' },
          { href: '/customers', icon: '👥', label: 'العملاء', bg: 'bg-purple-500' },
          { href: '/invoices', icon: '💰', label: 'الفواتير', bg: 'bg-pink-500' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={`${item.bg} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">قائمة الحجوزات</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ إضافة حجز</button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-slate-500">لا توجد حجوزات بعد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">رقم الحجز</th>
                <th className="text-right py-3 px-4">العميل</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">تاريخ البداية</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono">#{b.id.slice(0, 8)}</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{b.start_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}