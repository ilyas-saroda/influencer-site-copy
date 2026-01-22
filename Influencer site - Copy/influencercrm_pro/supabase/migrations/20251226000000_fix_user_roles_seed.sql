-- Fix User Roles Seed Data
-- Created: 2025-12-26
-- Purpose: Ensure user_roles table has data and is accessible

-- ============================================================
-- 1. VERIFY AND INSERT ROLES IF MISSING
-- ============================================================

-- Insert roles if they don't exist
INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('super_admin', 'Super Admin', 
     '["all"]'::jsonb,
     'Full system access with ability to manage all settings and users')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('admin', 'Admin',
     '["users.manage", "settings.manage", "campaigns.manage", "creators.manage", "brands.manage"]'::jsonb,
     'Administrative access to manage users, settings, and business operations')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('manager', 'Manager',
     '["campaigns.manage", "creators.view", "brands.view", "payments.view"]'::jsonb,
     'Can manage campaigns and view creator/brand information')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('user', 'User',
     '["campaigns.view", "creators.view", "brands.view"]'::jsonb,
     'Standard user with view access to campaigns, creators, and brands')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_roles (role_name, display_name, permissions, description) VALUES
    ('viewer', 'Viewer',
     '["campaigns.view"]'::jsonb,
     'Read-only access to campaign information')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================
-- 2. VERIFY RLS POLICY EXISTS
-- ============================================================

-- Ensure the policy exists for viewing roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles' 
        AND policyname = 'Roles viewable by authenticated users'
    ) THEN
        CREATE POLICY "Roles viewable by authenticated users"
            ON user_roles FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- ============================================================
-- 3. VERIFICATION QUERY
-- ============================================================

-- This query should return 5 roles
-- SELECT COUNT(*) FROM user_roles;
-- SELECT role_name, display_name FROM user_roles ORDER BY role_name;

