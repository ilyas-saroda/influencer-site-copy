-- ============================================================
-- FIX LEGACY USERS TABLE ISSUES
-- 1. Add missing last_login column to users table
-- 2. Update user_roles table with display_name column
-- 3. Ensure proper data types and indexes
-- ============================================================

-- 1. ADD MISSING LAST_LOGIN COLUMN
-- ============================================================

-- Check if last_login column exists, add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ last_login column missing from users table - adding it...';
        
        -- Add last_login column as timestamptz for proper status logic
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
        
        RAISE NOTICE '✅ last_login column added to users table';
    ELSE
        RAISE NOTICE '✅ last_login column exists in users table';
    END IF;
END $$;

-- 2. ENSURE USER_ROLES HAS DISPLAY_NAME COLUMN
-- ============================================================

-- Check if display_name column exists in user_roles, add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'display_name' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ display_name column missing from user_roles table - adding it...';
        
        -- Add display_name column
        ALTER TABLE user_roles 
        ADD COLUMN IF NOT EXISTS display_name TEXT;
        
        -- Update existing roles with proper display names
        UPDATE user_roles SET display_name = 'Super Admin' WHERE name = 'super_admin';
        UPDATE user_roles SET display_name = 'Administrator' WHERE name = 'admin';
        UPDATE user_roles SET display_name = 'Manager' WHERE name = 'manager';
        UPDATE user_roles SET display_name = 'Analyst' WHERE name = 'analyst';
        UPDATE user_roles SET display_name = 'Brand User' WHERE name = 'brand_user';
        UPDATE user_roles SET display_name = 'Viewer' WHERE name = 'viewer';
        
        RAISE NOTICE '✅ display_name column added to user_roles table';
    ELSE
        RAISE NOTICE '✅ display_name column exists in user_roles table';
    END IF;
END $$;

-- 3. UPDATE USER_ROLES WITH PROPER ROLE NAMES
-- ============================================================

-- Ensure we have the correct role names that the frontend expects
DO $$
BEGIN
    -- Update role names to match frontend expectations
    UPDATE user_roles SET 
        name = 'super_admin',
        display_name = 'Super Admin'
    WHERE display_name = 'System Administrator' OR name = 'admin';
    
    UPDATE user_roles SET 
        display_name = 'Administrator'
    WHERE name = 'admin' AND display_name IS NULL;
    
    RAISE NOTICE '✅ User roles updated to match frontend expectations';
END $$;

-- 4. ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================================

-- Check and add any missing columns to users table
DO $$
BEGIN
    -- full_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'full_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
        RAISE NOTICE '✅ Added full_name column to users table';
    END IF;
    
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
END $$;

-- 5. CREATE/UPDATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(name);

-- 6. INSERT/UPDATE SUPER ADMIN ROLE FOR ilyassaroda73@gmail.com
-- ============================================================

-- Ensure super_admin role exists
INSERT INTO user_roles (id, name, description, display_name, permissions)
VALUES (
    gen_random_uuid(),
    'super_admin',
    'Super Administrator with full system access',
    'Super Admin',
    '{"can_manage_users": true, "can_manage_brands": true, "can_manage_campaigns": true, "can_manage_creators": true, "can_view_reports": true, "can_manage_settings": true, "can_manage_system": true}'
) ON CONFLICT (name) DO UPDATE SET
    display_name = 'Super Admin',
    permissions = '{"can_manage_users": true, "can_manage_brands": true, "can_manage_campaigns": true, "can_manage_creators": true, "can_view_reports": true, "can_manage_settings": true, "can_manage_system": true}';

-- Update or insert the user ilyassaroda73@gmail.com with Super Admin role
INSERT INTO users (email, full_name, role_id, is_active, last_login)
SELECT 
    'ilyassaroda73@gmail.com',
    'Ilyass Aroda',
    ur.id,
    true,
    CURRENT_TIMESTAMP
FROM user_roles ur 
WHERE ur.name = 'super_admin'
ON CONFLICT (email) DO UPDATE SET
    role_id = (SELECT id FROM user_roles WHERE name = 'super_admin'),
    is_active = true,
    last_login = CURRENT_TIMESTAMP,
    full_name = 'Ilyass Aroda';

-- 7. VERIFY THE FIXES
-- ============================================================

-- Show current users table structure
SELECT 
    'users table columns' as table_info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current user_roles table structure  
SELECT 
    'user_roles table columns' as table_info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data to verify fixes
SELECT 
    u.email,
    u.full_name,
    u.is_active,
    u.last_login,
    ur.name as role_name,
    ur.display_name
FROM users u
LEFT JOIN user_roles ur ON u.role_id = ur.id
WHERE u.email = 'ilyassaroda73@gmail.com';

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Legacy Users Table Fix Completed Successfully!';
    RAISE NOTICE '📊 Added missing last_login column (timestamptz)';
    RAISE NOTICE '👥 Added display_name column to user_roles table';
    RAISE NOTICE '🔧 Updated role names to match frontend expectations';
    RAISE NOTICE '👤 Created/updated Super Admin user: ilyassaroda73@gmail.com';
    RAISE NOTICE '⚡ Created performance indexes';
    RAISE NOTICE '🔍 Frontend should now display users correctly';
END $$;
