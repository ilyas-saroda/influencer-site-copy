-- ============================================================
-- SUPABASE DATABASE TABLES VERIFICATION
-- ============================================================
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if user_roles table exists and has data
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. Check user_roles table data
SELECT COUNT(*) as total_roles FROM user_roles;

-- 3. Show sample user_roles data
SELECT 
    id,
    role_name,
    display_name,
    permissions,
    description,
    created_at
FROM user_roles 
LIMIT 5;

-- 4. Check if users table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check users table data
SELECT COUNT(*) as total_users FROM users;

-- 6. Show sample users data with roles
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.created_at,
    ur.role_name,
    ur.display_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
LIMIT 5;

-- 7. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_roles', 'users')
ORDER BY tablename, policyname;

-- 8. Check if Edge Functions exist
SELECT 
    function_name,
    function_type,
    created_at
FROM pg_proc 
WHERE function_name LIKE 'create-user'
   OR function_name LIKE '%create%user%';
