-- Enhanced Row Level Security (RLS) Policies for Influencer CRM Pro
-- Implements role-based access control with proper data isolation
-- Optimized queries with JOIN operations instead of multiple calls

-- =====================================================
-- 1. ENABLE RLS ON ALL RELEVANT TABLES
-- =====================================================

-- Core tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id AND 
                     (old.role = new.role OR old.role IS NULL));

-- Admins and Super Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Super Admins can manage all profiles
CREATE POLICY "Super Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- =====================================================
-- 3. CREATORS TABLE POLICIES
-- =====================================================

-- All authenticated users can view creators (read-only access)
CREATE POLICY "Authenticated users can view creators" ON creators
    FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and Admins can create creators
CREATE POLICY "Managers can create creators" ON creators
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- Creators can be updated by their creator or admins
CREATE POLICY "Creators can be updated by owner or admins" ON creators
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only Super Admins can delete creators
CREATE POLICY "Only Super Admins can delete creators" ON creators
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- =====================================================
-- 4. CAMPAIGNS TABLE POLICIES
-- =====================================================

-- Users can view campaigns they're involved in or all campaigns if they have permission
CREATE POLICY "Users can view relevant campaigns" ON campaigns
    FOR SELECT USING (
        -- Campaign creator can view
        created_by = auth.uid() OR
        -- Assigned creators can view
        id IN (
            SELECT campaign_id FROM campaign_creators 
            WHERE creator_id = auth.uid()
        ) OR
        -- Admins and managers can view all
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- Managers and Admins can create campaigns
CREATE POLICY "Managers can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- Campaign updates restricted to creators and admins
CREATE POLICY "Campaign updates restricted" ON campaigns
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 5. BRANDS TABLE POLICIES
-- =====================================================

-- All authenticated users can view brands
CREATE POLICY "Authenticated users can view brands" ON brands
    FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and Admins can create brands
CREATE POLICY "Managers can create brands" ON brands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- Brand updates restricted to creators and admins
CREATE POLICY "Brand updates restricted" ON brands
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 6. PAYMENTS TABLE POLICIES
-- =====================================================

-- Users can view payments related to them or all if admin
CREATE POLICY "Users can view relevant payments" ON payments
    FOR SELECT USING (
        -- Payment creator can view
        creator_id = auth.uid() OR
        -- Campaign manager can view
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        ) OR
        -- Admins and managers can view all
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- Managers and Admins can create payments
CREATE POLICY "Managers can create payments" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- =====================================================
-- 7. DELIVERABLES TABLE POLICIES
-- =====================================================

-- Users can view deliverables related to them
CREATE POLICY "Users can view relevant deliverables" ON deliverables
    FOR SELECT USING (
        -- Assigned creator can view
        creator_id = auth.uid() OR
        -- Campaign manager can view
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        ) OR
        -- Admins can view all
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 8. ANALYTICS TABLE POLICIES
-- =====================================================

-- Users can view analytics related to their content
CREATE POLICY "Users can view relevant analytics" ON analytics
    FOR SELECT USING (
        -- Creator can view their analytics
        creator_id = auth.uid() OR
        -- Campaign manager can view campaign analytics
        (campaign_id IS NOT NULL AND campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        )) OR
        -- Admins and managers can view all
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin', 'super_admin')
        )
    );

-- =====================================================
-- 9. AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Only Admins and Super Admins can view audit logs
CREATE POLICY "Only Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 10. OPTIMIZED VIEWS FOR COMMON QUERIES
-- =====================================================

-- Creator dashboard view with joined data
CREATE OR REPLACE VIEW creator_dashboard_view AS
SELECT 
    c.id,
    c.name,
    c.instagram_handle,
    c.follower_count,
    c.niche,
    c.performance_score,
    COUNT(DISTINCT camp.id) as total_campaigns,
    COUNT(DISTINCT p.id) as total_payments,
    COALESCE(SUM(p.amount), 0) as total_earnings,
    c.created_at,
    c.updated_at
FROM creators c
LEFT JOIN campaign_creators cc ON c.id = cc.creator_id
LEFT JOIN campaigns camp ON cc.campaign_id = camp.id
LEFT JOIN payments p ON c.id = p.creator_id
GROUP BY c.id, c.name, c.instagram_handle, c.follower_count, c.niche, c.performance_score, c.created_at, c.updated_at;

-- Campaign dashboard view with joined data
CREATE OR REPLACE VIEW campaign_dashboard_view AS
SELECT 
    camp.id,
    camp.name,
    camp.status,
    camp.budget,
    camp.start_date,
    camp.end_date,
    b.name as brand_name,
    COUNT(DISTINCT cc.creator_id) as creator_count,
    COUNT(DISTINCT d.id) as deliverable_count,
    COALESCE(SUM(p.amount), 0) as total_spent,
    camp.created_at,
    camp.updated_at
FROM campaigns camp
LEFT JOIN brands b ON camp.brand_id = b.id
LEFT JOIN campaign_creators cc ON camp.id = cc.campaign_id
LEFT JOIN deliverables d ON camp.id = d.campaign_id
LEFT JOIN payments p ON camp.id = p.campaign_id
GROUP BY camp.id, camp.name, camp.status, camp.budget, camp.start_date, camp.end_date, b.name, camp.created_at, camp.updated_at;

-- Payment summary view
CREATE OR REPLACE VIEW payment_summary_view AS
SELECT 
    p.id,
    p.amount,
    p.status,
    p.due_date,
    p.created_at,
    c.name as creator_name,
    c.instagram_handle,
    camp.name as campaign_name,
    b.name as brand_name,
    pr.role as created_by_role
FROM payments p
LEFT JOIN creators c ON p.creator_id = c.id
LEFT JOIN campaigns camp ON p.campaign_id = camp.id
LEFT JOIN brands b ON camp.brand_id = b.id
LEFT JOIN profiles pr ON p.created_by = pr.id;

-- =====================================================
-- 11. SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'super_admin'
    ) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin' AND permission IN (
            'view_campaigns', 'view_creators', 'view_payments', 'export_data'
        )
    ) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'manager' AND permission IN (
            'view_campaigns', 'view_creators', 'import_data'
        )
    ) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'user' AND permission IN (
            'view_campaigns', 'view_creators'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role efficiently
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM profiles WHERE id = user_id),
        'user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_creators_performance_score ON creators(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_creators_niche ON creators(niche);
CREATE INDEX IF NOT EXISTS idx_creators_created_by ON creators(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_creator_id ON payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_payments_campaign_id ON payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_campaign_id ON deliverables(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_creator_id ON deliverables(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_creator_id ON analytics(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON analytics(campaign_id);

-- Composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_campaign_creators_composite ON campaign_creators(campaign_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_due_date ON payments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_dates ON campaigns(status, start_date, end_date);

-- =====================================================
-- 13. TRIGGERS FOR AUDIT LOGGING
-- =====================================================

-- Function to log changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_creators_trigger
    AFTER INSERT OR UPDATE OR DELETE ON creators
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- 14. SAMPLE OPTIMIZED QUERIES
-- =====================================================

-- Optimized dashboard data query (replaces multiple API calls)
/*
WITH dashboard_metrics AS (
    SELECT 
        (SELECT COUNT(*) FROM creators) as total_creators,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status IN ('pending', 'overdue')) as pending_payments,
        (SELECT COUNT(*) FROM creators WHERE performance_score > 80) as top_performers
),
recent_activities AS (
    SELECT 
        id,
        'creator_added' as type,
        name || ' added' as description,
        created_at as timestamp,
        'System' as user
    FROM creators 
    ORDER BY created_at DESC 
    LIMIT 5
)
SELECT * FROM dashboard_metrics, recent_activities;
*/

-- Optimized creator performance query
/*
SELECT 
    c.*,
    COUNT(DISTINCT camp.id) as campaign_count,
    COALESCE(AVG(d.engagement_rate), 0) as avg_engagement,
    COALESCE(SUM(p.amount), 0) as total_earnings
FROM creators c
LEFT JOIN campaign_creators cc ON c.id = cc.creator_id
LEFT JOIN campaigns camp ON cc.campaign_id = camp.id
LEFT JOIN deliverables d ON c.id = d.creator_id
LEFT JOIN payments p ON c.id = p.creator_id
WHERE c.performance_score > 70
GROUP BY c.id
ORDER BY c.performance_score DESC
LIMIT 50;
*/

-- =====================================================
-- 15. CLEANUP OLD POLICIES (if they exist)
-- =====================================================

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;

-- Add any additional cleanup as needed...

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN (
    'profiles', 'creators', 'campaigns', 'brands', 'payments', 'deliverables', 'analytics', 'audit_logs'
);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check function permissions
SELECT proname, proowner, prosecdef, prolang 
FROM pg_proc 
WHERE proname IN ('has_permission', 'get_user_role', 'audit_trigger_function');

-- This script provides comprehensive RLS implementation with:
-- 1. Role-based access control
-- 2. Optimized queries with JOINs
-- 3. Audit logging
-- 4. Performance indexes
-- 5. Security functions
-- 6. Data isolation
