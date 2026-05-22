'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Table, StatusBadge, Pagination } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/contexts/toast-context'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Building2,
  MoreVertical,
  X,
} from 'lucide-react'
import type { Company } from '@/types/database'

export function CompaniesManagement() {
  const supabase = createClient()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const pageSize = 10

  useEffect(() => {
    fetchCompanies()
  }, [page, searchQuery, statusFilter])

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      setCompanies(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
      addToast({ type: 'error', title: 'خطأ في تحميل الشركات' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return

    try {
      const { error } = await supabase.from('companies').delete().eq('id', id)
      if (error) throw error

      addToast({ type: 'success', title: 'تم حذف الشركة بنجاح' })
      fetchCompanies()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ أثناء الحذف' })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث الحالة' })
      fetchCompanies()
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const columns: any[] = [
    {
      key: 'name',
      label: 'اسم الشركة',
      sortable: true,
      render: (v: unknown, row: Company) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{String(v || '-')}</p>
            {row.commercial_name && (
              <p className="text-xs text-muted-foreground">{row.commercial_name}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'الهاتف' },
    {
      key: 'status',
      label: 'الحالة',
      render: (v: unknown) => <StatusBadge status={v as string} />,
    },
    {
      key: 'subscription_plan',
      label: 'الباقة',
      render: (v: unknown) => (
        <span className="capitalize">{(v as string) || '-'}</span>
      ),
    },
    {
      key: 'max_vehicles',
      label: 'السيارات',
      align: 'center',
    },
    {
      key: 'created_at',
      label: 'تاريخ التسجيل',
      render: (v: unknown) => new Date(v as string).toLocaleDateString('ar-SA'),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      align: 'center' as const,
      render: (_: unknown, row: Company) => (
        <div className="flex items-center gap-1 justify-center">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الشركات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الشركات المسجلة</p>
        </div>
        <Link href="/super-admin/companies/new">
          <Button>
            <Plus className="h-4 w-4" />
            إضافة شركة
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="trial">تجريبي</option>
              <option value="suspended">موقوف</option>
              <option value="expired">منتهي</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            data={companies}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="لا توجد شركات"
          />
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / pageSize)}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}