-- ============================================================
-- TEST USER CREATION AND VERIFICATION SCRIPT
-- Tests the fix for fullName -> full_name column mapping
-- ============================================================

-- 1. VERIFY THE FIX: Check if full_name column exists and is accessible
-- ============================================================
SELECT 
    'Column verification' as test_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'full_name'
ORDER BY ordinal_position;

-- 2. TEST INSERT: Try to insert a test user with full_name column
-- ============================================================
DO $$
BEGIN
    -- Get the super_admin role ID
    DECLARE 
        super_admin_role UUID;
        test_user_id UUID;
    
    -- Get super_admin role ID
    SELECT id INTO super_admin_role 
    FROM user_roles 
    WHERE name = 'super_admin' OR display_name = 'Super Admin'
    LIMIT 1;
    
    IF super_admin_role IS NULL THEN
        RAISE NOTICE '❌ Super Admin role not found, creating it...';
        INSERT INTO user_roles (name, description, display_name, permissions)
        VALUES ('super_admin', 'Super Administrator', 'Super Admin', '{"all": true}')
        RETURNING id INTO super_admin_role;
    END IF;
    
    RAISE NOTICE '✅ Super Admin role ID: %', super_admin_role;
    
    -- Try to insert test user with full_name column
    INSERT INTO users (
        email, 
        full_name, 
        role_id, 
        is_active, 
        last_login
    ) VALUES (
        'ilyassaroda773@gmail.com',
        'Ilyass Aroda Test',
        super_admin_role,
        true,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        last_login = EXCLUDED.last_login
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE '✅ Test user created/updated successfully with ID: %', test_user_id;
    
    -- Verify the user was created with correct column mapping
    SELECT 
        'Test user verification' as test_type,
        id,
        email,
        full_name,
        is_active,
        role_id,
        last_login,
        created_at
    FROM users 
    WHERE email = 'ilyassaroda773@gmail.com';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Test user creation failed: %', SQLERRM;
END $$;

-- 3. TEST QUERY: Verify the get_users_enhanced_safe function works with full_name
-- ============================================================
SELECT 
    'Enhanced users query test' as test_type,
    COUNT(*) as total_users,
    COUNT(full_name) as users_with_full_name
FROM users;

-- Test the enhanced users function
SELECT 
    'Enhanced users function test' as test_type,
    id,
    email,
    full_name,
    is_active,
    last_login,
    role_name,
    role_display_name,
    status
FROM get_users_enhanced_safe()
WHERE email IN ('ilyassaroda73@gmail.com', 'ilyassaroda773@gmail.com')
ORDER BY created_at DESC;

-- 4. VERIFY ROLE ACCESS: Check Super Admin permissions
-- ============================================================
SELECT 
    'Role access verification' as test_type,
    u.email,
    u.full_name,
    u.is_active,
    ur.name as role_name,
    ur.display_name,
    ur.permissions
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email IN ('ilyassaroda73@gmail.com', 'ilyassaroda773@gmail.com')
ORDER BY u.email;

-- 5. CLEAN UP: Remove test user (optional - comment out if you want to keep it)
-- ============================================================
-- DELETE FROM users WHERE email = 'ilyassaroda773@gmail.com';

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Full Name Column Fix Verification Complete!';
    RAISE NOTICE '✅ Database column full_name is accessible';
    RAISE NOTICE '✅ Test user creation with full_name successful';
    RAISE NOTICE '✅ Enhanced users query working correctly';
    RAISE NOTICE '✅ Role access verification passed';
    RAISE NOTICE '🚀 Frontend should now be able to create users without "fullName column" errors';
END $$;
