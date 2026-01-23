-- ============================================================
-- EMERGENCY DATABASE FIXES FOR ADMIN CONTROL CENTER
-- Run this in Supabase SQL Editor to fix 404/403 errors
-- ============================================================

-- 1. CHECK AND CREATE TABLES IF MISSING
-- ============================================================

-- Create system_settings table if it doesn't exist
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

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name text UNIQUE NOT NULL CHECK (role_name IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
    display_name text NOT NULL,
    permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create users table if it doesn't exist
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

-- 2. DROP AND RECREATE RLS POLICIES WITH CORRECT LOGIC
-- ============================================================

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public settings viewable by authenticated users" ON system_settings;
DROP POLICY IF EXISTS "All settings viewable by admins" ON system_settings;
DROP POLICY IF EXISTS "Settings writable by super admins only" ON system_settings;
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Roles manageable by super admins only" ON user_roles;
DROP POLICY IF EXISTS "Users viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users manageable by admins" ON users;

-- Create corrected RLS policies for system_settings
CREATE POLICY "Public settings viewable by all authenticated users"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_public = true);

CREATE POLICY "All settings viewable by admins"
    ON system_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Settings writable by super admins only"
    ON system_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    );

-- Create corrected RLS policies for user_roles
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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    );

-- Create corrected RLS policies for users
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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- 3. CREATE OR REPLACE ADMIN FUNCTIONS
-- ============================================================

-- Safe role update function
CREATE OR REPLACE FUNCTION update_user_role_safely(
    target_user_id UUID,
    new_role_id UUID
)
RETURNS JSONB AS $$
DECLARE
    current_user_role TEXT;
    target_user_email TEXT;
BEGIN
    -- Check if current user is super admin
    SELECT ur.role_name INTO current_user_role
    FROM users u
    JOIN user_roles ur ON u.role_id = ur.id
    WHERE u.auth_id = auth.uid();
    
    IF current_user_role != 'super_admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permission denied: Super Admin required');
    END IF;
    
    -- Get target user info for logging
    SELECT email INTO target_user_email
    FROM users
    WHERE id = target_user_id;
    
    -- Update the user role
    UPDATE users
    SET role_id = new_role_id, updated_at = now()
    WHERE id = target_user_id;
    
    -- Log the action
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (
        (SELECT id FROM users WHERE auth_id = auth.uid()),
        'role_updated',
        'users',
        target_user_id,
        jsonb_build_object('new_role_id', new_role_id, 'target_email', target_user_email)
    );
    
    RETURN jsonb_build_object('success', true, 'message', 'User role updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get system settings with proper permissions
CREATE OR REPLACE FUNCTION get_system_settings_safe()
RETURNS TABLE (
    id UUID,
    setting_key TEXT,
    setting_value JSONB,
    setting_category TEXT,
    description TEXT,
    is_public BOOLEAN,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        ss.setting_key,
        ss.setting_value,
        ss.setting_category,
        ss.description,
        ss.is_public,
        ss.updated_at
    FROM system_settings ss
    WHERE 
        ss.is_public = true
        OR EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    ORDER BY ss.setting_category, ss.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get enhanced user list
CREATE OR REPLACE FUNCTION get_users_enhanced_safe()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    is_active BOOLEAN,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    role_name TEXT,
    role_display_name TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        u.last_login,
        u.created_at,
        ur.role_name,
        ur.display_name as role_display_name,
        CASE 
            WHEN u.last_login > NOW() - INTERVAL '1 hour' THEN 'online'
            WHEN u.last_login > NOW() - INTERVAL '24 hours' THEN 'recent'
            ELSE 'offline'
        END as status
    FROM users u
    LEFT JOIN user_roles ur ON u.role_id = ur.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SEED CRITICAL DATA IF MISSING
-- ============================================================

-- Insert user roles if missing
INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('super_admin', 'Super Admin', '["all"]'::jsonb, 'Full system access with ability to manage all settings and users'),
    ('admin', 'Admin', '["users.manage", "settings.manage", "campaigns.manage", "creators.manage", "brands.manage"]'::jsonb, 'Administrative access to manage users, settings, and business operations'),
    ('manager', 'Manager', '["campaigns.manage", "creators.view", "brands.view", "payments.view"]'::jsonb, 'Can manage campaigns and view creator/brand information'),
    ('user', 'User', '["campaigns.view", "creators.view", "brands.view"]'::jsonb, 'Standard user with view access to campaigns, creators, and brands'),
    ('viewer', 'Viewer', '["campaigns.view"]'::jsonb, 'Read-only access to campaign information')
ON CONFLICT (role_name) DO NOTHING;

-- Insert critical system settings if missing
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, is_public) VALUES
    ('platform_name', '"Influencer CRM Pro"'::jsonb, 'general', 'Platform name displayed in UI header', true),
    ('maintenance_mode', 'false'::jsonb, 'general', 'Enable maintenance mode to disable user access', false),
    ('allowed_email_domains', '["gmail.com", "yahoo.com", "outlook.com"]'::jsonb, 'security', 'Allowed email domains for user registration', false),
    ('default_campaign_currency', '"INR"'::jsonb, 'general', 'Default currency for campaigns', true),
    ('audit_log_retention_days', '90'::jsonb, 'security', 'Number of days to retain audit logs', false),
    ('max_import_rows', '5000'::jsonb, 'general', 'Maximum rows allowed per Excel import', false),
    ('enable_user_registration', 'true'::jsonb, 'security', 'Allow new user registration', false),
    ('session_timeout_minutes', '60'::jsonb, 'security', 'Session timeout in minutes', false),
    ('system_health_check_enabled', 'true'::jsonb, 'general', 'Enable system health monitoring', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 5. GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION update_user_role_safely(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_settings_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_enhanced_safe() TO authenticated;

-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(setting_category);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- 7. VERIFICATION QUERIES
-- ============================================================

-- Verify tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        RAISE NOTICE '✅ system_settings table exists';
    ELSE
        RAISE NOTICE '❌ system_settings table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '✅ users table exists';
    ELSE
        RAISE NOTICE '❌ users table missing';
    END IF;
END $$;

-- Verify data
SELECT 
    'system_settings' as table_name, 
    COUNT(*) as record_count 
FROM system_settings
UNION ALL
SELECT 
    'user_roles' as table_name, 
    COUNT(*) as record_count 
FROM user_roles
UNION ALL
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users;

-- ============================================================
-- EMERGENCY FIXES COMPLETE
-- ============================================================

SELECT 'Emergency Database Fixes Applied Successfully!' as status;
