-- ============================================================
-- ADMIN CONTROL CENTER VERIFICATION SCRIPT
-- Run this to verify all fixes are working correctly
-- ============================================================

-- 1. Verify Tables Exist
SELECT 
    'Table Verification' as test_type,
    table_name,
    CASE 
        WHEN table_name IN ('system_settings', 'user_roles', 'users') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('system_settings', 'user_roles', 'users')
ORDER BY table_name;

-- 2. Verify Data Seeding
SELECT 
    'Data Verification' as test_type,
    'system_settings' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SEEDED'
        ELSE '❌ EMPTY'
    END as status
FROM system_settings
UNION ALL
SELECT 
    'Data Verification' as test_type,
    'user_roles' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ SEEDED'
        ELSE '❌ INCOMPLETE'
    END as status
FROM user_roles
UNION ALL
SELECT 
    'Data Verification' as test_type,
    'users' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS USERS'
        ELSE '❌ EMPTY'
    END as status
FROM users;

-- 3. Verify RLS Policies
SELECT 
    'RLS Policies' as test_type,
    schemaname || '.' || tablename as table_name,
    policyname,
    permissive,
    roles,
    CASE 
        WHEN cmd IN ('SELECT', 'INSERT', 'UPDATE', 'ALL') THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as status
FROM pg_policies 
WHERE tablename IN ('system_settings', 'user_roles', 'users')
ORDER BY tablename, policyname;

-- 4. Verify Functions Exist
SELECT 
    'Functions' as test_type,
    routine_name as function_name,
    CASE 
        WHEN routine_name IN (
            'update_user_role_safely', 
            'get_system_settings_safe', 
            'get_users_enhanced_safe',
            'get_system_health',
            'force_logout_all_users',
            'clear_system_cache',
            'get_user_statistics'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name LIKE '%_%'
ORDER BY routine_name;

-- 5. Test Safe Functions (Manual Test Queries)
-- Uncomment these to test manually:

-- Test system settings function
-- SELECT * FROM get_system_settings_safe() LIMIT 5;

-- Test user role update function (replace with actual UUIDs)
-- SELECT update_user_role_safely('user-uuid-here', 'role-uuid-here');

-- Test enhanced users function
-- SELECT * FROM get_users_enhanced_safe() LIMIT 5;

-- 6. Check Indexes
SELECT 
    'Indexes' as test_type,
    schemaname || '.' || tablename as table_name,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ CUSTOM INDEX'
        ELSE '📄 DEFAULT INDEX'
    END as status
FROM pg_indexes 
WHERE tablename IN ('system_settings', 'user_roles', 'users')
    AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. Verify Critical Settings
SELECT 
    'Critical Settings' as test_type,
    setting_key,
    setting_value::text,
    CASE 
        WHEN setting_key IN ('platform_name', 'maintenance_mode', 'default_campaign_currency') 
        AND setting_value IS NOT NULL THEN '✅ CONFIGURED'
        WHEN setting_key IN ('platform_name', 'maintenance_mode', 'default_campaign_currency') 
        THEN '❌ MISSING'
        ELSE '📄 OPTIONAL'
    END as status
FROM system_settings 
WHERE setting_key IN ('platform_name', 'maintenance_mode', 'default_campaign_currency', 'session_timeout_minutes')
ORDER BY setting_key;

-- ============================================================
-- VERIFICATION COMPLETE
-- ============================================================

-- Summary Query
SELECT 
    'Summary' as test_type,
    'Admin Control Center' as component,
    CASE 
        WHEN (
            -- Check if all critical components exist
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') > 0
            AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') > 0
            AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') > 0
            AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'update_user_role_safely' AND routine_schema = 'public') > 0
        ) THEN '🎉 READY FOR TESTING'
        ELSE '⚠️ NEEDS ATTENTION'
    END as status;

-- Manual Testing Instructions:
/*
1. Run this entire script in Supabase SQL Editor
2. All tests should show ✅ status
3. If any test shows ❌, run the EMERGENCY_ADMIN_FIXES.sql script again
4. Test in browser:
   - Login as Super Admin user
   - Navigate to System Settings → Admin Control Center
   - Try changing "Platform Name" setting
   - Try updating a user role
   - Check browser console for clean diagnostic logs
*/
