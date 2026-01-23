-- ============================================================
-- CRITICAL FIX: Login Authentication RLS Policies
-- Fixes "Database error granting user" during login
-- ============================================================

-- Enable RLS on profiles table if not already enabled
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on users table if not already enabled
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own user record" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;

-- Create RLS policies for users table
CREATE POLICY "Users can view own user record" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- ENSURE PROFILE CREATION TRIGGER EXISTS
-- ============================================================

-- Drop and recreate the trigger function to ensure it works
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new auth user
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Also create entry in users table if needed
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CREATE MISSING PROFILES FOR EXISTING USERS
-- ============================================================

-- Create profiles for existing auth users who don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create users records for existing auth users who don't have one
INSERT INTO public.users (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check if policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'users')
ORDER BY tablename, policyname;

-- Check if profiles exist for auth users
SELECT 
    'auth_users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'profiles' as source,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'users' as source,
    COUNT(*) as count
FROM public.users;

-- Test RLS by checking current user access (this should work)
SELECT 
    'Current user can access profiles' as test,
    COUNT(*) as profile_count
FROM public.profiles 
WHERE auth.uid() IS NOT NULL;

SELECT 
    'Current user can access users' as test,
    COUNT(*) as user_count
FROM public.users 
WHERE auth.uid() IS NOT NULL;

-- ============================================================
-- SAMPLE USER CREATION FOR TESTING
-- ============================================================

-- Create a default super admin user if none exists
-- This helps with initial setup and testing
DO $$
DECLARE
    admin_user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_user_count
    FROM public.profiles 
    WHERE email = 'admin@upgoalmedia.com';
    
    IF admin_user_count = 0 THEN
        -- Insert into auth.users (this will trigger profile creation)
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'admin@upgoalmedia.com',
            NOW(),
            '{"full_name": "Admin User", "role": "super_admin"}'
        );
        
        RAISE NOTICE '✅ Created default admin user: admin@upgoalmedia.com';
    ELSE
        RAISE NOTICE 'ℹ️ Admin user already exists';
    END IF;
END $$;

-- ============================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================

-- If you still get errors, run these queries to debug:

-- 1. Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'users');

-- 2. Check current user ID
-- SELECT auth.uid(), current_user;

-- 3. Test direct profile access
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- 4. Check trigger exists
-- SELECT tgname, tgrelid::regclass, tgfoid::regproc FROM pg_trigger WHERE tgname = 'on_auth_user_created';

RAISE NOTICE '✅ Login RLS Policies Fix Complete!';
RAISE NOTICE '📝 Next Steps:';
RAISE NOTICE '   1. Test login with existing user credentials';
RAISE NOTICE '   2. If still failing, check browser console for specific error';
RAISE NOTICE '   3. Verify Supabase project has RLS enabled in settings';
