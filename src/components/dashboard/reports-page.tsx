'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Car,
  Users,
  Printer,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export function ReportsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [dateRange, setDateRange] = useState('month')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for charts - in production, fetch from API
  const revenueData = [
    { month: 'يناير', revenue: 125000, bookings: 45 },
    { month: 'فبراير', revenue: 150000, bookings: 52 },
    { month: 'مارس', revenue: 180000, bookings: 61 },
    { month: 'أبريل', revenue: 165000, bookings: 58 },
    { month: 'مايو', revenue: 200000, bookings: 72 },
    { month: 'يونيو', revenue: 220000, bookings: 85 },
  ]

  const fleetStatusData = [
    { name: 'متاح', value: 35 },
    { name: 'مؤجر', value: 45 },
    { name: 'صيانة', value: 12 },
    { name: 'محجوز', value: 8 },
  ]

  const topVehiclesData = [
    { name: 'كامري 2024', revenue: 85000, bookings: 42 },
    { name: 'سدانا 2024', revenue: 72000, bookings: 38 },
    { name: 'اكسنت 2023', revenue: 58000, bookings: 35 },
    { name: 'هونداي 2024', revenue: 45000, bookings: 28 },
    { name: 'كيا 2023', revenue: 38000, bookings: 22 },
  ]

  const customerGrowthData = [
    { month: 'يناير', newCustomers: 12, total: 145 },
    { month: 'فبراير', newCustomers: 18, total: 163 },
    { month: 'مارس', newCustomers: 15, total: 178 },
    { month: 'أبريل', newCustomers: 22, total: 200 },
    { month: 'مايو', newCustomers: 25, total: 225 },
    { month: 'يونيو', newCustomers: 30, total: 255 },
  ]

  const revenueByCategoryData = [
    { category: 'SUV', revenue: 85000 },
    { category: 'سيدان', revenue: 120000 },
    { category: 'كروس أوفر', revenue: 65000 },
    { category: 'بيك أب', revenue: 48000 },
  ]

  // Calculate summary stats
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const totalBookings = revenueData.reduce((sum, d) => sum + d.bookings, 0)
  const avgBookingValue = totalRevenue / totalBookings

  const handleExport = (type: string) => {
    // In production, implement actual export functionality
    alert(`تصدير ${type} - سيتم تنزيل الملف قريباً`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">تحليل الأداء والمبيعات</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذه السنة</option>
          </select>
          <Button variant="outline" onClick={() => handleExport('PDF')}>
<Download className="h-4 w-4" />
            تصدير PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('Excel')}>
            <FileText className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15% من الشهر الماضي
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الحجوزات</p>
                <p className="text-2xl font-bold mt-1">{totalBookings}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% من الشهر الماضي
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط قيمة الحجز</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(avgBookingValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">لكل حجز</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold mt-1">255</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +30 هذا الشهر
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>تطور الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fleet Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالة الأسطول</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fleetStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle>نمو العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="إجمالي العملاء" />
                <Line type="monotone" dataKey="newCustomers" stroke="#22c55e" strokeWidth={2} name="عملاء جدد" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByCategoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v) => `${v / 1000}K`} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} stroke="#6b7280" width={80} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Vehicles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>أفضل السيارات</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExport('vehicles')}>
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-right text-sm font-medium">#</th>
                  <th className="p-3 text-right text-sm font-medium">اسم السيارة</th>
                  <th className="p-3 text-center text-sm font-medium">عدد الحجوزات</th>
                  <th className="p-3 text-left text-sm font-medium">الإيرادات</th>
                  <th className="p-3 text-left text-sm font-medium">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {topVehiclesData.map((vehicle, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{vehicle.name}</td>
                    <td className="p-3 text-center">{vehicle.bookings}</td>
                    <td className="p-3 text-left">{formatCurrency(vehicle.revenue)}</td>
                    <td className="p-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(vehicle.revenue / topVehiclesData[0].revenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((vehicle.revenue / totalRevenue) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}