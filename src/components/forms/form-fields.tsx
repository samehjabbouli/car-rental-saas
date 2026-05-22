'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// FormField component
interface FormFieldProps {
  control: any
  name: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  error?: string
  helperText?: string
  disabled?: boolean
}

export function FormField({ control, name, label, placeholder, type = 'text', error, helperText, disabled }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-colors',
          error && 'border-red-500'
        )}
        {...control.register(name)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
}

// Vehicle Form Schema
export const vehicleFormSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  make: z.string().min(2, 'الماركة مطلوبة'),
  model: z.string().min(2, 'الموديل مطلوب'),
  year: z.string().min(4, 'السنة مطلوبة'),
  color: z.string().min(2, 'اللون مطلوب'),
  license_plate: z.string().min(2, 'اللوحة مطلوبة'),
  vin: z.string().optional(),
  fuel_type: z.string().min(1, 'نوع الوقود مطلوب'),
  transmission: z.string().min(1, 'نوع القير مطلوب'),
  passenger_capacity: z.string().min(1, 'عدد الركاب مطلوب'),
  door_count: z.string().min(1, 'عدد الأبواب مطلوب'),
  daily_rate: z.string().min(1, 'السعر اليومي مطلوب'),
  weekly_rate: z.string().optional(),
  monthly_rate: z.string().optional(),
  branch_id: z.string().optional(),
  category_id: z.string().optional(),
  features: z.string().optional(),
})

export type VehicleFormData = z.infer<typeof vehicleFormSchema>

// Customer Form Schema
export const customerFormSchema = z.object({
  first_name: z.string().min(2, 'الاسم الأول مطلوب'),
  last_name: z.string().min(2, 'اسم العائلة مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().min(10, 'رقم الهاتف مطلوب'),
  mobile: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
  nationality: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerFormSchema>

// Booking Form Schema
export const bookingFormSchema = z.object({
  customer_id: z.string().min(1, 'العميل مطلوب'),
  vehicle_id: z.string().min(1, 'السيارة مطلوبة'),
  pickup_date: z.string().min(1, 'تاريخ الاستلام مطلوب'),
  return_date: z.string().min(1, 'تاريخ التسليم مطلوب'),
  pickup_location: z.string().optional(),
  return_location: z.string().optional(),
  daily_rate: z.string().optional(),
  notes: z.string().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

// Company Form Schema
export const companyFormSchema = z.object({
  name: z.string().min(3, 'اسم الشركة مطلوب'),
  commercial_name: z.string().optional(),
  registration_number: z.string().optional(),
  tax_number: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').min(1, 'البريد الإلكتروني مطلوب'),
  phone: z.string().min(10, 'رقم الهاتف مطلوب'),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(2, 'البلد مطلوب'),
  max_branches: z.string().optional(),
  max_users: z.string().optional(),
  max_vehicles: z.string().optional(),
})

export type CompanyFormData = z.infer<typeof companyFormSchema>

// User Form Schema
export const userFormSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').min(1, 'البريد الإلكتروني مطلوب'),
  full_name: z.string().min(3, 'الاسم الكامل مطلوب'),
  phone: z.string().optional(),
  role: z.string().min(1, 'الصلاحية مطلوبة'),
  branch_id: z.string().optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
})

export type UserFormData = z.infer<typeof userFormSchema>

// Common form options
export const fuelTypeOptions = [
  { value: 'gasoline', label: 'بنزين' },
  { value: 'diesel', label: 'ديزل' },
  { value: 'electric', label: 'كهربائي' },
  { value: 'hybrid', label: 'هجين' },
  { value: 'lpg', label: 'غاز' },
]

export const transmissionOptions = [
  { value: 'automatic', label: 'أوتوماتيك' },
  { value: 'manual', label: 'يدوي' },
  { value: 'cvt', label: 'CVT' },
]

export const roleOptions = [
  { value: 'company_owner', label: 'مالك الشركة' },
  { value: 'branch_manager', label: 'مدير الفرع' },
  { value: 'employee', label: 'موظف' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'reception', label: 'استقبال' },
  { value: 'driver', label: 'سائق' },
]

export const superAdminRoleOptions = [
  ...roleOptions,
  { value: 'super_admin', label: 'مدير النظام' },
]

export const documentTypeOptions = [
  { value: 'national_id', label: 'هوية وطنية' },
  { value: 'passport', label: 'جواز سفر' },
  { value: 'drivers_license', label: 'رخصة قيادة' },
]