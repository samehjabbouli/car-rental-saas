// Company Dashboard - fix-login-pages branch
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

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

  const menuItems = [
    { icon: '🚗', name: 'إدارة الأسطول', href: '/fleet', color: '#3b82f6', bg: '#eff6ff' },
    { icon: '📅', name: 'الحجوزات', href: '/bookings', color: '#10b981', bg: '#ecfdf5' },
    { icon: '👥', name: 'العملاء', href: '/customers', color: '#f59e0b', bg: '#fffbeb' },
    { icon: '📄', name: 'العقود', href: '/contracts', color: '#6366f1', bg: '#eef2ff' },
    { icon: '💰', name: 'الفواتير', href: '/invoices', color: '#ec4899', bg: '#fdf2f8' },
    { icon: '📊', name: 'التقارير', href: '/reports', color: '#8b5cf6', bg: '#f5f3ff' },
    { icon: '⚙️', name: 'الإعدادات', href: '/settings', color: '#64748b', bg: '#f8fafc' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
    }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>🚗</div>
          <div>
            <h1 style={{ color: '#1e3a5f', fontSize: '24px', margin: 0 }}>Car Rental SaaS</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>لوحة تحكم نظام إدارة تأجير السيارات</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            background: '#dcfce7', 
            color: '#16a34a',
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>✓</span> متصل بالنظام
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: '#fee2e2', 
              color: '#dc2626',
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>مرحباً بك في لوحة التحكم</h2>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>إدارة شاملة لجميع عمليات تأجير السيارات</p>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          {[
            { icon: '🚗', value: '0', label: 'السيارات', color: '#3b82f6' },
            { icon: '📅', value: '0', label: 'الحجوزات', color: '#10b981' },
            { icon: '👥', value: '1', label: 'العملاء', color: '#f59e0b' },
            { icon: '📄', value: '0', label: 'العقود', color: '#6366f1' },
          ].map((stat, i) => (
            <div key={i} style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '15px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>{stat.icon}</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <h3 style={{ fontSize: '20px', color: '#1e3a5f', marginBottom: '20px' }}>إدارة النظام</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {menuItems.map((item, i) => (
            <Link 
              key={i} 
              href={item.href}
              style={{ 
                background: item.bg,
                padding: '25px',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: `2px solid ${item.color}20`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 10px 25px ${item.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: item.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {item.icon}
              </div>
              <span style={{ color: '#1e3a5f', fontSize: '18px', fontWeight: 600 }}>{item.name}</span>
              <span style={{ marginLeft: 'auto', color: item.color }}>→</span>
            </Link>
          ))}
        </div>

        {/* User Info */}
        <div style={{ 
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '10px',
          marginTop: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 600, color: '#1e3a5f' }}>admin@carrental.com</div>
          <div style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>حساب مدير النظام</div>
        </div>
      </div>
    </div>
  );
}