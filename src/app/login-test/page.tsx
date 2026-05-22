// Login Test Page v2 - Updated with cache headers fix
'use client';

import { useState } from 'react';

const SUPABASE_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const email = (e.target as HTMLFormElement).email.value;
    const password = (e.target as HTMLFormElement).password.value;

    try {
      const response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('sb_access_token', data.access_token);
        localStorage.setItem('sb_refresh_token', data.refresh_token);
        localStorage.setItem('sb_user_id', data.user.id);
        setMessage('✓ تم تسجيل الدخول بنجاح! جاري التحويل...');
        setTimeout(() => { window.location.href = '/company'; }, 500);
      } else {
        setMessage('❌ ' + (data.error_description || 'خطأ في تسجيل الدخول'));
        setLoading(false);
      }
    } catch {
      setMessage('❌ خطأ في الاتصال بالخادم');
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%', 
        maxWidth: '420px'
      }}>
        <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>🚗</div>
        <h1 style={{ color: '#1e3a5f', fontSize: '28px', marginBottom: '10px', textAlign: 'center' }}>Car Rental SaaS</h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '30px' }}>نظام إدارة تأجير السيارات</p>
        
        {message && (
          <div style={{ 
            background: message.includes('✓') ? '#dcfce7' : '#fee2e2', 
            color: message.includes('✓') ? '#16a34a' : '#dc2626',
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            textAlign: 'center' 
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: 500, marginBottom: '8px' }}>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              defaultValue="admin@carrental.com" 
              required
              style={{ 
                width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '16px'
              }} 
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: 500, marginBottom: '8px' }}>كلمة المرور</label>
            <input 
              type="password" 
              name="password" 
              defaultValue="admin123" 
              required
              style={{ 
                width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '16px'
              }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '16px', 
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', border: 'none', borderRadius: '10px', 
              fontSize: '18px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}