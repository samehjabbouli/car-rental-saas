import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPage } from '@/components/dashboard/settings-page'

export default async function SettingsRoutePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <SettingsPage />
}