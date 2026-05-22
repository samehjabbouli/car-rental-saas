'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { StatsCard } from '@/components/ui/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RevenueChart, FleetStatusPieChart } from '@/components/charts/reports-charts'
import { useToast } from '@/contexts/toast-context'
import {
  Car,
  CalendarDays,
  Users,
  Receipt,
  TrendingUp,
  Plus,
  Eye,
  ArrowRight,
} from 'lucide-react'
import type { Vehicle, Booking, Customer } from '@/types/database'

export function CompanyDashboard() {
  const { user, company } = useAuth()
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!user?.company_id) return

    setIsLoading(true)
    try {
      const companyId = user.company_id

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', companyId)

      setVehicles(vehiclesData || [])

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, customer:customers(full_name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5)

      setBookings(bookingsData || [])

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)

      setCustomers(customersData || [])

      // Calculate stats
      const available = vehiclesData?.filter(v => v.status === 'available').length || 0
      const rented = vehiclesData?.filter(v => v.status === 'rented').length || 0
      const maintenance = vehiclesData?.filter(v => v.status === 'maintenance').length || 0

      const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0

      setStats({
        totalVehicles: vehiclesData?.length || 0,
        availableVehicles: available,
        rentedVehicles: rented,
        maintenanceVehicles: maintenance,
        totalBookings: bookingsData?.length || 0,
        pendingBookings,
        totalCustomers: customersData?.length || 0,
        monthlyRevenue: 125000, // Mock data - in production, calculate from actual bookings
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mock chart data
  const revenueData = [
    { month: 'يناير', revenue: 45000 },
    { month: 'فبراير', revenue: 52000 },
    { month: 'مارس', revenue: 48000 },
    { month: 'أبريل', revenue: 61000 },
    { month: 'مايو', revenue: 55000 },
    { month: 'يونيو', revenue: 68000 },
  ]

  const fleetData = [
    { name: 'متاح', value: stats.availableVehicles },
    { name: 'مؤجر', value: stats.rentedVehicles },
    { name: 'صيانة', value: stats.maintenanceVehicles },
  ]

  const bookingsColumns: any[] = [
    { key: 'booking_number', label: 'رقم الحجز' },
    {
      key: 'customer',
      label: 'العميل',
      render: (v: unknown) => (v as { full_name?: string })?.full_name || '-',
    },
    {
      key: 'pickup_date',
      label: 'تاريخ الاستلام',
      render: (v: unknown) => new Date(v as string).toLocaleDateString('ar-SA'),
    },
    {
      key: 'return_date',
      label: 'تاريخ التسليم',
      render: (v: unknown) => new Date(v as string).toLocaleDateString('ar-SA'),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (v: unknown) => <StatusBadge status={v as string} />,
    },
    {
      key: 'total_amount',
      label: 'المبلغ',
      render: (v: unknown) => `${(v as number)?.toLocaleString() || 0} SAR`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {company?.name || 'لوحة التحكم'}
          </h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم الشركة</p>
        </div>
        <div className="flex gap-2">
          <Link href="/fleet/new">
            <Button>
              <Plus className="h-4 w-4" />
              إضافة سيارة
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button variant="secondary">
              <CalendarDays className="h-4 w-4" />
              حجز جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إجمالي السيارات"
          value={stats.totalVehicles}
          icon={<Car className="h-6 w-6" />}
        />
        <StatsCard
          title="الحجوزات النشطة"
          value={stats.pendingBookings}
          icon={<CalendarDays className="h-6 w-6" />}
          change={5}
        />
        <StatsCard
          title="إجمالي العملاء"
          value={stats.totalCustomers}
          icon={<Users className="h-6 w-6" />}
          change={12}
        />
        <StatsCard
          title="الإيرادات الشهرية"
          value={`${(stats.monthlyRevenue / 1000).toFixed(0)}K`}
          icon={<Receipt className="h-6 w-6" />}
          change={18}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <FleetStatusPieChart data={fleetData} />
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>آخر الحجوزات</CardTitle>
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  عرض الكل
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table
              data={bookings}
              columns={bookingsColumns}
              isLoading={isLoading}
              emptyMessage="لا توجد حجوزات"
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/bookings/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">حجز جديد</p>
                    <p className="text-xs text-muted-foreground">إنشاء حجز سيارة</p>
                  </div>
                </div>
              </Link>
              <Link href="/customers/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">إضافة عميل</p>
                    <p className="text-xs text-muted-foreground">تسجيل عميل جديد</p>
                  </div>
                </div>
              </Link>
              <Link href="/fleet/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">إضافة سيارة</p>
                    <p className="text-xs text-muted-foreground">تسجيل سيارة جديدة</p>
                  </div>
                </div>
              </Link>
              <Link href="/reports" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <TrendingUp className="h-5 w-5" />
</div>
                  <div>
                    <p className="font-medium">التقارير</p>
                    <p className="text-xs text-muted-foreground">عرض التقارير المالية</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}