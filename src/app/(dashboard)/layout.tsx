import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login-test')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">🚗 Car Rental SaaS</h1>
        </div>
        <nav className="flex-1 p-4">
          {[
            { href: '/company', icon: '🏠', label: 'لوحة التحكم' },
            { href: '/fleet', icon: '🚗', label: 'إدارة الأسطول' },
            { href: '/customers', icon: '👥', label: 'العملاء' },
            { href: '/bookings', icon: '📅', label: 'الحجوزات' },
            { href: '/contracts', icon: '📄', label: 'العقود' },
            { href: '/invoices', icon: '💰', label: 'الفواتير' },
            { href: '/reports', icon: '📊', label: 'التقارير' },
            { href: '/settings', icon: '⚙️', label: 'الإعدادات' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors mb-1"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">مرحباً {profile?.full_name || 'المدير'}</h2>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
          <a 
            href="/company?logout=true"
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            تسجيل الخروج
          </a>
        </header>
        
        <main className="flex-1 p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}