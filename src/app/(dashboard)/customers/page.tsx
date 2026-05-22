import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomersManagement } from '@/components/dashboard/customers-management'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <CustomersManagement />
}