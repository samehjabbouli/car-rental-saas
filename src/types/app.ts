import { type Vehicle, type Booking, type Customer, type User } from '@/types/database'

export type Theme = 'light' | 'dark'

export interface AppState {
  theme: Theme
  sidebarOpen: boolean
  currentCompany: string | null
  currentBranch: string | null
}

export interface AuthState {
  user: User | null
  company: { id: string; name: string } | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  onClose?: () => void
}

export interface TableState<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
}

export interface FilterState {
  search: string
  status: string
  dateFrom: string
  dateTo: string
}

export interface FleetStats {
  total: number
  available: number
  rented: number
  maintenance: number
  reserved: number
}

export interface BookingStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}

export interface RevenueStats {
  total: number
  thisMonth: number
  lastMonth: number
  growth: number
}

export interface CustomerStats {
  total: number
  newThisMonth: number
  blacklisted: number
}

export interface CompanyStats {
  total: number
  active: number
  trial: number
  expired: number
}