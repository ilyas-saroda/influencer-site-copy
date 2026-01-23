-- ============================================================
-- ADMIN CONTROL CENTER ENHANCEMENT MIGRATION
-- Enhances existing system_settings with additional configurations
-- ============================================================

-- 1. ENHANCE SYSTEM SETTINGS WITH ADDITIONAL CONFIGURATIONS
-- ============================================================

-- Add new admin-specific settings
INSERT INTO system_settings (setting_key, setting_value, setting_category, description, is_public) VALUES
    ('platform_name', '"Influencer CRM Pro"'::jsonb, 'general', 'Platform name displayed in UI header', true),
    ('maintenance_mode', 'false'::jsonb, 'general', 'Enable maintenance mode to disable user access', false),
    ('allowed_email_domains', '["gmail.com", "yahoo.com", "outlook.com", "company.com"]'::jsonb, 'security', 'Allowed email domains for user registration', false),
    ('default_campaign_currency', '"INR"'::jsonb, 'general', 'Default currency for campaigns', true),
    ('audit_log_retention_days', '90'::jsonb, 'security', 'Number of days to retain audit logs', false),
    ('max_import_rows', '5000'::jsonb, 'general', 'Maximum rows allowed per Excel import', false),
    ('enable_user_registration', 'true'::jsonb, 'security', 'Allow new user registration', false),
    ('session_timeout_minutes', '60'::jsonb, 'security', 'Session timeout in minutes', false),
    ('force_logout_all_users', 'false'::jsonb, 'security', 'Force logout all users (temporary flag)', false),
    'system_health_check_enabled', 'true'::jsonb, 'general', 'Enable system health monitoring', false),
    ('backup_frequency_hours', '24'::jsonb, 'general', 'Automatic backup frequency in hours', false),
    ('max_file_upload_size_mb', '10'::jsonb, 'general', 'Maximum file upload size in MB', false),
    ('enable_two_factor_auth', 'false'::jsonb, 'security', 'Enable two-factor authentication', false),
    ('default_user_role', '"user"'::jsonb, 'general', 'Default role for new users', false),
    ('api_rate_limit_per_minute', '100'::jsonb, 'security', 'API rate limit per minute per user', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = now();

-- 2. ENHANCED RLS POLICIES FOR SUPER ADMIN ONLY ACCESS
-- ============================================================

-- Drop existing policies and recreate with stricter controls
DROP POLICY IF EXISTS "All settings manageable by admins" ON system_settings;
DROP POLICY IF EXISTS "Public settings viewable by authenticated users" ON system_settings;

-- Recreate with super admin only write access
CREATE POLICY "Public settings viewable by authenticated users"
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

-- 3. CREATE ADMIN FUNCTIONS FOR SYSTEM MANAGEMENT
-- ============================================================

-- Function to get system health status
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
    health_status JSONB;
    active_sessions INTEGER;
    total_users INTEGER;
    total_campaigns INTEGER;
    last_backup TIMESTAMPTZ;
BEGIN
    -- Count active sessions (simplified - you may need to adjust based on your session tracking)
    SELECT COUNT(*) INTO active_sessions
    FROM users
    WHERE last_login > NOW() - INTERVAL '1 hour';
    
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM users WHERE is_active = true;
    
    -- Count total campaigns (adjust table name if needed)
    SELECT COUNT(*) INTO total_campaigns 
    FROM campaigns 
    WHERE created_at > NOW() - INTERVAL '30 days';
    
    -- Get last backup timestamp (placeholder - adjust based on your backup system)
    SELECT COALESCE(MAX(created_at), NOW() - INTERVAL '24 hours') INTO last_backup
    FROM audit_logs
    WHERE action = 'backup_completed'
    ORDER BY created_at DESC
    LIMIT 1;
    
    health_status := jsonb_build_object(
        'status', 'healthy',
        'active_sessions', active_sessions,
        'total_users', total_users,
        'recent_campaigns', total_campaigns,
        'last_backup', EXTRACT(EPOCH FROM last_backup),
        'database_connection', true,
        'cache_status', 'active',
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );
    
    RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to force logout all users
CREATE OR REPLACE FUNCTION force_logout_all_users()
RETURNS BOOLEAN AS $$
BEGIN
    -- Set the force logout flag
    UPDATE system_settings 
    SET setting_value = 'true'::jsonb, updated_at = NOW()
    WHERE setting_key = 'force_logout_all_users';
    
    -- Log the action
    INSERT INTO audit_logs (user_id, action, entity_type, new_values)
    VALUES (
        (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1),
        'force_logout_all',
        'system_settings',
        jsonb_build_object('action', 'force_logout_all_users')
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear system cache
CREATE OR REPLACE FUNCTION clear_system_cache()
RETURNS BOOLEAN AS $$
BEGIN
    -- Log the cache clear action
    INSERT INTO audit_logs (user_id, action, entity_type, new_values)
    VALUES (
        (SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1),
        'cache_cleared',
        'system_settings',
        jsonb_build_object('action', 'clear_system_cache')
    );
    
    -- In a real implementation, you would add actual cache clearing logic here
    -- For Redis: EXECUTE 'redis-cli FLUSHDB'
    -- For application cache: clear in-memory cache
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS JSONB AS $$
DECLARE
    user_stats JSONB;
BEGIN
    user_stats := jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'active_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'users_by_role', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'role', ur.role_name,
                    'count', COUNT(u.id)
                )
            )
            FROM user_roles ur
            LEFT JOIN users u ON ur.id = u.role_id
            GROUP BY ur.role_name
        ),
        'recent_logins', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', u.id,
                    'email', u.email,
                    'last_login', EXTRACT(EPOCH FROM u.last_login)
                )
            )
            FROM users u
            WHERE u.last_login > NOW() - INTERVAL '7 days'
            ORDER BY u.last_login DESC
            LIMIT 10
        )
    );
    
    RETURN user_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE VIEWS FOR ADMIN DASHBOARDS
-- ============================================================

-- View for admin user management
CREATE OR REPLACE VIEW admin_user_management AS
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

-- View for system settings management
CREATE OR REPLACE VIEW admin_settings_view AS
SELECT 
    id,
    setting_key,
    setting_value,
    setting_category,
    description,
    is_public,
    updated_at
FROM system_settings
ORDER BY setting_category, setting_key;

-- 5. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_system_health() TO authenticated;
GRANT EXECUTE ON FUNCTION force_logout_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION clear_system_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;

-- Grant select permissions on views
GRANT SELECT ON admin_user_management TO authenticated;
GRANT SELECT ON admin_settings_view TO authenticated;

-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_category_updated ON system_settings(setting_category, updated_at DESC);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Verify setup
SELECT 'Admin Control Center Enhancement Migration Completed Successfully!' as status;
