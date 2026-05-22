'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-provider'
import { useToast } from '@/contexts/toast-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  User,
  Building,
  Bell,
  Shield,
  Database,
  Globe,
  Moon,
  Sun,
  Bell as BellIcon,
  Mail,
  Key,
  Check,
  Save,
} from 'lucide-react'
import type { User as UserType } from '@/types/database'

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { addToast } = useToast()
  const supabase = createClient()

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    mobile: user?.mobile || '',
  })

  const [companySettings, setCompanySettings] = useState({
    name: '',
    commercial_name: '',
    address: '',
    city: '',
    country: 'SA',
    phone: '',
    email: '',
    tax_number: '',
    vat_number: '',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    booking_reminders: true,
    payment_alerts: true,
    marketing_emails: false,
  })

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          mobile: profile.mobile,
        })
        .eq('id', user?.id)

      if (error) throw error

      addToast({ type: 'success', title: 'تم تحديث الملف الشخصي' })
    } catch (error) {
      addToast({ type: 'error', title: 'حدث خطأ' })
    }
  }

  const handleSaveNotifications = async () => {
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings))
    addToast({ type: 'success', title: 'تم حفظ إعدادات الإشعارات' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة حسابك وإعدادات النظام</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 ml-2" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 ml-2" />
            الشركة
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4 ml-2" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Settings className="h-4 w-4 ml-2" />
            المظهر
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الملف الشخصي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الاسم الكامل</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="input opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">رقم الجوال</label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>الأمان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">تغيير كلمة المرور</p>
                    <p className="text-sm text-muted-foreground">تحديث كلمة المرور الخاصة بك</p>
                  </div>
                </div>
                <Button variant="outline">تغيير</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">المصادقة الثنائية</p>
                    <p className="text-sm text-muted-foreground">تفعيل المصادقة الثنائية للأمان</p>
                  </div>
                </div>
                <Button variant="outline">تفعيل</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">اسم الشركة</label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) =>setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الاسم التجاري</label>
                  <input
                    type="text"
                    value={companySettings.commercial_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, commercial_name: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">رقم السجل التجاري</label>
                  <input
                    type="text"
                    value={companySettings.tax_number}
                    onChange={(e) => setCompanySettings({ ...companySettings, tax_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={companySettings.vat_number}
                    onChange={(e) => setCompanySettings({ ...companySettings, vat_number: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الهاتف</label>
                  <input
                    type="tel"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">العنوان</label>
                <textarea
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  rows={3}
                  className="input"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => addToast({ type: 'success', title: 'تم حفظ إعدادات الشركة' })}>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">إشعارات البريد الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">استلام التنبيهات عبر البريد</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">تذكيرات الحجوزات</p>
                    <p className="text-sm text-muted-foreground">إشعارات قبل مواعيد الاستلام والتسليم</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.booking_reminders}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, booking_reminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">تنبيهات الدفع</p>
                    <p className="text-sm text-muted-foreground">إشعارات المدفوعات والفواتير</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.payment_alerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, payment_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:-translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4" />
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>المظهر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div>
                <h3 className="font-medium mb-3">المظهر العام</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
                      <Sun className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="text-sm">فاتح</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-sm">داكن</span>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <h3 className="font-medium mb-3">اللغة</h3>
                <select className="input w-full max-w-xs">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* RTL/LTR */}
              <div>
                <h3 className="font-medium mb-3">اتجاه النص</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="direction" value="rtl" defaultChecked className="text-primary" />
                    <span>من اليمين لليسار (RTL)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="direction" value="ltr" className="text-primary" />
                    <span>من اليسار لليمين (LTR)</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}