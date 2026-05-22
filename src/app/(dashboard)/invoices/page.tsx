import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoicesManagement } from '@/components/dashboard/invoices-management'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <InvoicesManagement />
}