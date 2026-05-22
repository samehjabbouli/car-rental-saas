-- Seed data for creating demo users
-- Run this in Supabase SQL Editor to create test users

-- Create a demo company if not exists
INSERT INTO companies (id, name, commercial_name, email, phone, status, subscription_plan, max_vehicles, max_users)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'شركة التأجير الذهبية',
    'Golden Rent Car',
    'info@goldenrental.com',
    '+966501234567',
    'active',
    'professional',
    100,
    50
) ON CONFLICT (id) DO NOTHING;

-- Create super admin user (for super admin dashboard)
INSERT INTO users (id, email, full_name, phone, role, is_active, is_verified)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'superadmin@carrental.com',
    'المشرف العام',
    '+966501234568',
    'super_admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create company owner user (for company dashboard)
INSERT INTO users (id, email, full_name, phone, role, company_id, is_active, is_verified)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'owner@carrental.com',
    'مالك الشركة',
    '+966501234569',
    'company_owner',
    '11111111-1111-1111-1111-111111111111',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Note: For Supabase Auth, you need to create users through the Supabase Dashboard
-- or use the auth.signUp function. The users above are for the application layer.

-- After creating auth users in Supabase Dashboard, update the users table with:
-- UPDATE users SET id = auth.users.id WHERE email = 'your-email@domain.com';