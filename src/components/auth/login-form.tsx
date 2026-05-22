'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }),
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'حدث خطأ أثناء تسجيل الدخول');
        return;
      }
      
      // Success - redirect to the specified URL
      if (data.redirect) {
        router.push(data.redirect);
      } else {
        router.push('/company');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">تسجيل الدخول</h2>
      <p className="text-slate-500 mb-8">مرحباً بك مجدداً، أدخل بياناتك للمتابعة</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
        <input
          type="email"
          name="email"
          required
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
          placeholder="example@domain.com"
        />
      </div>

      {/* Password */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
        <input
          type="password"
          name="password"
          required
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
          placeholder="أدخل كلمة المرور"
        />
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end mb-6">
        <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          نسيت كلمة المرور؟
        </a>
      </div>

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
            جاري التسجيل...
          </span>
        ) : (
          'تسجيل الدخول'
        )}
      </button>

      {/* Register Link */}
      <div className="mt-8 text-center">
        <p className="text-slate-500">
          ليس لديك حساب؟{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            إنشاء حساب جديد
          </a>
        </p>
      </div>
    </form>
  );
}