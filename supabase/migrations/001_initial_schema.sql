-- ============================================
-- Car Rental SaaS Platform - Database Schema
-- Production Ready Multi-Tenant Architecture
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- User Roles
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'company_owner',
    'branch_manager',
    'employee',
    'accountant',
    'reception',
    'driver',
    'customer'
);

-- Company Status
CREATE TYPE company_status AS ENUM (
    'active',
    'suspended',
    'trial',
    'expired'
);

-- Vehicle Status
CREATE TYPE vehicle_status AS ENUM (
    'available',
    'rented',
    'maintenance',
    'reserved',
    'out_of_service'
);

-- Booking Status
CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'checked_out',
    'checked_in',
    'completed',
    'cancelled',
    'no_show'
);

-- Payment Status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'refunded',
    'failed'
);

-- Contract Status
CREATE TYPE contract_status AS ENUM (
    'draft',
    'pending_signature',
    'signed',
    'active',
    'completed',
    'cancelled',
    'disputed'
);

-- Invoice Status
CREATE TYPE invoice_status AS ENUM (
    'draft',
    'issued',
    'paid',
    'partial',
    'overdue',
    'cancelled',
    'refunded'
);

-- Fuel Type
CREATE TYPE fuel_type AS ENUM (
    'gasoline',
    'diesel',
    'electric',
    'hybrid',
    'lpg'
);

-- Transmission
CREATE TYPE transmission_type AS ENUM (
    'automatic',
    'manual',
    'cvt'
);

-- Subscription Plan
CREATE TYPE subscription_plan AS ENUM (
    'starter',
    'professional',
    'enterprise',
    'custom'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Tenants/Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    commercial_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    vat_number VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'SA',
    logo_url TEXT,
    website VARCHAR(255),
    status company_status DEFAULT 'trial',
    subscription_plan subscription_plan DEFAULT 'starter',
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    max_branches INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 10,
    max_vehicles INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'SA',
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    opening_time TIME,
    closing_time TIME,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'employee',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name_ar VARCHAR(255),
    display_name_en VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- User Permissions (Individual overrides)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- ============================================
-- FLEET MANAGEMENT
-- ============================================

-- Vehicle Categories
CREATE TABLE vehicle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES vehicle_categories(id) ON DELETE SET NULL,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    color VARCHAR(50),
    license_plate VARCHAR(50) NOT NULL,
    vin VARCHAR(50) UNIQUE,
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    
    -- Specifications
    fuel_type fuel_type DEFAULT 'gasoline',
    transmission transmission_type DEFAULT 'automatic',
    passenger_capacity INTEGER DEFAULT 5,
    door_count INTEGER DEFAULT 4,
    trunk_capacity VARCHAR(50),
    luggage_capacity INTEGER,
    has_ac BOOLEAN DEFAULT TRUE,
    has_gps BOOLEAN DEFAULT FALSE,
    has_sunroof BOOLEAN DEFAULT FALSE,
    has_bluetooth BOOLEAN DEFAULT FALSE,
    has_cruise_control BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '[]',
    
    -- Pricing
    daily_rate DECIMAL(12, 2) NOT NULL,
    weekly_rate DECIMAL(12, 2),
    monthly_rate DECIMAL(12, 2),
    hourly_rate DECIMAL(12, 2),
    minimum_rental_days INTEGER DEFAULT 1,
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Kilometers
    current_km INTEGER DEFAULT 0,
    km_before_service INTEGER DEFAULT 5000,
    last_km_update TIMESTAMPTZ,
    
    -- Status
    status vehicle_status DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Insurance
    insurance_policy_number VARCHAR(100),
    insurance_company VARCHAR(255),
    insurance_start_date DATE,
    insurance_end_date DATE,
    insurance_document_url TEXT,
    
    -- Registration
    registration_number VARCHAR(100),
    registration_expiry DATE,
    registration_document_url TEXT,
    
    -- Inspection
    inspection_number VARCHAR(100),
    inspection_start_date DATE,
    inspection_end_date DATE,
    inspection_document_url TEXT,
    
    -- Media
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    qr_code TEXT,
    barcode TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Availability Calendar
CREATE TABLE vehicle_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_holiday BOOLEAN DEFAULT FALSE,
    price_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vehicle_id, date)
);

-- Maintenance Records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    mileage INTEGER,
    cost DECIMAL(12, 2),
    performed_by VARCHAR(255),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    next_service_km INTEGER,
    next_service_date DATE,
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS
-- ============================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    mobile VARCHAR(50),
    
    -- ID Documents
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_issue_date DATE,
    id_expiry_date DATE,
    id_front_url TEXT,
    id_back_url TEXT,
    
    -- Passport
    passport_number VARCHAR(100),
    passport_issue_date DATE,
    passport_expiry_date DATE,
    passport_url TEXT,
    
    -- License
    license_number VARCHAR(100),
    license_type VARCHAR(50),
    license_issue_date DATE,
    license_expiry_date DATE,
    license_url TEXT,
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'SA',
    
    -- Nationality
    nationality VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20),
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    is_loyalty_member BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Loyalty History
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS
-- ============================================

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Dates
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    pickup_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ NOT NULL,
    actual_pickup_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    
    -- Pickup/Return Locations
    pickup_location VARCHAR(255),
    pickup_address TEXT,
    return_location VARCHAR(255),
    return_address TEXT,
    
    -- Status
    status booking_status DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    
    -- Pricing
    daily_rate DECIMAL(12, 2),
    number_of_days INTEGER,
    subtotal DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_code VARCHAR(50),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 15.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT FALSE,
    
    -- Addons
    addons JSONB DEFAULT '[]',
    addons_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- Additional Driver
    additional_driver_name VARCHAR(255),
    additional_driver_license VARCHAR(100),
    additional_driver_phone VARCHAR(50),
    additional_driver_fee DECIMAL(12, 2) DEFAULT 0,
    
    -- Insurance
    insurance_package VARCHAR(100),
    insurance_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- GPS
    gps_included BOOLEAN DEFAULT FALSE,
    gps_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- Mileage
    estimated_km INTEGER,
    included_km_per_day INTEGER DEFAULT 250,
    extra_km_rate DECIMAL(6, 2) DEFAULT 0.50,
    
    -- Notes
    special_requests TEXT,
    internal_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Status History
CREATE TABLE booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status booking_status,
    to_status booking_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTS
-- ============================================

-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Status
    status contract_status DEFAULT 'draft',
    signed_at TIMESTAMPTZ,
    signed_by_customer BOOLEAN DEFAULT FALSE,
    signed_by_company BOOLEAN DEFAULT FALSE,
    
    -- Terms
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Vehicle Condition
    pickup_km INTEGER,
    pickup_fuel_level VARCHAR(20),
    pickup_exterior_condition JSONB DEFAULT '{}',
    pickup_interior_condition JSONB DEFAULT '{}',
    pickup_notes TEXT,
    
    return_km INTEGER,
    return_fuel_level VARCHAR(20),
    return_exterior_condition JSONB DEFAULT '{}',
    return_interior_condition JSONB DEFAULT '{}',
    return_notes TEXT,
    
    -- Financial
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Documents
    contract_pdf_url TEXT,
    signature_data TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES & PAYMENTS
-- ============================================

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Status
    status invoice_status DEFAULT 'draft',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    
    -- Line Items
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 15.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2),
    
    -- Currency
    currency VARCHAR(10) DEFAULT 'SAR',
    exchange_rate DECIMAL(12, 6) DEFAULT 1.00,
    
    -- QR Code for ZATCA
    qr_code TEXT,
    zatca_invoice_hash TEXT,
    
    -- PDF
    pdf_url TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    gateway_reference VARCHAR(255),
    
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    
    -- Refund
    is_refund BOOLEAN DEFAULT FALSE,
    refunded_amount DECIMAL(12, 2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COUPONS & DISCOUNTS
-- ============================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255),
    name_en VARCHAR(255),
    description TEXT,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    max_discount_amount DECIMAL(12, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_vehicles JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS & ANALYTICS
-- ============================================

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS & BILLING
-- ============================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    auto_renew BOOLEAN DEFAULT TRUE,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_number VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_branch ON vehicles(branch_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_license ON vehicles(license_plate);
CREATE INDEX idx_vehicles_category ON vehicles(category_id);

CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_blacklist ON customers(is_blacklisted);

CREATE INDEX idx_bookings_company ON bookings(company_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_dates ON bookings(pickup_date, return_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

CREATE INDEX idx_vehicle_availability_date ON vehicle_availability(date);
CREATE INDEX idx_vehicle_availability_vehicle ON vehicle_availability(vehicle_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('booking_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS booking_seq START 1;

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.contract_number := 'CON-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('contract_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS contract_seq START 1;

-- Auto-generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('payment_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS payment_seq START 1;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update remaining amount on invoice
CREATE OR REPLACE FUNCTION update_invoice_remaining()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount = NEW.total_amount - NEW.paid_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_remaining_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_invoice_remaining();

-- ============================================
-- VIEWS
-- ============================================

-- Booking with customer and vehicle info
CREATE OR REPLACE VIEW bookings_view AS
SELECT 
    b.*,
    c.full_name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    v.name as vehicle_name,
    v.license_plate,
    v.make,
    v.model,
    v.year as vehicle_year,
    br.name as branch_name
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN vehicles v ON b.vehicle_id = v.id
LEFT JOIN branches br ON b.branch_id = br.id;

-- Revenue summary by month
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_bookings,
    SUM(total_amount) as total_revenue,
    SUM(deposit_amount) as total_deposits,
    AVG(total_amount) as avg_booking_value
FROM bookings
WHERE status IN('completed', 'confirmed')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Fleet utilization
CREATE OR REPLACE VIEW fleet_utilization AS
SELECT 
    v.company_id,
    v.id,
    v.name,
    v.license_plate,
    v.status,
    COUNT(b.id) as total_bookings,
    SUM(b.total_amount) as total_revenue
FROM vehicles v
LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status IN ('completed', 'confirmed')
GROUP BY v.company_id, v.id, v.name, v.license_plate, v.status;

-- ============================================
-- SEED DATA: Permissions
-- ============================================

INSERT INTO permissions (name, display_name_ar, display_name_en, category) VALUES
-- Fleet Management
('fleet.view', 'عرض الأسطول', 'View Fleet', 'fleet'),
('fleet.create', 'إضافة سيارة', 'Create Vehicle', 'fleet'),
('fleet.edit', 'تعديل سيارة', 'Edit Vehicle', 'fleet'),
('fleet.delete', 'حذف سيارة', 'Delete Vehicle', 'fleet'),
('fleet.maintenance', 'إدارة الصيانة', 'Manage Maintenance', 'fleet'),
('fleet.reports', 'تقارير الأسطول', 'Fleet Reports', 'fleet'),

-- Bookings
('bookings.view', 'عرض الحجوزات', 'View Bookings', 'bookings'),
('bookings.create', 'إنشاء حجز', 'Create Booking', 'bookings'),
('bookings.edit', 'تعديل حجز', 'Edit Booking', 'bookings'),
('bookings.delete', 'حذف حجز', 'Delete Booking', 'bookings'),
('bookings.cancel', 'إلغاء حجز', 'Cancel Booking', 'bookings'),
('bookings.reports', 'تقارير الحجوزات', 'Booking Reports', 'bookings'),

-- Customers
('customers.view', 'عرض العملاء', 'View Customers', 'customers'),
('customers.create', 'إضافة عميل', 'Create Customer', 'customers'),
('customers.edit', 'تعديل عميل', 'Edit Customer', 'customers'),
('customers.delete', 'حذف عميل', 'Delete Customer', 'customers'),
('customers.blacklist', 'إضافة للقائمة السوداء', 'Blacklist Customer', 'customers'),
('customers.reports', 'تقارير العملاء', 'Customer Reports', 'customers'),

-- Contracts
('contracts.view', 'عرض العقود', 'View Contracts', 'contracts'),
('contracts.create', 'إنشاء عقد', 'Create Contract', 'contracts'),
('contracts.edit', 'تعديل عقد', 'Edit Contract', 'contracts'),
('contracts.sign', 'توقيع عقد', 'Sign Contract', 'contracts'),
('contracts.delete', 'حذف عقد', 'Delete Contract', 'contracts'),

-- Invoices
('invoices.view', 'عرض الفواتير', 'View Invoices', 'invoices'),
('invoices.create', 'إنشاء فاتورة', 'Create Invoice', 'invoices'),
('invoices.edit', 'تعديل فاتورة', 'Edit Invoice', 'invoices'),
('invoices.delete', 'حذف فاتورة', 'Delete Invoice', 'invoices'),
('invoices.export', 'تصدير فاتورة', 'Export Invoice', 'invoices'),

-- Payments
('payments.view', 'عرض المدفوعات', 'View Payments', 'payments'),
('payments.create', 'تسجيل مدفوعة', 'Create Payment', 'payments'),
('payments.refund', 'استرجاع مدفوعة', 'Refund Payment', 'payments'),
('payments.reports', 'تقارير مالية', 'Financial Reports', 'payments'),

-- Reports
('reports.revenue', 'تقارير الإيرادات', 'Revenue Reports', 'reports'),
('reports.fleet', 'تقارير الأسطول', 'Fleet Reports', 'reports'),
('reports.bookings', 'تقارير الحجوزات', 'Booking Reports', 'reports'),
('reports.customers', 'تقارير العملاء', 'Customer Reports', 'reports'),
('reports.financial', 'التقارير المالية', 'Financial Reports', 'reports'),

-- Users & Settings
('users.view', 'عرض المستخدمين', 'View Users', 'users'),
('users.create', 'إضافة مستخدم', 'Create User', 'users'),
('users.edit', 'تعديل مستخدم', 'Edit User', 'users'),
('users.delete', 'حذف مستخدم', 'Delete User', 'users'),
('users.permissions', 'إدارة الصلاحيات', 'Manage Permissions', 'users'),
('settings.view', 'عرض الإعدادات', 'View Settings', 'settings'),
('settings.edit', 'تعديل الإعدادات', 'Edit Settings', 'settings'),

-- Branches
('branches.view', 'عرض الفروع', 'View Branches', 'branches'),
('branches.create', 'إضافة فرع', 'Create Branch', 'branches'),
('branches.edit', 'تعديل فرع', 'Edit Branch', 'branches'),
('branches.delete', 'حذف فرع', 'Delete Branch', 'branches'),

-- Super Admin
('super_admin.companies', 'إدارة الشركات', 'Manage Companies', 'super_admin'),
('super_admin.subscriptions', 'إدارة الاشتراكات', 'Manage Subscriptions', 'super_admin'),
('super_admin.platform', 'إدارة المنصة', 'Platform Management', 'super_admin');

-- Insert role permissions for Super Admin (all permissions)
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'super_admin', id, TRUE FROM permissions;

-- Insert role permissions for Company Owner
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'company_owner', id, TRUE FROM permissions WHERE name NOT LIKE 'super_admin%';

-- Insert role permissions for Branch Manager
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'branch_manager', id, TRUE FROM permissions 
WHERE category IN ('fleet', 'bookings', 'customers', 'contracts', 'branches')
AND name NOT LIKE '%delete%';

-- Insert role permissions for Employee
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'employee', id, TRUE FROM permissions 
WHERE name LIKE '%.view%' OR name IN ('bookings.create', 'bookings.edit', 'customers.view', 'customers.create');

-- Insert role permissions for Accountant
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'accountant', id, TRUE FROM permissions 
WHERE category IN ('invoices', 'payments', 'reports.financial', 'reports.revenue');

-- Insert role permissions for Reception
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'reception', id, TRUE FROM permissions 
WHERE name LIKE '%.view%' OR name IN ('bookings.create', 'bookings.edit', 'customers.view', 'customers.create');

-- Insert role permissions for Driver
INSERT INTO role_permissions (role, permission_id, is_granted)
SELECT 'driver', id, TRUE FROM permissions 
WHERE name IN ('bookings.view', 'vehicles.view', 'customers.view');