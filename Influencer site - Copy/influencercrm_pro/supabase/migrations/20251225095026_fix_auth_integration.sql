-- =============================================
-- FIX AUTHENTICATION INTEGRATION
-- Migration: 20251225095026_fix_auth_integration.sql
-- Purpose: Ensure proper Supabase Auth integration with clear user creation instructions
-- =============================================

-- =============================================
-- STEP 1: VERIFY AUTH TRIGGER FUNCTION
-- =============================================

-- Recreate the trigger function to ensure it's working correctly
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_role_id uuid;
BEGIN
    -- Get the default 'admin' role ID for first user, 'user' role for others
    -- Check if there are any users in the public.users table
    IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
        -- First user gets super_admin role
        SELECT id INTO default_role_id FROM public.user_roles WHERE role_name = 'super_admin' LIMIT 1;
    ELSE
        -- Subsequent users get admin role by default (can be changed later)
        SELECT id INTO default_role_id FROM public.user_roles WHERE role_name = 'admin' LIMIT 1;
    END IF;
    
    -- If no role found, use the first available role
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id FROM public.user_roles LIMIT 1;
    END IF;
    
    -- Insert into public.users table
    INSERT INTO public.users (auth_id, email, full_name, role_id, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        default_role_id,
        true
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_id = EXCLUDED.auth_id,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- =============================================
-- STEP 2: ENSURE TRIGGER IS ACTIVE
-- =============================================

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- =============================================
-- STEP 3: VERIFICATION QUERIES
-- =============================================

-- Check if roles exist
DO $$
BEGIN
    RAISE NOTICE '=== ROLE VERIFICATION ===';
    RAISE NOTICE 'Roles available:';
END $$;

SELECT 
    role_name,
    display_name,
    id
FROM public.user_roles
ORDER BY role_name;

-- =============================================
-- STEP 4: DEMO USERS CREATION INSTRUCTIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DEMO USER CREATION INSTRUCTIONS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must create demo users manually in Supabase Dashboard';
    RAISE NOTICE '';
    RAISE NOTICE 'Follow these steps to create working demo credentials:';
    RAISE NOTICE '';
    RAISE NOTICE '--- STEP 1: Navigate to Supabase Dashboard ---';
    RAISE NOTICE '1. Go to your Supabase project dashboard';
    RAISE NOTICE '2. Click on "Authentication" in the left sidebar';
    RAISE NOTICE '3. Click on "Users" tab';
    RAISE NOTICE '';
    RAISE NOTICE '--- STEP 2: Create Super Admin User ---';
    RAISE NOTICE '1. Click "Add User" or "Invite User" button';
    RAISE NOTICE '2. Enter the following details:';
    RAISE NOTICE '   - Email: admin@crm.com';
    RAISE NOTICE '   - Password: Admin@123456';
    RAISE NOTICE '   - Auto Confirm User: YES (check this box)';
    RAISE NOTICE '3. Click "Create User"';
    RAISE NOTICE '';
    RAISE NOTICE '--- STEP 3: Create Manager User ---';
    RAISE NOTICE '1. Click "Add User" or "Invite User" button again';
    RAISE NOTICE '2. Enter the following details:';
    RAISE NOTICE '   - Email: manager@crm.com';
    RAISE NOTICE '   - Password: Manager@123456';
    RAISE NOTICE '   - Auto Confirm User: YES (check this box)';
    RAISE NOTICE '3. Click "Create User"';
    RAISE NOTICE '';
    RAISE NOTICE '--- STEP 4: Verify User Creation ---';
    RAISE NOTICE 'Run this query to verify users were created:';
    RAISE NOTICE '  SELECT email, full_name, role_name FROM public.users';
    RAISE NOTICE '  JOIN public.user_roles ON users.role_id = user_roles.id;';
    RAISE NOTICE '';
    RAISE NOTICE '--- STEP 5: Update User Roles (if needed) ---';
    RAISE NOTICE 'If manager needs different role, update it:';
    RAISE NOTICE '  UPDATE public.users SET role_id = (';
    RAISE NOTICE '    SELECT id FROM public.user_roles WHERE role_name = ''admin''';
    RAISE NOTICE '  ) WHERE email = ''manager@crm.com'';';
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TROUBLESHOOTING';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'If login fails after creating users:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Check if users exist in auth.users:';
    RAISE NOTICE '   SELECT email, confirmed_at FROM auth.users;';
    RAISE NOTICE '';
    RAISE NOTICE '2. Check if users exist in public.users:';
    RAISE NOTICE '   SELECT email, full_name, is_active FROM public.users;';
    RAISE NOTICE '';
    RAISE NOTICE '3. Check if trigger is working:';
    RAISE NOTICE '   SELECT * FROM pg_trigger WHERE tgname = ''on_auth_user_created'';';
    RAISE NOTICE '';
    RAISE NOTICE '4. Verify RLS policies are not blocking:';
    RAISE NOTICE '   SELECT * FROM pg_policies WHERE tablename = ''users'';';
    RAISE NOTICE '';
    RAISE NOTICE '5. Check for any auth errors in logs:';
    RAISE NOTICE '   Go to Supabase Dashboard > Logs > Auth logs';
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 5: ENABLE RLS BUT ALLOW AUTH OPERATIONS
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users manageable by admins" ON public.users;

-- Create new comprehensive RLS policies
-- Policy 1: Allow authenticated users to view all users
CREATE POLICY "Users viewable by authenticated users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

-- Policy 3: Allow admins to manage all users
CREATE POLICY "Users manageable by admins"
    ON public.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            JOIN public.user_roles r ON u.role_id = r.id
            WHERE u.auth_id = auth.uid()
            AND r.role_name IN ('super_admin', 'admin')
        )
    );

-- Policy 4: Allow service role to insert users (for trigger)
CREATE POLICY "Service role can insert users"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- =============================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.user_roles TO postgres;

-- =============================================
-- VERIFICATION COMPLETE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create demo users in Supabase Dashboard (see instructions above)';
    RAISE NOTICE '2. Test login with: admin@crm.com / Admin@123456';
    RAISE NOTICE '3. Test login with: manager@crm.com / Manager@123456';
    RAISE NOTICE '';
    RAISE NOTICE 'If you encounter any issues, check the troubleshooting section above.';
    RAISE NOTICE '';
END $$;