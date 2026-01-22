-- Location: supabase/migrations/20251224135523_brand_contact_management.sql
-- Schema Analysis: Existing tables (campaigns, creators, profiles), building brand & contact management on top
-- Integration Type: NEW_MODULE - Adding brand and contact tables
-- Dependencies: public.profiles (for user relationships)

-- 1. Types for Brand & Contact Management
CREATE TYPE public.brand_category AS ENUM ('fashion', 'beauty', 'technology', 'food', 'lifestyle', 'sports', 'entertainment', 'other');
CREATE TYPE public.contact_type AS ENUM ('primary', 'secondary', 'billing', 'technical');

-- 2. Core Tables
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category public.brand_category DEFAULT 'other'::public.brand_category,
    website TEXT,
    logo_url TEXT,
    description TEXT,
    industry TEXT,
    headquarters TEXT,
    employee_count INTEGER,
    annual_revenue NUMERIC(15,2),
    social_media_links JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    designation TEXT,
    contact_type public.contact_type DEFAULT 'primary'::public.contact_type,
    linkedin_url TEXT,
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Junction table for brand-campaign relationship
CREATE TABLE public.brand_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, campaign_id)
);

-- 4. Essential Indexes
CREATE INDEX idx_brands_created_by ON public.brands(created_by);
CREATE INDEX idx_brands_category ON public.brands(category);
CREATE INDEX idx_brands_name ON public.brands(name);
CREATE INDEX idx_contacts_brand_id ON public.contacts(brand_id);
CREATE INDEX idx_contacts_created_by ON public.contacts(created_by);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_is_primary ON public.contacts(is_primary);
CREATE INDEX idx_brand_campaigns_brand_id ON public.brand_campaigns(brand_id);
CREATE INDEX idx_brand_campaigns_campaign_id ON public.brand_campaigns(campaign_id);

-- 5. Functions (BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.update_brands_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 6. Triggers
CREATE TRIGGER trigger_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_brands_updated_at();

CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_contacts_updated_at();

-- 7. Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (Pattern 4: Public Read, Private Write)
-- Brands: Everyone can read, only authenticated can manage their own
CREATE POLICY "public_can_read_brands"
ON public.brands
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_manage_own_brands"
ON public.brands
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Contacts: Everyone can read, only authenticated can manage their own
CREATE POLICY "public_can_read_contacts"
ON public.contacts
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_manage_own_contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Brand Campaigns: Everyone can read, authenticated can manage
CREATE POLICY "public_can_read_brand_campaigns"
ON public.brand_campaigns
FOR SELECT
TO public
USING (true);

CREATE POLICY "authenticated_manage_brand_campaigns"
ON public.brand_campaigns
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Mock Data
DO $$
DECLARE
    existing_user_id UUID;
    brand1_id UUID := gen_random_uuid();
    brand2_id UUID := gen_random_uuid();
    brand3_id UUID := gen_random_uuid();
    existing_campaign_id UUID;
BEGIN
    -- Get existing user ID from profiles
    SELECT id INTO existing_user_id FROM public.profiles LIMIT 1;
    
    -- Only proceed if user exists
    IF existing_user_id IS NOT NULL THEN
        -- Insert brands
        INSERT INTO public.brands (id, name, category, website, description, industry, headquarters, employee_count, created_by) VALUES
            (brand1_id, 'TechStyle Fashion Group', 'fashion', 'https://techstyle.com', 'Leading fashion and lifestyle subscription company', 'Fashion & Retail', 'Los Angeles, USA', 800, existing_user_id),
            (brand2_id, 'BeautyConnect', 'beauty', 'https://beautyconnect.com', 'Innovative beauty and cosmetics brand', 'Beauty & Cosmetics', 'Mumbai, India', 150, existing_user_id),
            (brand3_id, 'FitLife Nutrition', 'lifestyle', 'https://fitlifenutrition.com', 'Health and wellness nutrition brand', 'Health & Wellness', 'New York, USA', 50, existing_user_id);
        
        -- Insert contacts for brands
        INSERT INTO public.contacts (brand_id, full_name, email, phone, whatsapp, designation, contact_type, is_primary, created_by) VALUES
            (brand1_id, 'Sarah Johnson', 'sarah.johnson@techstyle.com', '+1-415-555-0123', '+1-415-555-0123', 'Marketing Director', 'primary', true, existing_user_id),
            (brand1_id, 'Michael Chen', 'michael.chen@techstyle.com', '+1-415-555-0124', '+1-415-555-0124', 'Brand Manager', 'secondary', false, existing_user_id),
            (brand2_id, 'Priya Sharma', 'priya.sharma@beautyconnect.com', '+91-98765-43210', '+91-98765-43210', 'Head of Partnerships', 'primary', true, existing_user_id),
            (brand3_id, 'Alex Thompson', 'alex.thompson@fitlife.com', '+1-212-555-0150', '+1-212-555-0150', 'CEO', 'primary', true, existing_user_id);
        
        -- Link brands to existing campaigns if any exist
        SELECT id INTO existing_campaign_id FROM public.campaigns LIMIT 1;
        IF existing_campaign_id IS NOT NULL THEN
            INSERT INTO public.brand_campaigns (brand_id, campaign_id) VALUES
                (brand1_id, existing_campaign_id);
        END IF;
    END IF;
END $$;