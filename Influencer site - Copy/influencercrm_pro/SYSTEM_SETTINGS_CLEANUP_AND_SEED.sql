-- =====================================================
-- System Settings Cleanup & Dynamic Branding Setup
-- =====================================================
-- Run this script in Supabase SQL Editor

-- Step 1: Clean existing data
TRUNCATE TABLE system_settings RESTART IDENTITY;

-- Step 2: Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON system_settings;
DROP POLICY IF EXISTS "System settings can be managed by super_admins" ON system_settings;

-- Step 4: Create RLS Policies
-- Allow public read access for general settings (is_public = true)
CREATE POLICY "Public settings are viewable by everyone" ON system_settings
    FOR SELECT USING (is_public = true);

-- Allow super_admins full access to all settings
CREATE POLICY "System settings can be managed by super_admins" ON system_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'super_admin' OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Step 5: Insert clean system settings data
INSERT INTO system_settings (setting_key, setting_value, setting_category, is_public) VALUES
-- General Settings (Public)
('platform_name', '"Uppal Media"', 'general', true),
('maintenance_mode', 'false', 'general', true),
('primary_theme_color', '"#3b82f6"', 'branding', true),
('max_import_limit', '5000', 'general', true),
('default_currency', '"INR"', 'general', true),

-- Additional Settings for better functionality
('app_timezone', '"Asia/Kolkata"', 'general', true),
('max_file_upload_size_mb', '50', 'general', true),
('enable_user_registration', 'true', 'security', false),
('session_timeout_minutes', '120', 'security', false),
('max_login_attempts', '5', 'security', false),
('password_min_length', '8', 'security', false),
('enable_two_factor_auth', 'false', 'security', false),
('api_rate_limit_per_minute', '100', 'security', false),
('enable_email_notifications', 'true', 'notification', true),
('notification_email', '"admin@uppalmedia.com"', 'notification', false),
('payment_gateway', '"razorpay"', 'payment', false),
('backup_frequency_hours', '24', 'integration', false),
('audit_log_retention_days', '90', 'integration', false),
('system_health_check_enabled', 'true', 'integration', false);

-- Step 6: Create/Update RPC function for safe settings retrieval
CREATE OR REPLACE FUNCTION get_system_settings_safe()
RETURNS TABLE (
    id uuid,
    setting_key text,
    setting_value jsonb,
    setting_category text,
    is_public boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.setting_key,
        s.setting_value,
        s.setting_category,
        s.is_public,
        s.created_at,
        s.updated_at
    FROM system_settings s
    WHERE 
        -- Super admins can see all settings
        (
            auth.jwt() ->> 'role' = 'super_admin' OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'super_admin'
            )
        )
        OR
        -- Other users can only see public settings
        s.is_public = true
    ORDER BY s.setting_category, s.setting_key;
END;
$$;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_system_settings_safe TO authenticated;
GRANT SELECT ON system_settings TO authenticated;
GRANT UPDATE ON system_settings TO authenticated;

-- Step 8: Verify the data was inserted correctly
SELECT 
    setting_key,
    setting_value,
    setting_category,
    is_public,
    created_at
FROM system_settings 
ORDER BY setting_category, setting_key;

-- =====================================================
-- Completion Message
-- =====================================================
-- System settings have been cleaned, RLS enabled, and seeded with default values.
-- The following settings are now available:
-- - platform_name: "Uppal Media"
-- - maintenance_mode: false
-- - primary_theme_color: "#3b82f6"
-- - max_import_limit: 5000
-- - default_currency: "INR"
-- 
-- RLS Policies:
-- - Public settings (is_public=true) are viewable by all authenticated users
-- - Only super_admins can modify settings
-- - Only super_admins can view non-public settings
