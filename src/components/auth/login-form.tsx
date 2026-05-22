'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.redirect) {
        window.location.href = data.redirect;
      } else {
        setError(data.error || 'خطأ في تسجيل الدخول');
        setLoading(false);
      }
    })
    .catch(() => {
      setError('خطأ في الاتصال');
      setLoading(false);
    });
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

      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
        <input type="email" name="email" required defaultValue="admin@carrental.com"
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900" />
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
        <input type="password" name="password" required defaultValue="admin123"
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900" />
      </div>

      <div className="flex justify-end mb-6">
        <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">نسيت كلمة المرور؟</a>
      </div>

      <button type="submit" disabled={loading}
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 cursor-pointer">
        {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
      </button>

      <div className="mt-8 text-center">
        <p className="text-slate-500">ليس لديك حساب؟ <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">إنشاء حساب جديد</a></p>
      </div>
    </form>
  );
}