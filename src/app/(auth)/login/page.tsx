import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const redirectUrl = profile?.role === 'super_admin' ? '/super-admin' : '/company';
    redirect(redirectUrl);
  }

  // Auto-login with test credentials for demo
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@carrental.com',
    password: 'admin123',
  });

  if (data.user && !error) {
    redirect('/company');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التحميل...</p>
    </div>
  );
}