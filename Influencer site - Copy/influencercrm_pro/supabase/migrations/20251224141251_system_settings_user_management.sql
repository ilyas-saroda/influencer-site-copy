-- System Settings & User Management Migration
-- Created: 2025-12-24 14:12:51

-- ============================================================
-- 1. SYSTEM SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL,
    setting_category text NOT NULL CHECK (setting_category IN ('general', 'security', 'notification', 'integration', 'payment', 'email')),
    description text,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. USER ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name text UNIQUE NOT NULL CHECK (role_name IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
    display_name text NOT NULL,
    permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role_id uuid REFERENCES user_roles(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(setting_category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- System Settings Policies
CREATE POLICY "Public settings viewable by authenticated users"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_public = true);

CREATE POLICY "All settings manageable by admins"
    ON system_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- User Roles Policies
CREATE POLICY "Roles viewable by authenticated users"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Roles manageable by super admins only"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    );

-- Users Policies
CREATE POLICY "Users viewable by authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users manageable by admins"
    ON users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- Audit Logs Policies
CREATE POLICY "Audit logs viewable by admins"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Audit logs insertable by authenticated users"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================
-- 8. SEED DATA FOR USER ROLES
-- ============================================================
INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('super_admin', 'Super Admin', 
     '["all"]'::jsonb,
     'Full system access with ability to manage all settings and users'),
    ('admin', 'Admin',
     '["users.manage", "settings.manage", "campaigns.manage", "creators.manage", "brands.manage"]'::jsonb,
     'Administrative access to manage users, settings, and business operations'),
    ('manager', 'Manager',
     '["campaigns.manage", "creators.view", "brands.view", "payments.view"]'::jsonb,
     'Can manage campaigns and view creator/brand information'),
    ('user', 'User',
     '["campaigns.view", "creators.view", "brands.view"]'::jsonb,
     'Standard user with view access to campaigns, creators, and brands'),
    ('viewer', 'Viewer',
     '["campaigns.view"]'::jsonb,
     'Read-only access to campaign information')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================
-- 9. SEED DATA FOR SYSTEM SETTINGS
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, is_public) VALUES
    ('app_name', '"CRM Dashboard"'::jsonb, 'general', 'Application name displayed in UI', true),
    ('app_timezone', '"Asia/Kolkata"'::jsonb, 'general', 'Default timezone for the application', true),
    ('session_timeout', '3600'::jsonb, 'security', 'Session timeout in seconds (1 hour)', false),
    ('max_login_attempts', '5'::jsonb, 'security', 'Maximum failed login attempts before lockout', false),
    ('password_min_length', '8'::jsonb, 'security', 'Minimum password length requirement', false),
    ('enable_email_notifications', 'true'::jsonb, 'notification', 'Enable email notifications', false),
    ('notification_email', '"admin@example.com"'::jsonb, 'notification', 'Admin notification email', false),
    ('payment_currency', '"INR"'::jsonb, 'payment', 'Default currency for payments', true),
    ('payment_gateway', '"razorpay"'::jsonb, 'payment', 'Active payment gateway', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- 10. HELPER FUNCTION TO CREATE USER RECORD WHEN AUTH USER EXISTS
-- ============================================================
-- This function will be called after a user signs up through Supabase Auth
-- to create a corresponding record in the public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id uuid;
BEGIN
    -- Get the default 'user' role ID
    SELECT id INTO default_role_id FROM user_roles WHERE role_name = 'user' LIMIT 1;
    
    -- Insert into public.users table
    INSERT INTO public.users (auth_id, email, full_name, role_id, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        default_role_id,
        true
    )
    ON CONFLICT (email) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to automatically create public.users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================
-- 11. MANUAL USER CREATION INSTRUCTIONS
-- ============================================================
-- To create admin user manually:
-- 1. Sign up through Supabase Auth Dashboard or your app's sign-up flow
-- 2. After signup, update the user's role in public.users table:
--    UPDATE users 
--    SET role_id = (SELECT id FROM user_roles WHERE role_name = 'super_admin')
--    WHERE email = 'admin@crm.com';