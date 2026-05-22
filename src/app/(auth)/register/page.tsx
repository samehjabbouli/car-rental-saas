export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/register-form';

async function getSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function RegisterPage() {
  const user = await getSession();
  
  if (user) {
    redirect('/company');
  }

  return (
    <div className="min-h-screen flex">
      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 mb-4 shadow-lg shadow-blue-600/25">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">CarRental</h1>
            <p className="text-slate-500 mt-2">إنشاء حساب جديد</p>
          </div>

          {/* Register Form */}
          <RegisterForm />
        </div>
      </div>

      {/* Left Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1"/>
              <circle cx="100" cy="100" r="60" fill="white" fillOpacity="0.1"/>
              <path d="M60 120 L80 100 L120 100 L140 120 L140 130 L60 130 Z" fill="white"/>
              <circle cx="75" cy="130" r="12" fill="white" fillOpacity="0.8"/>
              <circle cx="125" cy="130" r="12" fill="white" fillOpacity="0.8"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">ابدأ الآن مجاناً</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            أنشئ حسابك وابدأ بإدارة شركة تأجير السيارات الخاصة بك
          </p>
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold">مجاني</p>
              <p className="text-blue-200 text-sm">فترة تجريبية</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">3</p>
              <p className="text-blue-200 text-sm">أيام مجانية</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}