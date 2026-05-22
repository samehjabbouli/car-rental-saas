'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/ui/stats-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RevenueChart, BookingsBarChart } from '@/components/charts/reports-charts'
import { useToast } from '@/contexts/toast-context'
import {
  Building2,
  Car,
  Users,
  CalendarDays,
  Receipt,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  MoreVertical,
} from 'lucide-react'
import type { Company } from '@/types/database'

export function SuperAdminDashboard() {
  const supabase = createClient()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    trialCompanies: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchData()
  }, [page])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch companies
      const { data: companiesData, count } = await supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      setCompanies(companiesData || [])

      // Fetch stats
      const { data: vehicles } = await supabase.from('vehicles').select('id', { count: 'exact', head: true })
      const { data: bookings } = await supabase.from('bookings').select('total_amount', { count: 'exact', head: true })
      const { data: allCompanies } = await supabase.from('companies').select('status')

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
      const activeCount = allCompanies?.filter(c => c.status === 'active').length || 0
      const trialCount = allCompanies?.filter(c => c.status === 'trial').length || 0

      setStats({
        totalCompanies: count || 0,
        activeCompanies: activeCount,
        trialCompanies: trialCount,
        totalVehicles: vehicles?.length || 0,
        totalBookings: bookings?.length || 0,
        totalRevenue,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast({ type: 'error', title: 'خطأ في تحميل البيانات' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', companyId)

      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث الحالة بنجاح' })
      fetchData()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  // Mock data for charts
  const revenueData = [
    { month: 'يناير', revenue: 125000 },
    { month: 'فبراير', revenue: 150000 },
    { month: 'مارس', revenue: 180000 },
    { month: 'أبريل', revenue: 165000 },
    { month: 'مايو', revenue: 200000 },
    { month: 'يونيو', revenue: 220000 },
  ]

  const bookingsData = [
    { month: 'يناير', bookings: 45 },
    { month: 'فبراير', bookings: 52 },
    { month: 'مارس', bookings: 61 },
    { month: 'أبريل', bookings: 58 },
    { month: 'مايو', bookings: 72 },
    { month: 'يونيو', bookings: 85 },
  ]

  const companiesColumns = [
    { key: 'name', label: 'اسم الشركة', sortable: true },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'status', label: 'الحالة', render: (v: any) => <StatusBadge status={v} /> },
    { key: 'subscription_plan', label: 'الباقة' },
    { key: 'max_vehicles', label: 'السيارات' },
    { key: 'created_at', label: 'تاريخ التسجيل', render: (v: any) => new Date(v).toLocaleDateString('ar-SA') },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (_: any, row: Company) => (
        <div className="flex items-center gap-2 justify-center">
          <Link href={`/super-admin/companies/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/super-admin/companies/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير العام</h1>
          <p className="text-muted-foreground">إدارة المنصة والشركات</p>
        </div>
        <Link href="/super-admin/companies/new">
          <Button>
            <Plus className="h-4 w-4" />
            إضافة شركة جديدة
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="إجمالي الشركات"
          value={stats.totalCompanies}
          icon={<Building2 className="h-6 w-6" />}
          change={12}
        />
        <StatsCard
          title="الشركات النشطة"
          value={stats.activeCompanies}
          icon={<Building2 className="h-6 w-6" />}
        />
        <StatsCard
          title="إجمالي السيارات"
          value={stats.totalVehicles}
          icon={<Car className="h-6 w-6" />}
          change={8}
        />
        <StatsCard
          title="الإيرادات"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={<Receipt className="h-6 w-6" />}
          change={15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <BookingsBarChart data={bookingsData} />
      </div>

      {/* Recent Companies */}
      <Card>
        <CardHeader>
          <CardTitle>الشركات المسجلة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={companies}
            columns={companiesColumns}
            isLoading={isLoading}
            emptyMessage="لا توجد شركات"
          />
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(stats.totalCompanies / pageSize)}
            totalItems={stats.totalCompanies}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}