-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper Functions
-- ============================================

-- Get current user's company
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT company_id INTO company_id
    FROM users
    WHERE id = auth.uid();
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    role user_role;
BEGIN
    SELECT u.role INTO role
    FROM users u
    WHERE u.id = auth.uid();
    RETURN COALESCE(role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(perm_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    IF get_user_role() = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = get_user_role()
        AND p.name = perm_name
        AND rp.is_granted = TRUE
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Companies Policies
-- ============================================

-- Companies: Super Admin can do everything
CREATE POLICY "Super Admin can manage all companies"
    ON companies FOR ALL
    USING (get_user_role() = 'super_admin')
    WITH CHECK (get_user_role() = 'super_admin');

-- ============================================
-- Branches Policies
-- ============================================

CREATE POLICY "Users can view branches of their company"
    ON branches FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company owners can manage their branches"
    ON branches FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'super_admin')
    );

-- ============================================
-- Users Policies
-- ============================================

CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid() OR get_user_role() = 'super_admin');

CREATE POLICY "Super Admin can view all users"
    ON users FOR SELECT
    USING (get_user_role() = 'super_admin');

CREATE POLICY "Company users can view company users"
    ON users FOR SELECT
    USING (company_id = get_user_company_id());

CREATE POLICY "Company owners can manage company users"
    ON users FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'super_admin')
    );

-- ============================================
-- Vehicles Policies
-- ============================================

CREATE POLICY "Users can view vehicles of their company"
    ON vehicles FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Branch managers can manage their branch vehicles"
    ON vehicles FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND (get_user_role() IN ('company_owner', 'branch_manager', 'super_admin') 
             OR (get_user_role() = 'employee' AND has_permission('fleet.create')))
    );

-- ============================================
-- Vehicle Categories Policies
-- ============================================

CREATE POLICY "Users can view vehicle categories"
    ON vehicle_categories FOR SELECT
    USING (
        company_id IS NULL 
        OR company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company owners can manage vehicle categories"
    ON vehicle_categories FOR ALL
    USING (
        (company_id IS NULL AND get_user_role() = 'super_admin')
        OR (company_id = get_user_company_id() AND get_user_role() IN ('company_owner', 'super_admin'))
    );

-- ============================================
-- Vehicle Availability Policies
-- ============================================

CREATE POLICY "Users can view vehicle availability"
    ON vehicle_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles v 
            WHERE v.id = vehicle_availability.vehicle_id 
            AND (v.company_id = get_user_company_id() OR get_user_role() = 'super_admin')
        )
    );

CREATE POLICY "Branch managers can manage availability"
    ON vehicle_availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vehicles v 
            WHERE v.id = vehicle_availability.vehicle_id 
            AND v.company_id = get_user_company_id()
            AND get_user_role() IN ('company_owner', 'branch_manager', 'super_admin')
        )
    );

-- ============================================
-- Maintenance Records Policies
-- ============================================

CREATE POLICY "Users can view maintenance records"
    ON maintenance_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vehicles v 
            WHERE v.id = maintenance_records.vehicle_id 
            AND (v.company_id = get_user_company_id() OR get_user_role() = 'super_admin')
        )
    );

CREATE POLICY "Managers can manage maintenance records"
    ON maintenance_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vehicles v 
            WHERE v.id = maintenance_records.vehicle_id 
            AND v.company_id = get_user_company_id()
            AND get_user_role() IN ('company_owner', 'branch_manager', 'employee', 'super_admin')
            AND has_permission('fleet.maintenance')
        )
    );

-- ============================================
-- Customers Policies
-- ============================================

CREATE POLICY "Users can view customers of their company"
    ON customers FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company staff can manage customers"
    ON customers FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'branch_manager', 'employee', 'reception', 'super_admin')
    );

-- ============================================
-- Loyalty Transactions Policies
-- ============================================

CREATE POLICY "Users can view loyalty transactions"
    ON loyalty_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = loyalty_transactions.customer_id 
            AND (c.company_id = get_user_company_id() OR get_user_role() = 'super_admin')
        )
    );

CREATE POLICY "Staff can manage loyalty transactions"
    ON loyalty_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM customers c 
            WHERE c.id = loyalty_transactions.customer_id 
            AND c.company_id = get_user_company_id()
            AND get_user_role() IN ('company_owner', 'branch_manager', 'employee', 'reception', 'super_admin')
        )
    );

-- ============================================
-- Bookings Policies
-- ============================================

CREATE POLICY "Users can view bookings of their company"
    ON bookings FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company staff can manage bookings"
    ON bookings FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'branch_manager', 'employee', 'reception', 'super_admin')
    );

-- ============================================
-- Booking Status History Policies
-- ============================================

CREATE POLICY "Users can view booking status history"
    ON booking_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_status_history.booking_id 
            AND (b.company_id = get_user_company_id() OR get_user_role() = 'super_admin')
        )
    );

CREATE POLICY "Staff can manage booking status history"
    ON booking_status_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_status_history.booking_id 
            AND b.company_id = get_user_company_id()
        )
    );

-- ============================================
-- Contracts Policies
-- ============================================

CREATE POLICY "Users can view contracts of their company"
    ON contracts FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company staff can manage contracts"
    ON contracts FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'branch_manager', 'employee', 'super_admin')
        AND has_permission('contracts.create')
    );

-- ============================================
-- Invoices Policies
-- ============================================

CREATE POLICY "Users can view invoices of their company"
    ON invoices FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Accountants can manage invoices"
    ON invoices FOR ALL
    USING (
        company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'accountant', 'super_admin')
        AND has_permission('invoices.create')
    );

-- ============================================
-- Payments Policies
-- ============================================

CREATE POLICY "Users can view payments of their company"
    ON payments FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Accountants can manage payments"
    ON payments FOR ALL
    USING (
company_id = get_user_company_id() 
        AND get_user_role() IN ('company_owner', 'accountant', 'super_admin')
        AND has_permission('payments.create')
    );

-- ============================================
-- Coupons Policies
-- ============================================

CREATE POLICY "Users can view coupons of their company"
    ON coupons FOR SELECT
    USING (
        company_id IS NULL 
        OR company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Company owners can manage coupons"
    ON coupons FOR ALL
    USING (
        (company_id IS NULL AND get_user_role() = 'super_admin')
        OR (company_id = get_user_company_id() AND get_user_role() IN ('company_owner', 'super_admin'))
    );

-- ============================================
-- Activity Logs Policies
-- ============================================

CREATE POLICY "Users can view activity logs of their company"
    ON activity_logs FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "System can insert activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Audit Trail Policies
-- ============================================

CREATE POLICY "Super Admin can view all audit trails"
    ON audit_trail FOR SELECT
    USING (get_user_role() = 'super_admin');

CREATE POLICY "System can insert audit trails"
    ON audit_trail FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Subscriptions Policies
-- ============================================

CREATE POLICY "Company owners can view their subscriptions"
    ON subscriptions FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Super Admin can manage all subscriptions"
    ON subscriptions FOR ALL
    USING (get_user_role() = 'super_admin');

-- ============================================
-- Billing History Policies
-- ============================================

CREATE POLICY "Company owners can view their billing"
    ON billing_history FOR SELECT
    USING (
        company_id = get_user_company_id() 
        OR get_user_role() = 'super_admin'
    );

CREATE POLICY "Super Admin can manage all billing"
    ON billing_history FOR ALL
    USING (get_user_role() = 'super_admin');

-- ============================================
-- Permissions Tables Policies
-- ============================================

CREATE POLICY "Users can view permissions"
    ON permissions FOR SELECT
    USING (true);

CREATE POLICY "Super Admin can manage role permissions"
    ON role_permissions FOR ALL
    USING (get_user_role() = 'super_admin');

CREATE POLICY "Company owners can manage user permissions"
    ON user_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_permissions.user_id 
            AND u.company_id = get_user_company_id()
            AND get_user_role() IN ('company_owner', 'super_admin')
        )
    );

-- ============================================
-- Helper Functions for System Operations
-- ============================================

-- Log activity function
CREATE OR REPLACE FUNCTION log_activity(
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_description TEXT
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (company_id, user_id, action, entity_type, entity_id, description)
    VALUES (
        get_user_company_id(),
        auth.uid(),
        p_action,
        p_entity_type,
        p_entity_id,
        p_description
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit trail function
CREATE OR REPLACE FUNCTION audit_trail_func(
    p_table_name VARCHAR,
    p_record_id UUID,
    p_action VARCHAR,
    p_old_values JSONB,
    p_new_values JSONB
)
RETURNS UUID AS $$
DECLARE
    trail_id UUID;
BEGIN
    INSERT INTO audit_trail (company_id, user_id, table_name, record_id, action, old_values, new_values)
    VALUES (
        get_user_company_id(),
        auth.uid(),
        p_table_name,
        p_record_id,
        p_action,
        p_old_values,
        p_new_values
    )
    RETURNING id INTO trail_id;
    
    RETURN trail_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check vehicle availability
CREATE OR REPLACE FUNCTION check_vehicle_availability(
    p_vehicle_id UUID,
    p_pickup_date TIMESTAMPTZ,
    p_return_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicts INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflicts
    FROM bookings
    WHERE vehicle_id = p_vehicle_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (
        (pickup_date <= p_pickup_date AND return_date >= p_pickup_date)
        OR (pickup_date <= p_return_date AND return_date >= p_return_date)
        OR (pickup_date >= p_pickup_date AND return_date <= p_return_date)
    );
    
    RETURN conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- Get available vehicles
CREATE OR REPLACE FUNCTION get_available_vehicles(
    p_pickup_date TIMESTAMPTZ,
    p_return_date TIMESTAMPTZ,
    p_category_id UUID DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
    vehicle_id UUID,
    name VARCHAR,
    make VARCHAR,
    model VARCHAR,
    year INTEGER,
    license_plate VARCHAR,
    daily_rate DECIMAL,
    images JSONB,
    available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.daily_rate,
        v.images,
        check_vehicle_availability(v.id, p_pickup_date, p_return_date) as available
    FROM vehicles v
    WHERE v.company_id = get_user_company_id()
    AND v.status = 'available'
    AND v.is_active = TRUE
    AND (p_category_id IS NULL OR v.category_id = p_category_id)
    AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
    AND check_vehicle_availability(v.id, p_pickup_date, p_return_date) = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate booking total
CREATE OR REPLACE FUNCTION calculate_booking_total(
    p_vehicle_id UUID,
    p_pickup_date TIMESTAMPTZ,
    p_return_date TIMESTAMPTZ,
    p_daily_rate DECIMAL,
    p_discount_code VARCHAR DEFAULT NULL,
    p_tax_rate DECIMAL DEFAULT 15.00
)
RETURNS TABLE(
    number_of_days INTEGER,
    subtotal DECIMAL,
    discount_amount DECIMAL,
    tax_amount DECIMAL,
    total_amount DECIMAL,
    deposit_amount DECIMAL
) AS $$
DECLARE
    v_days INTEGER;
    v_subtotal DECIMAL;
    v_discount DECIMAL := 0;
    v_tax DECIMAL;
    v_total DECIMAL;
    v_deposit DECIMAL;
BEGIN
    -- Calculate number of days (minimum 1)
    v_days := GREATEST(CEIL(EXTRACT(EPOCH FROM (p_return_date - p_pickup_date)) / 86400)::INTEGER, 1);
    number_of_days := v_days;
    
    -- Calculate subtotal
    v_subtotal := p_daily_rate * v_days;
    subtotal := v_subtotal;
    
    -- Apply discount if code provided
    IF p_discount_code IS NOT NULL THEN
        SELECT discount_value INTO v_discount
        FROM coupons
        WHERE code = p_discount_code
        AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (usage_limit IS NULL OR used_count < usage_limit);
        
        IF v_discount IS NOT NULL THEN
            -- Apply as percentage or fixed amount
            discount_amount := v_discount;
        ELSE
            discount_amount := 0;
        END IF;
    ELSE
        discount_amount := 0;
    END IF;
    
    -- Calculate tax
    v_tax := (v_subtotal - discount_amount) * (p_tax_rate / 100);
    tax_amount := v_tax;
    
    -- Calculate total
    v_total := v_subtotal - discount_amount + v_tax;
    total_amount := v_total;
    
    -- Calculate deposit (typically 20% or daily rate)
    v_deposit := GREATEST(v_subtotal * 0.2, p_daily_rate);
    deposit_amount := v_deposit;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;