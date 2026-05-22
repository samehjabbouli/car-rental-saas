import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Auth Operations
export const auth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  },

  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  },
}

// Users Operations
export const users = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*, company:companies(*), branch:branches(*)')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  async list(filters?: { company_id?: string; role?: string; is_active?: boolean }) {
    let query = supabase.from('users').select('*')
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async create(userData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    return { data, error }
  },
}

// Companies Operations
export const companies = {
  async list(status?: string) {
    let query = supabase.from('companies').select('*')
    if (status) {
      query = query.eq('status', status)
    }
    const { data, error } = await query
    return { data, error }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(companyData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
    return { error }
  },
}

// Branches Operations
export const branches = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId)
      .order('is_main', { ascending: false })
    return { data, error }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(branchData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('branches')
      .insert(branchData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

// Vehicles Operations
export const vehicles = {
  async list(filters?: { 
    company_id?: string; 
    branch_id?: string; 
    status?: string;
    category_id?: string;
  }) {
    let query = supabase
      .from('vehicles')
      .select('*, category:vehicle_categories(*), branch:branches(*)')
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, category:vehicle_categories(*), branch:branches(*)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(vehicleData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
    return { error }
  },

  async checkAvailability(vehicleId: string, pickupDate: string, returnDate: string) {
    const { data, error } = await supabase.rpc('check_vehicle_availability', {
      p_vehicle_id: vehicleId,
      p_pickup_date: pickupDate,
      p_return_date: returnDate,
    })
    return { data, error }
  },

  async getAvailable(pickupDate: string, returnDate: string, categoryId?: string) {
    const { data, error } = await supabase.rpc('get_available_vehicles', {
      p_pickup_date: pickupDate,
      p_return_date: returnDate,
      p_category_id: categoryId || null,
    })
    return { data, error }
  },
}

// Customers Operations
export const customers = {
  async list(filters?: { 
    company_id?: string; 
    is_blacklisted?: boolean;
    search?: string;
  }, pagination?: { page: number; pageSize: number }) {
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.is_blacklisted !== undefined) {
      query = query.eq('is_blacklisted', filters.is_blacklisted)
    }
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    
    if (pagination) {
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1
      query = query.range(from, to)
    }
    
    const { data, error, count } = await query
    return { data, error, count }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(customerData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async blacklist(id: string, reason: string) {
    const { data, error } = await supabase
      .from('customers')
      .update({ is_blacklisted: true, blacklist_reason: reason })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

// Bookings Operations
export const bookings = {
  async list(filters?: { 
    company_id?: string;
    status?: string;
    customer_id?: string;
    vehicle_id?: string;
    date_from?: string;
    date_to?: string;
  }, pagination?: { page: number; pageSize: number }) {
    let query = supabase
      .from('bookings_view')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    if (filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id)
    }
    if (filters?.date_from) {
      query = query.gte('pickup_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('return_date', filters.date_to)
    }
    
    if (pagination) {
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1
      query = query.range(from, to)
    }
    
    const { data, error, count } = await query
    return { data, error, count }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:customers(*), vehicle:vehicles(*), branch:branches(*)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(bookingData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async updateStatus(id: string, newStatus: string, notes?: string) {
    // Get current status
    const { data: current } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', id)
      .single()
    
    // Update booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus, cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single()
    
    if (!error && current) {
      // Add to status history
      await supabase.from('booking_status_history').insert({
        booking_id: id,
        from_status: current.status,
        to_status: newStatus,
        notes,
      })
    }
    
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    return { error }
  },
}

// Contracts Operations
export const contracts = {
  async list(filters?: { company_id?: string; status?: string }) {
    let query = supabase
      .from('contracts')
      .select('*, customer:customers(*), vehicle:vehicles(*)')
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, customer:customers(*), vehicle:vehicles(*), booking:bookings(*)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(contractData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async sign(id: string, signatureData: string) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ 
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_customer: true,
        signature_data: signatureData,
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

// Invoices Operations
export const invoices = {
  async list(filters?: {
    company_id?: string; 
    status?: string;
    customer_id?: string;
  }) {
    let query = supabase
      .from('invoices')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), booking:bookings(*)')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async create(invoiceData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async markAsPaid(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

// Payments Operations
export const payments = {
  async list(filters?: { company_id?: string; status?: string; invoice_id?: string }) {
    let query = supabase
      .from('payments')
      .select('*, invoice:invoices(*), customer:customers(*)')
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.invoice_id) {
      query = query.eq('invoice_id', filters.invoice_id)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async create(paymentData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()
    return { data, error }
  },

  async refund(id: string, amount: number, reason: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        is_refund: true,
        refunded_amount: amount,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}

// Coupons Operations
export const coupons = {
  async validate(code: string, companyId?: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (data && data.company_id && data.company_id !== companyId) {
      return { data: null, error: { message: 'Coupon not available for this company' } }
    }
    
    if (data && data.valid_from && new Date(data.valid_from) > new Date()) {
      return { data: null, error: { message: 'Coupon not yet valid' } }
    }
    
    if (data && data.valid_until && new Date(data.valid_until) < new Date()) {
      return { data: null, error: { message: 'Coupon has expired' } }
    }
    
    if (data && data.usage_limit && data.used_count >= data.usage_limit) {
      return { data: null, error: { message: 'Coupon usage limit reached' } }
    }
    
    return { data, error }
  },

  async use(code: string) {
    const { data, error } = await supabase.rpc('increment_coupon_usage', { p_code: code })
    return { data, error }
  },
}

// Storage Operations
export const storage = {
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    return { data, error }
  },

  async uploadUrl(bucket: string, path: string, url: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob)
    return { data, error }
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async delete(bucket: string, paths: string[]) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    return { data, error }
  },
}

// Activity Logs
export const activityLogs = {
  async log(action: string, entityType: string, entityId?: string, description?: string) {
    const { data, error } = await supabase.rpc('log_activity', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_description: description,
    })
    return { data, error }
  },

  async list(filters?: { company_id?: string; user_id?: string }, pagination?: { page: number; pageSize: number }) {
    let query = supabase
      .from('activity_logs')
      .select('*, user:users(*)')
      .order('created_at', { ascending: false })
    
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    
    if (pagination) {
      const from = (pagination.page - 1) * pagination.pageSize
      const to = from + pagination.pageSize - 1
      query = query.range(from, to)
    }
    
    const { data, error } = await query
    return { data, error }
  },
}

// Reports & Analytics
export const reports = {
  async getRevenue(startDate: string, endDate: string, companyId?: string) {
    let query = supabase
      .from('bookings')
      .select('created_at, total_amount, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['completed', 'confirmed'])
    
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async getFleetUtilization(companyId?: string) {
    let query = supabase
      .from('fleet_utilization')
      .select('*')
    
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async getMonthlyStats(year: number, companyId?: string) {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    let query = supabase
      .from('bookings')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['completed', 'confirmed'])
    
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    const { data, error } = await query
    return { data, error }
  },
}