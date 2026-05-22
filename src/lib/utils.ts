import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short') {
  const d = new Date(date)
  if (format === 'short') {
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  if (format === 'long') {
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
}

export function formatCurrency(amount: number, currency: string = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('ar-SA').format(num)
}

export function formatPhone(phone: string) {
  return phone.replace(/(\+966|966|0)/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
) {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    // Company status
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    trial: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-800',
    // Vehicle status
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    reserved: 'bg-purple-100 text-purple-800',
    out_of_service: 'bg-red-100 text-red-800',
    // Booking status
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_out: 'bg-purple-100 text-purple-800',
    checked_in: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
    // Invoice status
    draft: 'bg-gray-100 text-gray-800',
    issued: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    // Payment status
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    // Company
    active: 'نشط',
    suspended: 'موقوف',
    trial: 'تجريبي',
    expired: 'منتهي',
    // Vehicle
    available: 'متاح',
    rented: 'مؤجر',
    maintenance: 'صيانة',
    reserved: 'محجوز',
    out_of_service: 'خارج الخدمة',
    // Booking
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    checked_out: 'تم التسليم',
    checked_in: 'تم الاستلام',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    no_show: 'لم يحضر',
    // Invoice
    draft: 'مسودة',
    issued: 'صادر',
    paid: 'مدفوع',
    partial: 'جزئي',
    overdue: 'متأخر',
    refunded: 'مرتجع',
    // Contract
    signed: 'موقع',
  }
  return labels[status] || status
}

export function calculateDays(start: string | Date, end: string | Date) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: string | Date) {
  return new Date(date) < new Date()
}

export function daysUntil(date: string | Date) {
  const target = new Date(date)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}