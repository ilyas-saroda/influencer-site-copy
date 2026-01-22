-- Quick SQL script to seed user_roles table
-- Run this in Supabase SQL Editor or via psql

-- Insert or update roles
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
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    updated_at = now();

-- Verify the roles were inserted
SELECT 
    role_name,
    display_name,
    jsonb_array_length(permissions) as permission_count,
    description
FROM user_roles
ORDER BY role_name;

