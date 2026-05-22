'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

export default function FleetPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('sb_access_token')
    const userId = localStorage.getItem('sb_user_id')
    
    if (!token || !userId) {
      window.location.href = '/login-test'
      return
    }
    
    // Fetch user data
    fetchUserData(userId, token)
    fetchVehicles(token)
  }, [])

  async function fetchUserData(userId: string, token: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data && data.length > 0) {
        setUser(data[0])
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
    setIsLoading(false)
  }

  async function fetchVehicles(token: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=*&order=created_at.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setVehicles([])
    }
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الأسطول</h1>
          <p className="text-slate-500">إدارة سيارات الشركة</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200"
        >
          تسجيل الخروج
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">🚗</div>
          <div className="text-2xl font-bold text-slate-900">{vehicles.length}</div>
          <div className="text-slate-500">إجمالي السيارات</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'available').length}</div>
          <div className="text-slate-500">متاحة</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-yellow-600">{vehicles.filter(v => v.status === 'rented').length}</div>
          <div className="text-slate-500">مؤجرة</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl mb-2">🔧</div>
          <div className="text-2xl font-bold text-red-600">{vehicles.filter(v => v.status === 'maintenance').length}</div>
          <div className="text-slate-500">صيانة</div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { href: '/company', icon: '🏠', label: 'لوحة التحكم', color: 'bg-blue-500' },
          { href: '/customers', icon: '👥', label: 'العملاء', color: 'bg-green-500' },
          { href: '/bookings', icon: '📅', label: 'الحجوزات', color: 'bg-purple-500' },
          { href: '/invoices', icon: '💰', label: 'الفواتير', color: 'bg-pink-500' },
        ].map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className={`${item.color} text-white p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Vehicles List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">قائمة السيارات</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + إضافة سيارة
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-slate-500">لا توجد سيارات بعد</p>
            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              إضافة أول سيارة
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">السيارة</th>
                  <th className="text-right py-3 px-4">رقم اللوحة</th>
                  <th className="text-right py-3 px-4">الماركة</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">السعر اليومي</th>
                  <th className="text-right py-3 px-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-2xl">
                          🚗
                        </div>
                        <div>
                          <div className="font-semibold">{vehicle.name}</div>
                          <div className="text-sm text-slate-500">{vehicle.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">{vehicle.plate_number || '-'}</td>
                    <td className="py-3 px-4">{vehicle.brand}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                        vehicle.status=== 'rented' ? 'bg-yellow-100 text-yellow-700' :
                        vehicle.status === 'maintenance' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {vehicle.status === 'available' ? 'متاحة' :
                         vehicle.status === 'rented' ? 'مؤجرة' :
                         vehicle.status === 'maintenance' ? 'صيانة' : vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{vehicle.daily_rate ? `${vehicle.daily_rate} ر.س` : '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg" title="عرض">👁️</button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg" title="تعديل">✏️</button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg" title="حذف">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}