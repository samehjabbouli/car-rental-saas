import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/company');
  }

  // Try auto-login
  await supabase.auth.signInWithPassword({
    email: 'admin@carrental.com',
    password: 'admin123',
  });

  // Give it a moment then redirect
  redirect('/company');
}