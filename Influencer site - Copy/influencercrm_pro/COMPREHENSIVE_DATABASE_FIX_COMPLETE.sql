-- ============================================================
-- COMPREHENSIVE DATABASE FIX SCRIPT (COMPLETE VERSION)
-- ============================================================
-- Run this in Supabase SQL Editor
-- This script fixes all broken tables and ensures frontend compatibility

-- 0. DELETE AND RECREATE USERS AND USER_ROLES TABLES
DO $$
BEGIN
    -- Drop existing tables to start fresh
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    
    RAISE NOTICE '✅ Deleted existing users and user_roles tables';
END $$;

-- 1. CREATE USER_ROLES TABLE (must be created first for foreign key reference)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE USERS TABLE with proper role_id relationship
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INSERT DEFAULT USER ROLES
INSERT INTO user_roles (name, description, permissions) VALUES
('admin', 'System Administrator with full access', '{"can_manage_users": true, "can_manage_brands": true, "can_manage_campaigns": true, "can_manage_creators": true, "can_view_reports": true}'),
('manager', 'Campaign Manager with limited access', '{"can_manage_brands": true, "can_manage_campaigns": true, "can_view_reports": true}'),
('analyst', 'Data Analyst with read-only access', '{"can_view_reports": true}'),
('brand_user', 'Brand Representative with limited access', '{"can_manage_own_brands": true, "can_view_own_campaigns": true}'),
('viewer', 'Read-only viewer', '{"can_view_data": true}')
ON CONFLICT (name) DO NOTHING;

-- 4. INSERT DEFAULT ADMIN USER
INSERT INTO users (email, full_name, role_id, is_active)
SELECT 'admin@influencercrm.com', 'System Administrator', id, true
FROM user_roles 
WHERE name = 'admin'
ON CONFLICT (email) DO NOTHING;

RAISE NOTICE '✅ Recreated users and user_roles tables with proper relationship';

-- 5. FIX BRANDS TABLE (if exists but empty)
DO $$
BEGIN
    -- Check if brands table exists and has no data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brands' AND table_schema = 'public') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'name' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN name TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'category' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN category TEXT DEFAULT 'other';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'website' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN website TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'logo_url' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN logo_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'description' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN description TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'industry' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN industry TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'headquarters' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN headquarters TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'employee_count' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN employee_count INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'annual_revenue' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN annual_revenue NUMERIC(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'social_media_links' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN social_media_links JSONB DEFAULT '{}'::jsonb;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'notes' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'created_by' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'created_at' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'updated_at' AND table_schema = 'public') THEN
            ALTER TABLE brands ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        RAISE NOTICE '✅ Brands table structure verified/fixed';
    END IF;
END $$;

-- 6. FIX CONTACTS TABLE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts' AND table_schema = 'public') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'brand_id' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'full_name' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN full_name TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'email' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN email TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN phone TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'whatsapp' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN whatsapp TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'designation' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN designation TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'contact_type' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN contact_type TEXT DEFAULT 'primary';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN linkedin_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'is_primary' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN is_primary BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_by' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_at' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'updated_at' AND table_schema = 'public') THEN
            ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        RAISE NOTICE '✅ Contacts table structure verified/fixed';
    END IF;
END $$;

-- 7. FIX CAMPAIGNS TABLE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns' AND table_schema = 'public') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'name' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN name TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'description' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN description TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'start_date' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN start_date DATE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'end_date' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN end_date DATE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'planning';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'payment_status' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN payment_status TEXT DEFAULT 'pending';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'budget' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN budget NUMERIC(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'created_by' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'created_at' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'updated_at' AND table_schema = 'public') THEN
            ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        RAISE NOTICE '✅ Campaigns table structure verified/fixed';
    END IF;
END $$;

-- 8. FIX AUDIT_LOGS TABLE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN action TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_type' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN entity_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'old_values' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN old_values JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'new_values' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN new_values JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at' AND table_schema = 'public') THEN
            ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        RAISE NOTICE '✅ Audit_logs table structure verified/fixed';
    END IF;
END $$;

-- 9. CREATE JUNCTION TABLES IF MISSING
DO $$
BEGIN
    -- brand_campaigns junction table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_campaigns' AND table_schema = 'public') THEN
        CREATE TABLE brand_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(brand_id, campaign_id)
        );
        RAISE NOTICE '✅ Created brand_campaigns table';
    END IF;
    
    -- campaign_creators junction table (many-to-many)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_creators' AND table_schema = 'public') THEN
        CREATE TABLE campaign_creators (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
            creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'assigned',
            assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(campaign_id, creator_id)
        );
        RAISE NOTICE '✅ Created campaign_creators table';
    END IF;
END $$;

-- 10. CREATE INDEXES FOR PERFORMANCE
DO $$
BEGIN
    -- Brands indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brands_created_by') THEN
        CREATE INDEX idx_brands_created_by ON brands(created_by);
    END IF;
    
    -- Contacts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_brand_id') THEN
        CREATE INDEX idx_contacts_brand_id ON contacts(brand_id);
    END IF;
    
    -- Campaigns indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaigns_created_by') THEN
        CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
    END IF;
    
    -- Users indexes (CRITICAL for user-role relationship)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role_id') THEN
        CREATE INDEX idx_users_role_id ON users(role_id);
    END IF;
    
    -- User roles indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_name') THEN
        CREATE INDEX idx_user_roles_name ON user_roles(name);
    END IF;
    
    -- Audit logs indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_user_id') THEN
        CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_created_at') THEN
        CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    END IF;
    
    RAISE NOTICE '✅ Database indexes verified/created';
END $$;

-- 11. COMPREHENSIVE POLICY CLEANUP AND CREATION
DO $$
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE brand_campaigns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;
    
    -- Drop ALL existing policies to avoid conflicts
    -- Brands policies
    DROP POLICY IF EXISTS "public_can_read_brands" ON brands;
    DROP POLICY IF EXISTS "users_manage_own_brands" ON brands;
    DROP POLICY IF EXISTS "authenticated_can_read_brands" ON brands;
    DROP POLICY IF EXISTS "brands_insert_policy" ON brands;
    DROP POLICY IF EXISTS "brands_update_policy" ON brands;
    DROP POLICY IF EXISTS "brands_delete_policy" ON brands;
    
    -- Contacts policies
    DROP POLICY IF EXISTS "public_can_read_contacts" ON contacts;
    DROP POLICY IF EXISTS "users_manage_own_contacts" ON contacts;
    DROP POLICY IF EXISTS "authenticated_can_read_contacts" ON contacts;
    DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
    DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
    DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;
    
    -- Campaigns policies
    DROP POLICY IF EXISTS "public_can_read_campaigns" ON campaigns;
    DROP POLICY IF EXISTS "users_manage_own_campaigns" ON campaigns;
    DROP POLICY IF EXISTS "authenticated_can_read_campaigns" ON campaigns;
    DROP POLICY IF EXISTS "campaigns_insert_policy" ON campaigns;
    DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
    DROP POLICY IF EXISTS "campaigns_delete_policy" ON campaigns;
    
    -- Users policies
    DROP POLICY IF EXISTS "authenticated_can_read_users" ON users;
    DROP POLICY IF EXISTS "users_manage_own_profile" ON users;
    DROP POLICY IF EXISTS "public_can_read_users" ON users;
    DROP POLICY IF EXISTS "users_insert_policy" ON users;
    DROP POLICY IF EXISTS "users_update_policy" ON users;
    DROP POLICY IF EXISTS "users_delete_policy" ON users;
    
    -- User roles policies
    DROP POLICY IF EXISTS "authenticated_can_read_user_roles" ON user_roles;
    DROP POLICY IF EXISTS "public_can_read_user_roles" ON user_roles;
    DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
    DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
    DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;
    
    -- Audit logs policies
    DROP POLICY IF EXISTS "authenticated_can_read_audit_logs" ON audit_logs;
    DROP POLICY IF EXISTS "users_create_own_audit_logs" ON audit_logs;
    DROP POLICY IF EXISTS "public_can_read_audit_logs" ON audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
    
    -- Junction tables policies
    DROP POLICY IF EXISTS "public_can_read_brand_campaigns" ON brand_campaigns;
    DROP POLICY IF EXISTS "authenticated_manage_brand_campaigns" ON brand_campaigns;
    DROP POLICY IF EXISTS "brand_campaigns_insert_policy" ON brand_campaigns;
    DROP POLICY IF EXISTS "brand_campaigns_update_policy" ON brand_campaigns;
    
    DROP POLICY IF EXISTS "public_can_read_campaign_creators" ON campaign_creators;
    DROP POLICY IF EXISTS "authenticated_manage_campaign_creators" ON campaign_creators;
    DROP POLICY IF EXISTS "campaign_creators_insert_policy" ON campaign_creators;
    DROP POLICY IF EXISTS "campaign_creators_update_policy" ON campaign_creators;
    
    -- Brands policies
    CREATE POLICY "public_can_read_brands" ON brands
        FOR SELECT TO public USING (true);
    
    CREATE POLICY "users_manage_own_brands" ON brands
        FOR ALL TO authenticated 
        USING (created_by = auth.uid()) 
        WITH CHECK (created_by = auth.uid());
    
    -- Contacts policies
    CREATE POLICY "public_can_read_contacts" ON contacts
        FOR SELECT TO public USING (true);
    
    CREATE POLICY "users_manage_own_contacts" ON contacts
        FOR ALL TO authenticated 
        USING (created_by = auth.uid()) 
        WITH CHECK (created_by = auth.uid());
    
    -- Campaigns policies
    CREATE POLICY "public_can_read_campaigns" ON campaigns
        FOR SELECT TO public USING (true);
    
    CREATE POLICY "users_manage_own_campaigns" ON campaigns
        FOR ALL TO authenticated 
        USING (created_by = auth.uid()) 
        WITH CHECK (created_by = auth.uid());
    
    -- Users policies (only authenticated users can read)
    CREATE POLICY "authenticated_can_read_users" ON users
        FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "users_manage_own_profile" ON users
        FOR ALL TO authenticated 
        USING (id = auth.uid()) 
        WITH CHECK (id = auth.uid());
    
    -- User roles policies (public can read for frontend)
    CREATE POLICY "public_can_read_user_roles" ON user_roles
        FOR SELECT TO public USING (true);
    
    -- Audit logs policies (only authenticated users can read)
    CREATE POLICY "authenticated_can_read_audit_logs" ON audit_logs
        FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "users_create_own_audit_logs" ON audit_logs
        FOR INSERT TO authenticated 
        WITH CHECK (user_id = auth.uid());
    
    -- Junction tables policies
    CREATE POLICY "public_can_read_brand_campaigns" ON brand_campaigns
        FOR SELECT TO public USING (true);
    
    CREATE POLICY "authenticated_manage_brand_campaigns" ON brand_campaigns
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    CREATE POLICY "public_can_read_campaign_creators" ON campaign_creators
        FOR SELECT TO public USING (true);
    
    CREATE POLICY "authenticated_manage_campaign_creators" ON campaign_creators
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    RAISE NOTICE '✅ RLS policies created/updated';
END $$;

-- 12. CREATE TRIGGERS FOR UPDATED_AT
-- Brands trigger
DROP TRIGGER IF EXISTS trigger_brands_updated_at ON brands;
CREATE OR REPLACE FUNCTION update_brands_updated_at()
    RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_brands_updated_at();

-- Contacts trigger
DROP TRIGGER IF EXISTS trigger_contacts_updated_at ON contacts;
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
    RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Campaigns trigger
DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON campaigns;
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
    RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Users trigger
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- User roles trigger
DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON user_roles;
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
    RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- 13. INSERT SAMPLE DATA FOR TESTING
DO $$
BEGIN
    -- Insert sample brand if table is empty
    IF (SELECT COUNT(*) FROM brands) = 0 THEN
        INSERT INTO brands (name, category, website, description, industry, headquarters, employee_count)
        VALUES ('TechCorp', 'technology', 'https://techcorp.com', 'Leading technology company', 'Technology', 'San Francisco', 1000);
        RAISE NOTICE '✅ Inserted sample brand data';
    END IF;
    
    -- Insert sample contact if table is empty
    IF (SELECT COUNT(*) FROM contacts) = 0 THEN
        INSERT INTO contacts (brand_id, full_name, email, phone, designation, is_primary)
        SELECT id, 'John Doe', 'john@techcorp.com', '+1-555-0123', 'CEO', true
        FROM brands 
        WHERE name = 'TechCorp'
        LIMIT 1;
        RAISE NOTICE '✅ Inserted sample contact data';
    END IF;
    
    -- Insert sample campaign if table is empty
    IF (SELECT COUNT(*) FROM campaigns) = 0 THEN
        INSERT INTO campaigns (name, description, status, start_date, end_date, budget)
        VALUES ('Summer Launch 2024', 'Product launch campaign for summer collection', 'planning', '2024-06-01', '2024-08-31', 50000.00);
        RAISE NOTICE '✅ Inserted sample campaign data';
    END IF;
END $$;

-- 14. VERIFICATION QUERIES
SELECT 'brands' as table_name, COUNT(*) as record_count FROM brands
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'creators', COUNT(*) FROM creators;

-- Script completion message
DO $$
BEGIN
    RAISE NOTICE '🎉 Database fix completed successfully!';
    RAISE NOTICE '📊 All tables are now properly structured and ready for frontend use.';
    RAISE NOTICE '🔑 User-role relationship has been established!';
    RAISE NOTICE '🗑️  Old users and user_roles tables were deleted and recreated with proper structure.';
END $$;
