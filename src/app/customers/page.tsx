'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token')
    if (!token) {
      window.location.href = '/login-test'
      return
    }
    fetchCustomers(token)
  }, [])

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
          <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="text-slate-500">قائمة عملاء الشركة</p>
        </div>
        <button onClick={handleLogout} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200">
          تسجيل الخروج
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">{customers.length}</div>
          <div className="text-slate-500">إجمالي العملاء</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { href: '/company', icon: '🏠', label: 'لوحة التحكم', bg: 'bg-blue-500' },
          { href: '/fleet', icon: '🚗', label: 'الأسطول', bg: 'bg-green-500' },
          { href: '/bookings', icon: '📅', label: 'الحجوزات', bg: 'bg-purple-500' },
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
          <h2 className="text-lg font-semibold">قائمة العملاء</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ إضافة عميل</button>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-500">لا يوجد عملاء بعد</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">الاسم</th>
                <th className="text-right py-3 px-4">الهاتف</th>
                <th className="text-right py-3 px-4">البريد</th>
                <th className="text-right py-3 px-4">الجنسية</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">{c.full_name}</td>
                  <td className="py-3 px-4">{c.phone}</td>
                  <td className="py-3 px-4">{c.email}</td>
                  <td className="py-3 px-4">{c.nationality || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}