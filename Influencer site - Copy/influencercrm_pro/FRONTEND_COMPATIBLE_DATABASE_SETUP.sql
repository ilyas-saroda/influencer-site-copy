-- ============================================================
-- INFLUENCER CRM COMPLETE DATABASE SETUP SCRIPT
-- Based on Frontend Schema Analysis
-- ============================================================
-- Run this in Supabase SQL Editor to recreate all tables
-- This script matches exactly what frontend components expect

-- 0. CLEANUP EXISTING TABLES (Fresh Start)
DO $$
BEGIN
    -- Drop all tables in correct order to avoid foreign key conflicts
    DROP TABLE IF EXISTS campaign_creators CASCADE;
    DROP TABLE IF EXISTS brand_campaigns CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS contacts CASCADE;
    DROP TABLE IF EXISTS campaigns CASCADE;
    DROP TABLE IF EXISTS creators CASCADE;
    DROP TABLE IF EXISTS brands CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
    
    RAISE NOTICE '✅ Dropped all existing tables for fresh start';
END $$;

-- 1. CREATE USER_ROLES TABLE (First - referenced by users)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE USERS TABLE (Application users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE PROFILES TABLE (Supabase Auth Integration - Required by AuthContext)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- This will reference auth.users(id) via trigger
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL,
    bio TEXT,
    phone TEXT,
    website TEXT,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE CREATORS TABLE (Influencers - Based on frontend analysis)
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    instagram_handle TEXT,
    instagram_link TEXT,  -- For storing full Instagram URL
    youtube_channel TEXT,
    youtube_link TEXT,    -- For storing full YouTube URL
    twitter_handle TEXT,
    twitter_link TEXT,    -- For storing full Twitter URL
    linkedin_url TEXT,
    
    -- Performance metrics (used in frontend)
    followers_count INTEGER DEFAULT 0,
    followers_tier TEXT,  -- e.g., "10K-50K", "100K-1M"
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Location (used in frontend)
    state TEXT,
    city TEXT,
    country TEXT DEFAULT 'India',
    location JSONB, -- For structured location data
    
    -- Content and niche
    niche TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    bio TEXT,
    profile_image_url TEXT,
    
    -- Pricing and business
    pricing_tier JSONB DEFAULT '{}'::jsonb,
    base_price NUMERIC(10,2),
    price_history JSONB DEFAULT '[]'::jsonb,
    
    -- Status and management
    status TEXT DEFAULT 'active',
    sync_status TEXT DEFAULT 'pending', -- Used in frontend
    verification_status TEXT DEFAULT 'unverified',
    notes TEXT,
    
    -- Analytics and tracking
    last_sync_at TIMESTAMPTZ,
    manual_performance_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE BRANDS TABLE (Based on frontend analysis)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    website TEXT,
    logo_url TEXT,
    description TEXT,
    industry TEXT,
    headquarters TEXT,
    employee_count INTEGER,
    annual_revenue NUMERIC(15,2),
    social_media_links JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    brand_guidelines JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE CONTACTS TABLE (Brand contacts)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    designation TEXT,
    department TEXT,
    contact_type TEXT DEFAULT 'primary',
    linkedin_url TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    contact_preferences JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. CREATE CAMPAIGNS TABLE (Based on frontend analysis)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT DEFAULT 'standard',
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    -- Status and payment
    status TEXT DEFAULT 'planning', -- planning, active, completed, paused, cancelled
    payment_status TEXT DEFAULT 'pending', -- pending, partial, paid, overdue
    
    -- Financial
    budget NUMERIC(15,2),
    actual_spend NUMERIC(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    
    -- Campaign details
    objectives TEXT,
    target_audience TEXT,
    target_demographics JSONB DEFAULT '{}'::jsonb,
    deliverables JSONB DEFAULT '[]'::jsonb,
    creative_brief JSONB DEFAULT '{}'::jsonb,
    guidelines JSONB DEFAULT '{}'::jsonb,
    
    -- Metrics and tracking
    expected_reach INTEGER,
    actual_reach INTEGER DEFAULT 0,
    expected_engagement DECIMAL(5,2),
    actual_engagement DECIMAL(5,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Management
    priority TEXT DEFAULT 'medium',
    complexity TEXT DEFAULT 'medium',
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREATE AUDIT_LOGS TABLE (Based on frontend audit service analysis)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    
    -- Action details (matching frontend expectations)
    action_type TEXT NOT NULL, -- STATE_MAPPING_UPDATE, USER_ACTION, SYSTEM_EVENT
    table_name TEXT,
    record_id UUID,
    entity_type TEXT,
    entity_id UUID,
    
    -- Change tracking
    old_value TEXT,
    new_value TEXT,
    old_values JSONB, -- For complex changes
    new_values JSONB, -- For complex changes
    
    -- Session and transaction tracking
    session_id TEXT,
    transaction_id TEXT,
    
    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,
    
    -- Additional metadata (flexible for frontend needs)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. CREATE JUNCTION TABLES (Many-to-Many Relationships)

-- Brand-Campaigns relationship
CREATE TABLE brand_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'primary',
    contribution_percentage DECIMAL(5,2) DEFAULT 100.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, campaign_id)
);

-- Campaign-Creators relationship (Fixes frontend relationship error)
CREATE TABLE campaign_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    
    -- Assignment details
    status TEXT DEFAULT 'assigned', -- assigned, active, completed, cancelled
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Financial
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    fixed_amount NUMERIC(10,2),
    total_value NUMERIC(10,2),
    payment_status TEXT DEFAULT 'pending',
    paid_amount NUMERIC(10,2) DEFAULT 0.00,
    
    -- Deliverables
    deliverables JSONB DEFAULT '[]'::jsonb,
    completed_deliverables JSONB DEFAULT '[]'::jsonb,
    
    -- Performance
    actual_reach INTEGER DEFAULT 0,
    actual_engagement DECIMAL(5,2) DEFAULT 0.00,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(campaign_id, creator_id)
);

-- 10. INSERT SEED DATA FOR USER ROLES
INSERT INTO user_roles (name, description, permissions) VALUES
('admin', 'System Administrator with full access', '{"can_manage_users": true, "can_manage_brands": true, "can_manage_campaigns": true, "can_manage_creators": true, "can_view_reports": true, "can_manage_settings": true, "can_manage_system": true}'),
('manager', 'Campaign Manager with limited access', '{"can_manage_brands": true, "can_manage_campaigns": true, "can_view_reports": true, "can_manage_creators": true, "can_export_data": true}'),
('analyst', 'Data Analyst with read-only access', '{"can_view_reports": true, "can_view_campaigns": true, "can_view_creators": true, "can_export_data": true}'),
('brand_user', 'Brand Representative with limited access', '{"can_manage_own_brands": true, "can_view_own_campaigns": true, "can_view_reports": true, "can_manage_contacts": true}'),
('viewer', 'Read-only viewer', '{"can_view_data": true, "can_view_campaigns": true, "can_view_creators": true}');

-- 11. INSERT DEFAULT ADMIN USER
INSERT INTO users (email, full_name, role_id, is_active)
SELECT 'admin@influencercrm.com', 'System Administrator', id, true
FROM user_roles 
WHERE name = 'admin';

-- 12. INSERT SAMPLE MANAGER USER
INSERT INTO users (email, full_name, role_id, is_active)
SELECT 'manager@influencercrm.com', 'Campaign Manager', id, true
FROM user_roles 
WHERE name = 'manager';

-- 13. INSERT SAMPLE CREATORS (Influencers with frontend-compatible data)
INSERT INTO creators (
    name, email, instagram_handle, instagram_link, followers_count, followers_tier, 
    engagement_rate, performance_score, niche, state, city, status, sync_status
) VALUES
('Priya Sharma', 'priya@example.com', '@priyalifestyle', 'https://instagram.com/priyalifestyle', 150000, '100K-500K', 4.5, 85.5, 'Fashion & Beauty', 'Maharashtra', 'Mumbai', 'active', 'synced'),
('Rahul Verma', 'rahul@example.com', '@rahultech', 'https://instagram.com/rahultech', 75000, '50K-100K', 3.8, 72.3, 'Technology', 'Karnataka', 'Bangalore', 'active', 'synced'),
('Anjali Patel', 'anjali@example.com', '@anjalifood', 'https://instagram.com/anjalifood', 200000, '100K-500K', 5.2, 92.1, 'Food & Lifestyle', 'Gujarat', 'Ahmedabad', 'active', 'synced'),
('Amit Kumar', 'amit@example.com', '@amitfitness', 'https://instagram.com/amitfitness', 120000, '100K-500K', 4.1, 78.9, 'Fitness & Health', 'Delhi', 'New Delhi', 'active', 'synced');

-- 14. INSERT SAMPLE BRANDS
INSERT INTO brands (name, category, website, description, industry, headquarters) VALUES
('TechCorp Solutions', 'Technology', 'https://techcorp.com', 'Leading technology solutions provider', 'Technology', 'Bangalore'),
('Fashion Hub', 'Fashion', 'https://fashionhub.com', 'Premium fashion and lifestyle brand', 'Fashion', 'Mumbai'),
('Food Paradise', 'Food & Beverage', 'https://foodparadise.com', 'Organic food products company', 'Food & Beverage', 'Ahmedabad');

-- 15. INSERT SAMPLE CONTACTS
INSERT INTO contacts (brand_id, full_name, email, phone, designation, is_primary) 
SELECT b.id, 'Marketing Manager', 'marketing@' || LOWER(REPLACE(b.name, ' ', '')) || '.com', '+91-9876543210', 'Marketing Manager', true
FROM brands b;

-- 16. INSERT SAMPLE CAMPAIGNS
INSERT INTO campaigns (
    name, description, status, start_date, end_date, budget, 
    campaign_type, objectives, target_audience
) VALUES
('Summer Fashion Campaign 2024', 'Fashion influencer campaign for summer collection', 'active', '2024-06-01', '2024-08-31', 75000.00, 'influencer_campaign', 'Increase brand awareness and drive sales', 'Gen Z and Millennials'),
('Tech Product Launch', 'New tech product launch with tech influencers', 'active', '2024-04-01', '2024-05-30', 50000.00, 'product_launch', 'Generate buzz and reviews', 'Tech enthusiasts'),
('Food Festival Promotion', 'Food festival promotion with food influencers', 'completed', '2024-03-01', '2024-03-31', 30000.00, 'event_promotion', 'Drive event attendance', 'Food lovers');

-- 17. CREATE PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_user_roles_name ON user_roles(name);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_state ON creators(state);
CREATE INDEX idx_creators_city ON creators(city);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_sync_status ON creators(sync_status);
CREATE INDEX idx_creators_performance_score ON creators(performance_score);
CREATE INDEX idx_creators_followers_count ON creators(followers_count);
CREATE INDEX idx_brands_created_by ON brands(created_by);
CREATE INDEX idx_contacts_brand_id ON contacts(brand_id);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX idx_brand_campaigns_brand_id ON brand_campaigns(brand_id);
CREATE INDEX idx_brand_campaigns_campaign_id ON brand_campaigns(campaign_id);
CREATE INDEX idx_campaign_creators_campaign_id ON campaign_creators(campaign_id);
CREATE INDEX idx_campaign_creators_creator_id ON campaign_creators(creator_id);

-- 18. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

-- 19. CREATE RLS POLICIES

-- User Roles Policies
CREATE POLICY "public_can_read_user_roles" ON user_roles
    FOR SELECT TO public USING (true);

-- Users Policies
CREATE POLICY "authenticated_can_read_users" ON users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_manage_own_profile" ON users
    FOR ALL TO authenticated 
    USING (id = auth.uid()) 
    WITH CHECK (id = auth.uid());

-- Profiles Policies (Auth integration)
CREATE POLICY "users_can_view_own_profile" ON profiles
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON profiles
    FOR UPDATE TO authenticated 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "service_role_can_insert_profiles" ON profiles
    FOR INSERT TO service_role 
    WITH CHECK (true);

-- Creators Policies
CREATE POLICY "public_can_read_creators" ON creators
    FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_manage_creators" ON creators
    FOR ALL TO authenticated 
    USING (created_by = auth.uid()) 
    WITH CHECK (created_by = auth.uid());

-- Brands Policies
CREATE POLICY "public_can_read_brands" ON brands
    FOR SELECT TO public USING (true);

CREATE POLICY "users_manage_own_brands" ON brands
    FOR ALL TO authenticated 
    USING (created_by = auth.uid()) 
    WITH CHECK (created_by = auth.uid());

-- Contacts Policies
CREATE POLICY "public_can_read_contacts" ON contacts
    FOR SELECT TO public USING (true);

CREATE POLICY "users_manage_own_contacts" ON contacts
    FOR ALL TO authenticated 
    USING (created_by = auth.uid()) 
    WITH CHECK (created_by = auth.uid());

-- Campaigns Policies
CREATE POLICY "public_can_read_campaigns" ON campaigns
    FOR SELECT TO public USING (true);

CREATE POLICY "users_manage_own_campaigns" ON campaigns
    FOR ALL TO authenticated 
    USING (created_by = auth.uid()) 
    WITH CHECK (created_by = auth.uid());

-- Audit Logs Policies
CREATE POLICY "authenticated_can_read_audit_logs" ON audit_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_create_own_audit_logs" ON audit_logs
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_role_can_manage_audit_logs" ON audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Junction Tables Policies
CREATE POLICY "public_can_read_brand_campaigns" ON brand_campaigns
    FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_manage_brand_campaigns" ON brand_campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_can_read_campaign_creators" ON campaign_creators
    FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_manage_campaign_creators" ON campaign_creators
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 20. CREATE TRIGGERS FOR UPDATED_AT COLUMNS
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 21. CREATE AUTH TRIGGER FOR AUTOMATIC PROFILE CREATION
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new auth user
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Also create entry in users table if needed
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (email) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 22. CREATE AUDIT TRIGGER FUNCTION
-- Function to log changes automatically
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if this is not an audit operation itself
    IF TG_TABLE_NAME != 'audit_logs' THEN
        INSERT INTO audit_logs (
            user_id,
            user_email,
            action_type,
            table_name,
            record_id,
            old_values,
            new_values,
            session_id
        ) VALUES (
            COALESCE(auth.uid(), NULL),
            COALESCE(current_setting('app.current_user_email', true), NULL),
            CASE TG_OP
                WHEN 'INSERT' THEN 'RECORD_CREATED'
                WHEN 'UPDATE' THEN 'RECORD_UPDATED'
                WHEN 'DELETE' THEN 'RECORD_DELETED'
            END,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
            COALESCE(current_setting('app.session_id', true), NULL)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_creators_trigger
    AFTER INSERT OR UPDATE OR DELETE ON creators
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_brands_trigger
    AFTER INSERT OR UPDATE OR DELETE ON brands
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 23. VERIFICATION QUERIES
SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM user_roles
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'creators', COUNT(*) FROM creators
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'brand_campaigns', COUNT(*) FROM brand_campaigns
UNION ALL
SELECT 'campaign_creators', COUNT(*) FROM campaign_creators;

-- 24. SAMPLE AUDIT LOGS FOR TESTING
INSERT INTO audit_logs (
    user_id, user_email, action_type, table_name, record_id, 
    old_value, new_value, metadata
) VALUES
(
    (SELECT id FROM users WHERE email = 'admin@influencercrm.com' LIMIT 1),
    'admin@influencercrm.com',
    'SYSTEM_EVENT',
    'system_events',
    NULL,
    NULL,
    'Database setup completed',
    '{"event": "database_initialization", "tables_created": 10}'
);

-- Completion Message
DO $$
BEGIN
    RAISE NOTICE '🎉 Influencer CRM Database Setup Completed Successfully!';
    RAISE NOTICE '📊 All tables created with proper relationships and RLS policies';
    RAISE NOTICE '👥 Default admin and manager users created';
    RAISE NOTICE '🎭 Sample creators, brands, and campaigns added for testing';
    RAISE NOTICE '🔒 Row Level Security enabled for all tables';
    RAISE NOTICE '⚡ Performance indexes created for optimal queries';
    RAISE NOTICE '🔐 Auth trigger created for automatic profile creation';
    RAISE NOTICE '📝 Audit logging system activated';
    RAISE NOTICE '🔗 Campaign-Creators relationship established (fixes frontend error)';
END $$;
