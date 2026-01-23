-- ============================================================
-- INFLUENCER CRM COMPLETE DATABASE SETUP SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor to recreate all tables
-- This script creates all required tables with proper relationships and RLS policies

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

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role_id UUID REFERENCES user_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE CREATORS TABLE (Influencers)
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    instagram_handle TEXT,
    youtube_channel TEXT,
    twitter_handle TEXT,
    linkedin_url TEXT,
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    niche TEXT,
    state TEXT,
    city TEXT,
    country TEXT DEFAULT 'India',
    bio TEXT,
    profile_image_url TEXT,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE BRANDS TABLE
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
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE CONTACTS TABLE
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    designation TEXT,
    contact_type TEXT DEFAULT 'primary',
    linkedin_url TEXT,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE CAMPAIGNS TABLE
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning',
    payment_status TEXT DEFAULT 'pending',
    budget NUMERIC(15,2),
    actual_spend NUMERIC(15,2) DEFAULT 0.00,
    objectives TEXT,
    target_audience TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. CREATE AUDIT_LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREATE JUNCTION TABLES (Many-to-Many Relationships)
-- Brand-Campaigns relationship
CREATE TABLE brand_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, campaign_id)
);

-- Campaign-Creators relationship
CREATE TABLE campaign_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    deliverables JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    UNIQUE(campaign_id, creator_id)
);

-- 9. INSERT SEED DATA FOR USER ROLES
INSERT INTO user_roles (name, description, permissions) VALUES
('admin', 'System Administrator with full access', '{"can_manage_users": true, "can_manage_brands": true, "can_manage_campaigns": true, "can_manage_creators": true, "can_view_reports": true, "can_manage_settings": true}'),
('manager', 'Campaign Manager with limited access', '{"can_manage_brands": true, "can_manage_campaigns": true, "can_view_reports": true, "can_manage_creators": true}'),
('analyst', 'Data Analyst with read-only access', '{"can_view_reports": true, "can_view_campaigns": true, "can_view_creators": true}'),
('brand_user', 'Brand Representative with limited access', '{"can_manage_own_brands": true, "can_view_own_campaigns": true, "can_view_reports": true}'),
('viewer', 'Read-only viewer', '{"can_view_data": true, "can_view_campaigns": true, "can_view_creators": true}');

-- 10. INSERT DEFAULT ADMIN USER
INSERT INTO users (email, full_name, role_id, is_active)
SELECT 'admin@influencercrm.com', 'System Administrator', id, true
FROM user_roles 
WHERE name = 'admin';

-- 11. INSERT SAMPLE MANAGER USER
INSERT INTO users (email, full_name, role_id, is_active)
SELECT 'manager@influencercrm.com', 'Campaign Manager', id, true
FROM user_roles 
WHERE name = 'manager';

-- 12. INSERT SAMPLE CREATORS (Influencers)
INSERT INTO creators (name, email, instagram_handle, followers_count, engagement_rate, niche, state, city, status) VALUES
('Priya Sharma', 'priya@example.com', '@priyalifestyle', 150000, 4.5, 'Fashion & Beauty', 'Maharashtra', 'Mumbai', 'active'),
('Rahul Verma', 'rahul@example.com', '@rahultech', 75000, 3.8, 'Technology', 'Karnataka', 'Bangalore', 'active'),
('Anjali Patel', 'anjali@example.com', '@anjalifood', 200000, 5.2, 'Food & Lifestyle', 'Gujarat', 'Ahmedabad', 'active'),
('Amit Kumar', 'amit@example.com', '@amitfitness', 120000, 4.1, 'Fitness & Health', 'Delhi', 'New Delhi', 'active');

-- 13. INSERT SAMPLE BRANDS
INSERT INTO brands (name, category, website, description, industry, headquarters) VALUES
('TechCorp Solutions', 'Technology', 'https://techcorp.com', 'Leading technology solutions provider', 'Technology', 'Bangalore'),
('Fashion Hub', 'Fashion', 'https://fashionhub.com', 'Premium fashion and lifestyle brand', 'Fashion', 'Mumbai'),
('Food Paradise', 'Food & Beverage', 'https://foodparadise.com', 'Organic food products company', 'Food & Beverage', 'Ahmedabad');

-- 14. INSERT SAMPLE CONTACTS
INSERT INTO contacts (brand_id, full_name, email, phone, designation, is_primary) 
SELECT b.id, 'Marketing Manager', 'marketing@' || LOWER(REPLACE(b.name, ' ', '')) || '.com', '+91-9876543210', 'Marketing Manager', true
FROM brands b;

-- 15. INSERT SAMPLE CAMPAIGNS
INSERT INTO campaigns (name, description, status, start_date, end_date, budget) VALUES
('Summer Fashion Campaign 2024', 'Fashion influencer campaign for summer collection', 'planning', '2024-06-01', '2024-08-31', 75000.00),
('Tech Product Launch', 'New tech product launch with tech influencers', 'active', '2024-04-01', '2024-05-30', 50000.00),
('Food Festival Promotion', 'Food festival promotion with food influencers', 'completed', '2024-03-01', '2024-03-31', 30000.00);

-- 16. CREATE PERFORMANCE INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_user_roles_name ON user_roles(name);
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_state ON creators(state);
CREATE INDEX idx_creators_city ON creators(city);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_brands_created_by ON brands(created_by);
CREATE INDEX idx_contacts_brand_id ON contacts(brand_id);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_brand_campaigns_brand_id ON brand_campaigns(brand_id);
CREATE INDEX idx_brand_campaigns_campaign_id ON brand_campaigns(campaign_id);
CREATE INDEX idx_campaign_creators_campaign_id ON campaign_creators(campaign_id);
CREATE INDEX idx_campaign_creators_creator_id ON campaign_creators(creator_id);

-- 17. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

-- 18. CREATE RLS POLICIES

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

-- Junction Tables Policies
CREATE POLICY "public_can_read_brand_campaigns" ON brand_campaigns
    FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_manage_brand_campaigns" ON brand_campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_can_read_campaign_creators" ON campaign_creators
    FOR SELECT TO public USING (true);

CREATE POLICY "authenticated_manage_campaign_creators" ON campaign_creators
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 19. CREATE TRIGGERS FOR UPDATED_AT COLUMNS
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

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 20. VERIFICATION QUERIES
SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM user_roles
UNION ALL
SELECT 'users', COUNT(*) FROM users
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

-- Completion Message
DO $$
BEGIN
    RAISE NOTICE '🎉 Influencer CRM Database Setup Completed Successfully!';
    RAISE NOTICE '📊 All tables created with proper relationships and RLS policies';
    RAISE NOTICE '👥 Default admin and manager users created';
    RAISE NOTICE '🎭 Sample creators, brands, and campaigns added for testing';
    RAISE NOTICE '🔒 Row Level Security enabled for all tables';
    RAISE NOTICE '⚡ Performance indexes created for optimal queries';
END $$;
