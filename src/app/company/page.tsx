// Company Dashboard - fix-login-pages branch
'use client';

import { useEffect } from 'react';

export default function CompanyPage() {
  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) {
      window.location.href = '/login-test';
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('sb_refresh_token');
    localStorage.removeItem('sb_user_id');
    window.location.href = '/login-test';
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚗</div>
        <h1 style={{ color: '#1e3a5f', fontSize: '32px', marginBottom: '10px' }}>Car Rental SaaS</h1>
        <p style={{ color: '#64748b', fontSize: '18px' }}>لوحة تحكم نظام إدارة تأجير السيارات</p>
        <div style={{ 
          display: 'inline-block', 
          background: '#dcfce7', 
          color: '#16a34a',
          padding: '8px 16px', 
          borderRadius: '20px', 
          marginTop: '20px', 
          fontWeight: 600 
        }}>
          ✓ متصل بالنظام
        </div>
      </div>

      {/* Dashboard */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        <div style={{ 
          background: '#f0f9ff', 
          padding: '15px', 
          borderRadius: '10px', 
          marginBottom: '20px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontWeight: 600, color: '#1e3a5f' }}>admin@carrental.com</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>حساب مدير النظام</div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚗</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f' }}>0</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>السيارات</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f' }}>0</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>الحجوزات</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f' }}>1</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>العملاء</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f' }}>0</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>العقود</div>
          </div>
        </div>

        {/* Features */}
        <h2 style={{ fontSize: '20px', color: '#1e3a5f', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #e5e7eb' }}>
          إدارة النظام
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          {[
            { icon: '🚗', name: 'إدارة الأسطول' },
            { icon: '📅', name: 'الحجوزات' },
            { icon: '👥', name: 'العملاء' },
            { icon: '📄', name: 'العقود' },
            { icon: '💰', name: 'الفواتير' },
            { icon: '📊', name: 'التقارير' },
            { icon: '⚙️', name: 'الإعدادات' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ color: '#374151', fontWeight: 500 }}>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              background: '#fee2e2', 
              color: '#dc2626',
              padding: '10px 20px', 
              borderRadius: '10px', 
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}