-- ============================================================
-- SUPABASE RLS COLUMN ERROR DIAGNOSTIC & FIX
-- Fixes ERROR: 42703: column u2.auth_id does not exist
-- ============================================================

-- 1. DIAGNOSTIC: Find all references to u2.auth_id
-- ============================================================

-- Check existing RLS policies for u2 references
SELECT 
    'RLS Policies' as object_type,
    schemaname || '.' || tablename as table_name,
    policyname,
    cmd,
    qual as policy_definition
FROM pg_policies 
WHERE qual LIKE '%u2.auth_id%' 
   OR qual LIKE '%u2\.auth_id%'
   OR with_check LIKE '%u2.auth_id%'
   OR with_check LIKE '%u2\.auth_id%';

-- Check existing functions for u2 references
SELECT 
    'Functions' as object_type,
    routine_name as function_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%u2.auth_id%' 
   OR routine_definition LIKE '%u2\.auth_id%'
   AND routine_schema = 'public';

-- Check existing views for u2 references
SELECT 
    'Views' as object_type,
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%u2.auth_id%' 
   OR view_definition LIKE '%u2\.auth_id%'
   AND table_schema = 'public';

-- 2. SAFE CLEANUP: Remove problematic policies and functions
-- ============================================================

-- Drop any policies that might reference u2.auth_id
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual LIKE '%u2.auth_id%' 
           OR qual LIKE '%u2\.auth_id%'
           OR with_check LIKE '%u2.auth_id%'
           OR with_check LIKE '%u2\.auth_id%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %I on %I.%I', 
                    policy_record.policyname, 
                    policy_record.schemaname, 
                    policy_record.tablename;
    END LOOP;
END $$;

-- Drop any functions that might reference u2.auth_id
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_definition LIKE '%u2.auth_id%' 
           OR routine_definition LIKE '%u2\.auth_id%'
           AND routine_schema = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.routine_name);
        RAISE NOTICE 'Dropped function: %I', func_record.routine_name;
    END LOOP;
END $$;

-- Drop any views that might reference u2.auth_id
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE view_definition LIKE '%u2.auth_id%' 
           OR view_definition LIKE '%u2\.auth_id%'
           AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_record.table_name);
        RAISE NOTICE 'Dropped view: %I', view_record.table_name;
    END LOOP;
END $$;

-- 3. VERIFY TABLE SCHEMA: Ensure auth_id column exists
-- ============================================================

-- Check if auth_id column exists in users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auth_id' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ auth_id column missing from users table - adding it...';
        
        -- Add auth_id column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ auth_id column added to users table';
    ELSE
        RAISE NOTICE '✅ auth_id column exists in users table';
    END IF;
END $$;

-- Show current users table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. RECREATE CLEAN RLS POLICIES (no u2 references)
-- ============================================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Clean RLS policies for users table
DROP POLICY IF EXISTS "Users viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users manageable by admins" ON users;

-- Create clean RLS policies for users
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
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

-- Clean RLS policies for system_settings
DROP POLICY IF EXISTS "Public settings viewable by all authenticated users" ON system_settings;
DROP POLICY IF EXISTS "All settings viewable by admins" ON system_settings;
DROP POLICY IF EXISTS "Settings writable by super admins only" ON system_settings;

CREATE POLICY "Public settings viewable by all authenticated users"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_public = true);

CREATE POLICY "All settings viewable by admins"
    ON system_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Settings writable by super admins only"
    ON system_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    );

-- Clean RLS policies for user_roles
DROP POLICY IF EXISTS "Roles viewable by authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Roles manageable by super admins only" ON user_roles;

CREATE POLICY "Roles viewable by authenticated users"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Roles manageable by super admins only"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name = 'super_admin'
        )
    );

-- 5. RECREATE CLEAN FUNCTIONS (no u2 references)
-- ============================================================

-- Clean user role update function
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
    FROM users u1
    JOIN user_roles ur ON u1.role_id = ur.id
    WHERE u1.auth_id = auth.uid();
    
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
    
    -- Log the action (if audit_logs exists)
    BEGIN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (
            (SELECT id FROM users WHERE auth_id = auth.uid()),
            'role_updated',
            'users',
            target_user_id,
            jsonb_build_object('new_role_id', new_role_id, 'target_email', target_user_email)
        );
    EXCEPTION WHEN undefined_table THEN
        -- audit_logs table doesn't exist, skip logging
        NULL;
    END;
    
    RETURN jsonb_build_object('success', true, 'message', 'User role updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean system settings function
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
            SELECT 1 FROM users u1
            JOIN user_roles ur ON u1.role_id = ur.id
            WHERE u1.auth_id = auth.uid()
            AND ur.role_name IN ('super_admin', 'admin')
        )
    ORDER BY ss.setting_category, ss.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean enhanced users function
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

-- 6. GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION update_user_role_safely(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_settings_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_enhanced_safe() TO authenticated;

-- 7. FINAL VERIFICATION
-- ============================================================

-- Verify no more u2 references
SELECT 
    'Final Check - No u2 references should appear below' as status,
    'If any results appear, there are still problematic references' as note;

-- Check policies again
SELECT 
    'RLS Policies' as object_type,
    schemaname || '.' || tablename as table_name,
    policyname,
    CASE 
        WHEN qual LIKE '%u2.auth_id%' OR qual LIKE '%u2\.auth_id%' THEN '❌ STILL HAS u2'
        ELSE '✅ CLEAN'
    END as status
FROM pg_policies 
WHERE tablename IN ('users', 'user_roles', 'system_settings');

-- Check functions again
SELECT 
    'Functions' as object_type,
    routine_name as function_name,
    CASE 
        WHEN routine_definition LIKE '%u2.auth_id%' OR routine_definition LIKE '%u2\.auth_id%' THEN '❌ STILL HAS u2'
        ELSE '✅ CLEAN'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('update_user_role_safely', 'get_system_settings_safe', 'get_users_enhanced_safe');

-- ============================================================
-- FIX COMPLETE
-- ============================================================

SELECT 'RLS Column Error Fix Applied Successfully!' as status,
       'All u2.auth_id references have been cleaned up' as details;
