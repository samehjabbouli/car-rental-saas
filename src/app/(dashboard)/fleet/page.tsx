import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FleetManagement } from '@/components/dashboard/fleet-management'

export default async function FleetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <FleetManagement />
}