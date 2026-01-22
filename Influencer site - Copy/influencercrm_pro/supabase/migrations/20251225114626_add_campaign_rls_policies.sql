-- Location: supabase/migrations/20251225114626_add_campaign_rls_policies.sql
-- Schema Analysis: campaigns table exists with only SELECT policy
-- Integration Type: enhancement - adding INSERT, UPDATE, DELETE policies
-- Dependencies: campaigns, creators tables

-- Add RLS policies for campaign CRUD operations
-- Pattern: Public Read, Authenticated Write

-- Allow authenticated users to insert campaigns
CREATE POLICY "authenticated_users_can_create_campaigns"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update campaigns
CREATE POLICY "authenticated_users_can_update_campaigns"
ON public.campaigns
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete campaigns
CREATE POLICY "authenticated_users_can_delete_campaigns"
ON public.campaigns
FOR DELETE
TO authenticated
USING (true);