'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Building2,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import type { User } from '@/types/database'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarLink {
  title: string
  href: string
  icon?: LucideIcon
  children?: { title: string; href: string }[]
}

interface SidebarProps {
  user: User | null
}

const superAdminLinks: SidebarLink[] = [
  {
    title: 'لوحة التحكم',
    href: '/super-admin',
    icon: LayoutDashboard,
  },
  {
    title: 'الشركات',
    href: '/super-admin/companies',
    icon: Building2,
  },
  {
    title: 'الإحصائيات',
    href: '/super-admin/reports',
    icon: BarChart3,
  },
  {
    title: 'الإعدادات',
    href: '/super-admin/settings',
    icon: Settings,
  },
]

const companyLinks: SidebarLink[] = [
  {
    title: 'لوحة التحكم',
    href: '/company',
    icon: LayoutDashboard,
  },
  {
    title: 'الأسطول',
    href: '/fleet',
    icon: Car,
    children: [
      { title: 'جميع السيارات', href: '/fleet' },
      { title: 'الصيانة', href: '/fleet/maintenance' },
      { title: 'التصنيفات', href: '/fleet/categories' },
    ],
  },
  {
    title: 'الحجوزات',
    href: '/bookings',
    icon: CalendarDays,
    children: [
      { title: 'جميع الحجوزات', href: '/bookings' },
      { title: 'حجز جديد', href: '/bookings/new' },
      { title: 'التقويم', href: '/bookings/calendar' },
    ],
  },
  {
    title: 'العملاء',
    href: '/customers',
    icon: Users,
    children: [
      { title: 'جميع العملاء', href: '/customers' },
      { title: 'القائمة السوداء', href: '/customers/blacklist' },
    ],
  },
  {
    title: 'العقود',
    href: '/contracts',
    icon: FileText,
  },
  {
    title: 'الفواتير',
    href: '/invoices',
    icon: Receipt,
  },
  {
    title: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    children: [
      { title: 'الإيرادات', href: '/reports/revenue' },
      { title: 'الأسطول', href: '/reports/fleet' },
      { title: 'الحجوزات', href: '/reports/bookings' },
    ],
  },
  {
    title: 'الإعدادات',
    href: '/settings',
    icon: Settings,
    children: [
      { title: 'الفروع', href: '/settings/branches' },
      { title: 'المستخدمين', href: '/settings/users' },
      { title: 'الصلاحيات', href: '/settings/permissions' },
    ],
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const links = user?.role === 'super_admin' ? superAdminLinks : companyLinks

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={cn(
        'flex flex-col border-l bg-card transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-lg">CarRental</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {links.map(link => (
            <li key={link.title}>
              {link.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(link.title)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && <link.icon className="h-5 w-5" />}
                      {!isCollapsed && link.title}
                    </span>
                    {!isCollapsed && (
                      expandedItems.includes(link.title) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    )}
                  </button>
                  {expandedItems.includes(link.title) && !isCollapsed && (
                    <ul className="mt-1 mr-6 space-y-1">
                      {link.children.map(child => (
                        <li key={child.title}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block rounded-lg px-3 py-2 text-sm transition-colors',
                              pathname === child.href
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent'
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  {!isCollapsed && link.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="border-t p-4">
        {user && (
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          className={cn(
            'mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && 'تسجيل الخروج'}
        </button>
      </div>
    </aside>
  )
}