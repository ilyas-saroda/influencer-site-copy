-- ============================================================
-- FIX FULL_NAME COLUMN MISMATCH ERROR
-- Resolves "Could not find the 'fullName' column of 'users' in the schema cache"
-- ============================================================

-- 1. DIAGNOSTIC: Check current column names in users table
-- ============================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('full_name', 'fullName', 'email', 'role_id', 'is_active', 'auth_id')
ORDER BY ordinal_position;

-- 2. FIX COLUMN NAME: Rename fullName to full_name if it exists
-- ============================================================
DO $$
BEGIN
    -- Check if fullName column exists and rename it to full_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'fullName' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '🔄 Renaming fullName column to full_name...';
        
        -- Rename the column from camelCase to snake_case
        ALTER TABLE users RENAME COLUMN "fullName" TO full_name;
        
        RAISE NOTICE '✅ Successfully renamed fullName to full_name';
    ELSE
        RAISE NOTICE 'ℹ️ fullName column does not exist, checking if full_name already exists...';
        
        -- Check if full_name already exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'full_name' 
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE '✅ full_name column already exists';
        ELSE
            RAISE NOTICE '❌ Neither fullName nor full_name exist - will add full_name column';
        END IF;
    END IF;
END $$;

-- 3. ENSURE ALL REQUIRED COLUMNS EXIST WITH CORRECT NAMES
-- ============================================================

-- Add full_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'full_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
        RAISE NOTICE '✅ Added full_name column to users table';
    END IF;
END $$;

-- Add auth_id column if it doesn't exist (for Supabase auth integration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auth_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added auth_id column to users table';
    END IF;
END $$;

-- Ensure other required columns exist
DO $$
BEGIN
    -- email column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT NOT NULL UNIQUE;
        RAISE NOTICE '✅ Added email column to users table';
    END IF;
    
    -- role_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added role_id column to users table';
    END IF;
    
    -- is_active column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added is_active column to users table';
    END IF;
    
    -- last_login column (for status tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
        RAISE NOTICE '✅ Added last_login column to users table';
    END IF;
END $$;

-- 4. UPDATE EXISTING DATA: Migrate any existing fullName data to full_name
-- ============================================================
DO $$
BEGIN
    -- Check if there's any data to migrate (this handles edge cases)
    -- This is a safety measure in case both columns existed temporarily
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'full_name' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'fullName' 
        AND table_schema = 'public'
    ) THEN
        -- Migrate data from fullName to full_name where full_name is null
        UPDATE users 
        SET full_name = "fullName" 
        WHERE full_name IS NULL AND "fullName" IS NOT NULL;
        
        RAISE NOTICE '✅ Migrated data from fullName to full_name';
    END IF;
END $$;

-- 5. CREATE/UPDATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 6. REFRESH SCHEMA CACHE (Supabase specific)
-- ============================================================
-- This forces Supabase to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- 7. VERIFY THE FIXES
-- ============================================================

-- Show final users table structure
SELECT 
    'Final users table structure' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple query to ensure the column is accessible
SELECT 
    'Test query - should work without errors' as test_result,
    COUNT(*) as user_count,
    COUNT(full_name) as users_with_full_name
FROM users;

-- Show sample data to verify the fix
SELECT 
    'Sample user data' as info,
    id,
    email,
    full_name,
    is_active,
    role_id,
    auth_id,
    last_login
FROM users 
LIMIT 3;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Full Name Column Fix Completed Successfully!';
    RAISE NOTICE '📊 Renamed fullName to full_name (if it existed)';
    RAISE NOTICE '🔧 Ensured all required columns exist with correct names';
    RAISE NOTICE '⚡ Created performance indexes';
    RAISE NOTICE '🔄 Refreshed Supabase schema cache';
    RAISE NOTICE '✅ Frontend should now be able to access full_name column';
END $$;
