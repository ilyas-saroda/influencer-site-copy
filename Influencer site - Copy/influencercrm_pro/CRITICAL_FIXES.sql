-- ============================================================
-- CRITICAL FIXES SCRIPT
-- ============================================================
-- Run this AFTER COMPREHENSIVE_DATABASE_FIX_COMPLETE.sql
-- This script addresses remaining critical issues

-- 1. FIX USERS-USER_ROLES RELATIONSHIP
DO $$
BEGIN
    -- Ensure users table has proper role_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id' AND table_schema = 'public') THEN
            ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id);
        END IF;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
    END IF;
END $$;

-- 2. CREATE CAMPAIGN_CREATORS JUNCTION TABLE
DO $$
BEGIN
    -- Create junction table for campaign-creator many-to-many relationship
    CREATE TABLE IF NOT EXISTS campaign_creators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(campaign_id, creator_id)
    );
    
    -- Enable RLS
    ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Allow authenticated users to read campaign_creators" ON campaign_creators
        FOR SELECT USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Allow authenticated users to insert campaign_creators" ON campaign_creators
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Allow authenticated users to update campaign_creators" ON campaign_creators
        FOR UPDATE USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Allow authenticated users to delete campaign_creators" ON campaign_creators
        FOR DELETE USING (auth.role() = 'authenticated');
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign_id ON campaign_creators(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator_id ON campaign_creators(creator_id);
    
    -- Add trigger for updated_at
    CREATE TRIGGER update_campaign_creators_updated_at
        BEFORE UPDATE ON campaign_creators
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 3. ADD SAMPLE DATA FOR TESTING
DO $$
BEGIN
    -- Insert sample brands if table is empty
    IF (SELECT COUNT(*) FROM brands) = 0 THEN
        INSERT INTO brands (name, category, website, industry, headquarters, employee_count, annual_revenue) VALUES
        ('TechCorp Solutions', 'technology', 'https://techcorp.com', 'Software', 'San Francisco, CA', 500, 50000000),
        ('Fashion Forward', 'fashion', 'https://fashionforward.com', 'Apparel', 'New York, NY', 200, 25000000),
        ('HealthPlus', 'healthcare', 'https://healthplus.com', 'Healthcare', 'Boston, MA', 1000, 100000000);
    END IF;
    
    -- Insert sample contacts if table is empty
    IF (SELECT COUNT(*) FROM contacts) = 0 THEN
        INSERT INTO contacts (brand_id, first_name, last_name, email, phone, position, department) VALUES
        ((SELECT id FROM brands LIMIT 1), 'John', 'Smith', 'john.smith@techcorp.com', '+1-555-0101', 'Marketing Director', 'Marketing'),
        ((SELECT id FROM brands LIMIT 1), 'Sarah', 'Johnson', 'sarah.johnson@techcorp.com', '+1-555-0102', 'Brand Manager', 'Marketing'),
        ((SELECT id FROM brands OFFSET 1 LIMIT 1), 'Emily', 'Davis', 'emily.davis@fashionforward.com', '+1-555-0103', 'CEO', 'Executive'),
        ((SELECT id FROM brands OFFSET 1 LIMIT 1), 'Michael', 'Wilson', 'michael.wilson@fashionforward.com', '+1-555-0104', 'Creative Director', 'Creative'),
        ((SELECT id FROM brands OFFSET 2 LIMIT 1), 'David', 'Brown', 'david.brown@healthplus.com', '+1-555-0105', 'CMO', 'Marketing'),
        ((SELECT id FROM brands OFFSET 2 LIMIT 1), 'Lisa', 'Anderson', 'lisa.anderson@healthplus.com', '+1-555-0106', 'Product Manager', 'Product');
    END IF;
    
    -- Insert sample campaigns if table is empty
    IF (SELECT COUNT(*) FROM campaigns) = 0 THEN
        INSERT INTO campaigns (name, description, status, start_date, end_date, budget, brand_id) VALUES
        ('Summer Tech Launch', 'Launch campaign for new tech product', 'planning', '2024-06-01', '2024-08-31', 100000, (SELECT id FROM brands LIMIT 1)),
        ('Fall Fashion Collection', 'Promote new fall fashion line', 'active', '2024-09-01', '2024-11-30', 75000, (SELECT id FROM brands OFFSET 1 LIMIT 1)),
        ('Health Awareness Campaign', 'Educational campaign about health benefits', 'completed', '2024-01-01', '2024-03-31', 50000, (SELECT id FROM brands OFFSET 2 LIMIT 1));
    END IF;
    
    -- Insert sample admin user if table is empty
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        INSERT INTO users (email, full_name, role_id, is_active, created_at, updated_at) VALUES
        ('admin@influencercrm.com', 'System Administrator', (SELECT id FROM user_roles WHERE name = 'admin' LIMIT 1), true, NOW(), NOW());
    END IF;
    
    -- Link campaigns to creators (sample relationships)
    IF (SELECT COUNT(*) FROM campaign_creators) = 0 THEN
        INSERT INTO campaign_creators (campaign_id, creator_id)
        SELECT c.id, cr.id 
        FROM campaigns c, creators cr 
        WHERE c.id = (SELECT id FROM campaigns LIMIT 1) 
        AND cr.id IN (SELECT id FROM creators LIMIT 5)
        LIMIT 3;
    END IF;
END $$;

-- 4. ADD PUBLIC SYSTEM SETTINGS
DO $$
BEGIN
    -- Insert public system settings if table is empty
    IF (SELECT COUNT(*) FROM system_settings) = 0 THEN
        INSERT INTO system_settings (key, value, description, is_public) VALUES
        ('app_name', 'InfluencerCRM Pro', 'Application name', true),
        ('app_version', '1.0.0', 'Current application version', true),
        ('max_file_upload_size', '10485760', 'Maximum file upload size in bytes', true),
        ('default_campaign_duration', '90', 'Default campaign duration in days', true),
        ('auto_save_interval', '30', 'Auto-save interval in seconds', true),
        ('maintenance_mode', 'false', 'Whether the application is in maintenance mode', true),
        ('support_email', 'support@influencercrm.com', 'Customer support email', true),
        ('timezone', 'UTC', 'Default timezone for the application', true);
    END IF;
END $$;

-- 5. FIX BROKEN TABLES (cities, states, export_logs)
DO $$
BEGIN
    -- Fix cities table if it exists but is broken
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cities' AND table_schema = 'public') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE cities ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'name' AND table_schema = 'public') THEN
            ALTER TABLE cities ADD COLUMN name TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'state_id' AND table_schema = 'public') THEN
            ALTER TABLE cities ADD COLUMN state_id UUID REFERENCES states(id);
        END IF;
        
        -- Enable RLS
        ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
        
        -- Add basic RLS policies
        CREATE POLICY "Allow authenticated users to read cities" ON cities
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Fix states table if it exists but is broken
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'states' AND table_schema = 'public') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE states ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'name' AND table_schema = 'public') THEN
            ALTER TABLE states ADD COLUMN name TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'states' AND column_name = 'code' AND table_schema = 'public') THEN
            ALTER TABLE states ADD COLUMN code TEXT(2) NOT NULL;
        END IF;
        
        -- Enable RLS
        ALTER TABLE states ENABLE ROW LEVEL SECURITY;
        
        -- Add basic RLS policies
        CREATE POLICY "Allow authenticated users to read states" ON states
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Fix export_logs table if it exists but is broken
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'export_logs' AND table_schema = 'public') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'id' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN user_id UUID REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'export_type' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN export_type TEXT NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'file_path' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN file_path TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'status' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'export_logs' AND column_name = 'created_at' AND table_schema = 'public') THEN
            ALTER TABLE export_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Enable RLS
        ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
        
        -- Add basic RLS policies
        CREATE POLICY "Allow authenticated users to read own export_logs" ON export_logs
            FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());
            
        CREATE POLICY "Allow authenticated users to insert export_logs" ON export_logs
            FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
    END IF;
END $$;

-- 6. CREATE MISSING FUNCTION FOR UPDATED_AT TRIGGER
DO $$
BEGIN
    -- Create function for updating updated_at columns if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
END $$;

-- ============================================================
-- CRITICAL FIXES COMPLETED
-- ============================================================
