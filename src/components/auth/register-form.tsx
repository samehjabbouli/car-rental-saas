'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check for error from URL
  const urlError = searchParams.get('error');
  const registered = searchParams.get('registered');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;
    const fullName = formData.get('full_name') as string;
    const companyName = formData.get('company_name') as string;
    const phone = formData.get('phone') as string;

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          password,
          full_name: fullName,
          company_name: companyName,
          phone
        }),
      });

      const data = await response.json();

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  if (success || registered === 'true') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تم إنشاء الحساب!</h2>
          <p className="text-slate-500 mb-6">يمكنك الآن تسجيل الدخول إلى حسابك</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25"
          >
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">معلومات الشركة</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">اسم الشركة</label>
          <input
            type="text"
            name="company_name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="اسم شركتك"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">رقم الهاتف</label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="05xxxxxxxx"
          />
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-6 pt-4 border-t">معلومات الحساب</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">الاسم الكامل</label>
          <input
            type="text"
            name="full_name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="الاسم الكامل"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
          <input
            type="email"
            name="email"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="example@domain.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="6 أحرف على الأقل"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">تأكيد كلمة المرور</label>
          <input
            type="password"
            name="confirm_password"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
            placeholder="أعد إدخال كلمة المرور"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            جاري الإنشاء...
          </span>
        ) : (
          'إنشاء الحساب'
        )}
      </button>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-500">
          لديك حساب بالفعل؟{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            تسجيل الدخول
          </a>
        </p>
      </div>
    </form>
  );
}