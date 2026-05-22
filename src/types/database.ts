// Database Types for Car Rental SaaS

export type UserRole = 
  | 'super_admin' 
  | 'company_owner' 
  | 'branch_manager' 
  | 'employee' 
  | 'accountant' 
  | 'reception' 
  | 'driver' 
  | 'customer';

export type CompanyStatus = 'active' | 'suspended' | 'trial' | 'expired';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'reserved' | 'out_of_service';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_out' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'active' | 'completed' | 'cancelled' | 'disputed';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg';
export type TransmissionType = 'automatic' | 'manual' | 'cvt';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | 'custom';

export interface Company {
  id: string;
  name: string;
  commercial_name?: string;
  registration_number?: string;
  tax_number?: string;
  vat_number?: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country: string;
  logo_url?: string;
  website?: string;
  status: CompanyStatus;
  subscription_plan: SubscriptionPlan;
  subscription_start_date?: string;
  subscription_end_date?: string;
  max_branches: number;
  max_users: number;
  max_vehicles: number;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  opening_time?: string;
  closing_time?: string;
  is_main: boolean;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  password_hash?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  role: UserRole;
  company_id?: string;
  branch_id?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  last_login_ip?: string;
  preferences: Record<string, unknown>;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name_ar?: string;
  display_name_en?: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface VehicleCategory {
  id: string;
  company_id?: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  branch_id?: string;
  category_id?: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  vin?: string;
  chassis_number?: string;
  engine_number?: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  passenger_capacity: number;
  door_count: number;
  trunk_capacity?: string;
  luggage_capacity?: number;
  has_ac: boolean;
  has_gps: boolean;
  has_sunroof: boolean;
  has_bluetooth: boolean;
  has_cruise_control: boolean;
  features: string[];
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  hourly_rate?: number;
  minimum_rental_days: number;
  deposit_amount: number;
  current_km: number;
  km_before_service: number;
  last_km_update?: string;
  status: VehicleStatus;
  is_active: boolean;
  insurance_policy_number?: string;
  insurance_company?: string;
  insurance_start_date?: string;
  insurance_end_date?: string;
  insurance_document_url?: string;
  registration_number?: string;
  registration_expiry?: string;
  registration_document_url?: string;
  inspection_number?: string;
  inspection_start_date?: string;
  inspection_end_date?: string;
  inspection_document_url?: string;
  images: string[];
  videos: string[];
  qr_code?: string;
  barcode?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VehicleAvailability {
  id: string;
  vehicle_id: string;
  date: string;
  is_available: boolean;
  is_holiday: boolean;
  price_multiplier: number;
  notes?: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  mileage?: number;
  cost?: number;
  performed_by?: string;
  performed_at: string;
  next_service_km?: number;
  next_service_date?: string;
  documents: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone: string;
  mobile?: string;
  id_type?: string;
  id_number?: string;
  id_issue_date?: string;
  id_expiry_date?: string;
  id_front_url?: string;
  id_back_url?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_url?: string;
  license_number?: string;
  license_type?: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  license_url?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  nationality?: string;
  birth_date?: string;
  gender?: string;
  is_verified: boolean;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  is_loyalty_member: boolean;
  loyalty_points: number;
  preferences: Record<string, unknown>;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  company_id: string;
  branch_id?: string;
  customer_id: string;
  vehicle_id?: string;
  booking_date: string;
  pickup_date: string;
  return_date: string;
  actual_pickup_date?: string;
  actual_return_date?: string;
  pickup_location?: string;
  pickup_address?: string;
  return_location?: string;
  return_address?: string;
  status: BookingStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  daily_rate?: number;
  number_of_days?: number;
  subtotal?: number;
  discount_amount: number;
  discount_code?: string;
  tax_amount?: number;
  tax_rate: number;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  addons: Addon[];
  addons_cost: number;
  additional_driver_name?: string;
  additional_driver_license?: string;
  additional_driver_phone?: string;
  additional_driver_fee: number;
  insurance_package?: string;
  insurance_cost: number;
  gps_included: boolean;
  gps_cost: number;
  estimated_km?: number;
  included_km_per_day: number;
  extra_km_rate: number;
  special_requests?: string;
  internal_notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  from_status?: BookingStatus;
  to_status: BookingStatus;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  booking_id?: string;
  company_id: string;
  customer_id: string;
  vehicle_id?: string;
  status: ContractStatus;
  signed_at?: string;
  signed_by_customer: boolean;
  signed_by_company: boolean;
  start_date: string;
  end_date: string;
  pickup_km?: number;
  pickup_fuel_level?: string;
  pickup_exterior_condition: Record<string, unknown>;
  pickup_interior_condition: Record<string, unknown>;
  pickup_notes?: string;
  return_km?: number;
  return_fuel_level?: string;
  return_exterior_condition: Record<string, unknown>;
  return_interior_condition: Record<string, unknown>;
  return_notes?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  contract_pdf_url?: string;
  signature_data?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id?: string;
  contract_id?: string;
  company_id: string;
  customer_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  exchange_rate: number;
  qr_code?: string;
  zatca_invoice_hash?: string;
  pdf_url?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id?: string;
  booking_id?: string;
  company_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
  gateway_reference?: string;
  status: PaymentStatus;
  paid_at?: string;
  is_refund: boolean;
  refunded_amount: number;
  refund_reason?: string;
  refunded_at?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  company_id?: string;
  code: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  applicable_vehicles: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan: SubscriptionPlan;
  status: string;
  start_date: string;
  end_date: string;
  billing_cycle: string;
  price: number;
  currency: string;
  auto_renew: boolean;
  cancelled_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  total_companies?: number;
  total_vehicles?: number;
  total_bookings?: number;
  total_customers?: number;
  total_revenue?:number;
  pending_bookings?: number;
  available_vehicles?: number;
  rented_vehicles?: number;
  maintenance_vehicles?: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  bookings: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone: string;
  company_name: string;
}

export interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin?: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  passenger_capacity: number;
  door_count: number;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  branch_id?: string;
  category_id?: string;
  images?: File[];
}

export interface BookingFormData {
  customer_id: string;
  vehicle_id?: string;
  pickup_date: string;
  return_date: string;
  pickup_location?: string;
  return_location?: string;
  daily_rate?: number;
  additional_driver?: boolean;
  insurance_package?: string;
  gps_included?: boolean;
}

// Filter Types
export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface PaginationFilter {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilter {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// Permission Types
export interface RolePermissions {
  role: UserRole;
  permissions: string[];
}

// Table Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Component Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}