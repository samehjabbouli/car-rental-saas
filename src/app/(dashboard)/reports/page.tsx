import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportsPage } from '@/components/dashboard/reports-page'

export default async function ReportsRoutePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <ReportsPage />
}