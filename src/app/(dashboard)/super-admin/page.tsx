import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminDashboard } from '@/components/dashboard/super-admin-dashboard'

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/company')
  }

  return <SuperAdminDashboard />
}